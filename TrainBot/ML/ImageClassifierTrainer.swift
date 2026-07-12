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

        // 1. Convert images to annotated CIImage features, cu split train/validare
        //    per etichetă (~20% held-out). Evaluăm pe held-out ca acuratețea să fie
        //    ONESTĂ — nu pe setul de antrenare (unde ar fi ~100% mereu, iar în
        //    aplicația asta care predă tocmai despre asta ar fi anti-pedagogic).
        var trainFeatures: [AnnotatedFeature<CIImage, String>] = []
        var holdoutFeatures: [AnnotatedFeature<CIImage, String>] = []
        for (label, images) in labeledImages {
            for (idx, image) in images.enumerated() {
                guard let cgImage = image.cgImage else { continue }
                let feature = AnnotatedFeature(feature: CIImage(cgImage: cgImage), annotation: label)
                // Held-out determinist: fiecare a 5-a imagine (dar niciodată prima,
                // ca fiecare etichetă să păstreze cel puțin o poză de antrenare).
                if idx > 0 && idx % 5 == 0 {
                    holdoutFeatures.append(feature)
                } else {
                    trainFeatures.append(feature)
                }
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
            trainedModel = try await pipeline.fitted(to: trainFeatures)
        } catch {
            throw TrainerError.trainingFailed(error)
        }

        progress(Progress(phase: .evaluating))

        // 3. Acuratețe pe held-out (fallback pe train dacă held-out e gol —
        //    ex. o etichetă cu foarte puține poze).
        let evalSet = holdoutFeatures.isEmpty ? trainFeatures : holdoutFeatures
        var correct = 0
        for item in evalSet {
            if let dist = try? await trainedModel.applied(to: item.feature),
               dist.mostLikelyLabel == item.annotation {
                correct += 1
            }
        }
        let accuracy = evalSet.isEmpty ? 0.0 : Double(correct) / Double(evalSet.count)

        progress(Progress(phase: .finalizing))

        // 4. Export to .mlpackage and compile
        let tempDir = FileManager.default.temporaryDirectory
            .appendingPathComponent("trainbot-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: tempDir) }

        let packageURL = tempDir.appendingPathComponent("model.mlpackage")
        try trainedModel.export(to: packageURL)

        // compileModel produce un .mlmodelc într-o locație de sistem separată de
        // tempDir (deci supraviețuiește defer-ului). Repository-ul îl copiază
        // imediat în Documents. ATENȚIE: înainte salvam doar Manifest.json →
        // tab-ul Testează era complet nefuncțional pe modele persistate.
        let compiledURL = try await MLModel.compileModel(at: packageURL)
        let mlModel = try MLModel(contentsOf: compiledURL)
        guard let visionModel = try? VNCoreMLModel(for: mlModel) else {
            throw TrainerError.modelLoadFailed
        }

        return TrainedClassifier(
            model: mlModel,
            visionModel: visionModel,
            labels: Array(labeledImages.keys),
            accuracy: accuracy,
            compiledModelURL: compiledURL
        )
    }
}
