import Foundation
@preconcurrency import CreateMLComponents
import CoreImage
import CoreML
import UIKit
import Vision

enum TrainerError: Error {
    case insufficientLabels
    case insufficientImagesPerLabel(label: String, count: Int)
    case trainingFailed(Error)
    case modelLoadFailed
}

final class ImageClassifierTrainer {
    struct Progress {
        enum Phase { case preparing, training(percent: Double), evaluating, finalizing }
        let phase: Phase
    }

    static let minLabels = 2
    static let minImagesPerLabel = 5

    func train(
        labeledImages: [String: [UIImage]],
        progress: @escaping (Progress) -> Void
    ) async throws -> TrainedClassifier {

        guard labeledImages.count >= Self.minLabels else { throw TrainerError.insufficientLabels }
        for (label, images) in labeledImages where images.count < Self.minImagesPerLabel {
            throw TrainerError.insufficientImagesPerLabel(label: label, count: images.count)
        }

        progress(Progress(phase: .preparing))

        // 1. Convert images to annotated CIImage features
        var annotatedFeatures: [AnnotatedFeature<CIImage, String>] = []
        for (label, images) in labeledImages {
            for image in images {
                guard let cgImage = image.cgImage else { continue }
                let ciImage = CIImage(cgImage: cgImage)
                annotatedFeatures.append(AnnotatedFeature(feature: ciImage, annotation: label))
            }
        }

        progress(Progress(phase: .training(percent: 0)))

        // 2. Build pipeline: ImageFeaturePrint + FullyConnectedNetworkClassifier
        let featureExtractor = ImageFeaturePrint(cropAndScale: .centerCrop)
        let labels = Set(labeledImages.keys)
        let classifier = FullyConnectedNetworkClassifier<Float, String>(labels: labels)
        let pipeline = PreprocessingSupervisedEstimator(featureExtractor, classifier)

        let trainedModel: ComposedTransformer<ImageFeaturePrint, FullyConnectedNetworkClassifierModel<Float, String>>
        do {
            trainedModel = try await Task.detached(priority: .userInitiated) {
                try await pipeline.fitted(to: annotatedFeatures)
            }.value
        } catch {
            throw TrainerError.trainingFailed(error)
        }

        progress(Progress(phase: .evaluating))

        // 3. Compute training accuracy by running predictions
        var correct = 0
        for item in annotatedFeatures {
            if let dist = try? await trainedModel.applied(to: item.feature),
               dist.mostLikelyLabel == item.annotation {
                correct += 1
            }
        }
        let accuracy = annotatedFeatures.isEmpty ? 0.0 : Double(correct) / Double(annotatedFeatures.count)

        progress(Progress(phase: .finalizing))

        // 4. Export to .mlpackage and compile
        let tempDir = FileManager.default.temporaryDirectory
            .appendingPathComponent("trainbot-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: tempDir) }

        let packageURL = tempDir.appendingPathComponent("model.mlpackage")
        try trainedModel.export(to: packageURL)

        let compiledURL = try await MLModel.compileModel(at: packageURL)
        let mlModel = try MLModel(contentsOf: compiledURL)
        let modelData = try Data(contentsOf: packageURL.appendingPathComponent("Manifest.json"))
        guard let visionModel = try? VNCoreMLModel(for: mlModel) else {
            throw TrainerError.modelLoadFailed
        }

        return TrainedClassifier(
            model: mlModel,
            visionModel: visionModel,
            labels: Array(labeledImages.keys),
            accuracy: accuracy,
            modelData: modelData
        )
    }
}
