import Foundation
import CoreML
import UIKit
@preconcurrency import Vision

struct TrainedClassifier {
    let model: MLModel
    let visionModel: VNCoreMLModel
    let labels: [String]
    let accuracy: Double
    /// URL către modelul COMPILAT (.mlmodelc, un director) de la care se persistă
    /// pe disc. nil când clasificatorul a fost încărcat de pe disc.
    let compiledModelURL: URL?

    struct Prediction {
        let label: String
        let confidence: Double
        let allConfidences: [String: Double]
    }

    func predict(image: UIImage) async throws -> Prediction {
        guard let cgImage = image.cgImage else {
            throw NSError(domain: "TrainedClassifier", code: 1, userInfo: [NSLocalizedDescriptionKey: "Cannot get CGImage"])
        }
        let model = visionModel
        return try await Task.detached(priority: .userInitiated) {
            let request = VNCoreMLRequest(model: model)
            request.imageCropAndScaleOption = .centerCrop
            let handler = VNImageRequestHandler(cgImage: cgImage)
            try handler.perform([request])
            guard let results = request.results as? [VNClassificationObservation], let top = results.first else {
                throw NSError(domain: "TrainedClassifier", code: 2)
            }
            var all: [String: Double] = [:]
            for r in results { all[r.identifier] = Double(r.confidence) }
            return Prediction(label: top.identifier, confidence: Double(top.confidence), allConfidences: all)
        }.value
    }
}
