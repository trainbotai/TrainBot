import Foundation
import CoreML
import UIKit
import Vision

struct TrainedClassifier {
    let model: MLModel
    let visionModel: VNCoreMLModel
    let labels: [String]
    let accuracy: Double
    let modelData: Data

    struct Prediction {
        let label: String
        let confidence: Double
        let allConfidences: [String: Double]
    }

    func predict(image: UIImage) async throws -> Prediction {
        guard let cgImage = image.cgImage else {
            throw NSError(domain: "TrainedClassifier", code: 1, userInfo: [NSLocalizedDescriptionKey: "Cannot get CGImage"])
        }
        return try await withCheckedThrowingContinuation { continuation in
            let request = VNCoreMLRequest(model: visionModel) { request, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                guard let results = request.results as? [VNClassificationObservation], let top = results.first else {
                    continuation.resume(throwing: NSError(domain: "TrainedClassifier", code: 2))
                    return
                }
                var all: [String: Double] = [:]
                for r in results { all[r.identifier] = Double(r.confidence) }
                continuation.resume(returning: Prediction(label: top.identifier, confidence: Double(top.confidence), allConfidences: all))
            }
            request.imageCropAndScaleOption = .centerCrop
            let handler = VNImageRequestHandler(cgImage: cgImage)
            DispatchQueue.global(qos: .userInitiated).async {
                do { try handler.perform([request]) } catch { continuation.resume(throwing: error) }
            }
        }
    }
}
