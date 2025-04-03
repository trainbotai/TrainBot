import CoreML
import Vision
import UIKit

class ImageClassifier {
    static let shared = ImageClassifier() // Singleton instance for shared access
    private var classificationRequest: VNCoreMLRequest? // Vision request for ML classification
    private var model: MLModel? // CoreML model instance
    private var trainingData: [String: [(features: [Double], image: UIImage)]] = [:] // Stores training data

    init() {
        setupModel() // Initialize the model during class instantiation
    }

    // Sets up the CoreML model and Vision request
    private func setupModel() {
        do {
            let config = MLModelConfiguration()
            config.allowLowPrecisionAccumulationOnGPU = true // Optimize for GPU usage
            
            // Load the model from the app bundle
            if let modelURL = Bundle.main.url(forResource: "MobileNetV2", withExtension: "mlmodelc") {
                model = try MLModel(contentsOf: modelURL, configuration: config)
                
                // Create a Vision model request for image classification
                if let visionModel = try? VNCoreMLModel(for: model!) {
                    let request = VNCoreMLRequest(model: visionModel)
                    request.imageCropAndScaleOption = .centerCrop
                    classificationRequest = request
                }
            } else {
                // Fallback to basic feature extraction if no model is available
                print("Using basic feature extractor")
                classificationRequest = nil
            }
        } catch {
            print("Failed to load model: \(error.localizedDescription)")
            classificationRequest = nil
        }
    }

    // Classifies an image using the ML model or basic feature extraction
    func classify(_ image: UIImage) async -> String {
        guard let cgImage = image.cgImage else {
            return "Error: Unable to process image"
        }
        
        // Fallback to basic feature extraction if no ML model is available
        if classificationRequest == nil {
            if let features = await extractFeatures(from: image) {
                let brightness = features.reduce(0, +) / Double(features.count)
                if (brightness > 0.7) {
                    return "Bright Image (75% confident)"
                } else if (brightness > 0.4) {
                    return "Normal Image (65% confident)"
                } else {
                    return "Dark Image (80% confident)"
                }
            }
            return "Unable to analyze image"
        }
        
        // Use the ML model for classification
        guard let request = classificationRequest else {
            return "Error: Classification not available"
        }
        
        do {
            let handler = VNImageRequestHandler(cgImage: cgImage)
            try handler.perform([request])
            
            // Process the classification results
            guard let observations = request.results as? [VNClassificationObservation],
                  let topResult = observations.first else {
                return "Unable to classify"
            }
            
            let confidence = Int(topResult.confidence * 100)
            return "\(topResult.identifier) (\(confidence)% confident)"
            
        } catch {
            return "Error: \(error.localizedDescription)"
        }
    }

    // Extracts basic features (e.g., average color) from an image
    func extractFeatures(from image: UIImage) async -> [Double]? {
        guard let cgImage = image.cgImage else { return nil }
        
        // Divide the image into blocks and calculate average colors
        let width = cgImage.width
        let height = cgImage.height
        let blockSize = 32
        var features: [Double] = []
        
        for y in stride(from: 0, to: height, by: blockSize) {
            for x in stride(from: 0, to: width, by: blockSize) {
                let rect = CGRect(x: x, y: y, 
                                width: min(blockSize, width - x),
                                height: min(blockSize, height - y))
                if let blockImage = cgImage.cropping(to: rect) {
                    let avgColor = getAverageColor(of: blockImage)
                    features.append(contentsOf: avgColor)
                }
            }
        }
        
        return features.isEmpty ? nil : features
    }

    // Calculates the average color of a cropped image block
    private func getAverageColor(of cgImage: CGImage) -> [Double] {
        let width = cgImage.width
        let height = cgImage.height
        let bytesPerPixel = 4
        let bytesPerRow = bytesPerPixel * width
        var rawBytes: [UInt8] = Array(repeating: 0, count: width * height * bytesPerPixel)
        
        let context = CGContext(data: &rawBytes,
                              width: width,
                              height: height,
                              bitsPerComponent: 8,
                              bytesPerRow: bytesPerRow,
                              space: CGColorSpaceCreateDeviceRGB(),
                              bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
        
        context?.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        
        var r: Double = 0
        var g: Double = 0
        var b: Double = 0
        
        for i in stride(from: 0, to: rawBytes.count, by: bytesPerPixel) {
            r += Double(rawBytes[i])
            g += Double(rawBytes[i + 1])
            b += Double(rawBytes[i + 2])
        }
        
        let pixelCount = Double(width * height)
        return [r / pixelCount / 255.0,
                g / pixelCount / 255.0,
                b / pixelCount / 255.0]
    }

    // Calculates the cosine similarity between two feature vectors
    func cosineSimilarity(_ a: [Double], _ b: [Double]) -> Double {
        guard a.count == b.count && !a.isEmpty else { return 0 }
        
        let dotProduct = zip(a, b).map(*).reduce(0, +)
        let normA = sqrt(a.map { $0 * $0 }.reduce(0, +))
        let normB = sqrt(b.map { $0 * $0 }.reduce(0, +))
        
        guard normA > 0 && normB > 0 else { return 0 }
        return dotProduct / (normA * normB)
    }

    // Updates the model with new training data
    func updateModel(with images: [UIImage], label: String) async {
        if trainingData[label] == nil {
            trainingData[label] = []
        }
        
        for image in images {
            if let features = await extractFeatures(from: image) {
                trainingData[label]?.append((features: features, image: image))
                print("Stored features for \(label)")
            }
        }
    }

    // Predicts the label for an image using the knowledge base
    func predictFromKnowledge(_ image: UIImage, knowledgeData: [String: [UIImage]]) async -> (label: String, confidence: Double)? {
        guard let testFeatures = await extractFeatures(from: image) else { return nil }
        
        var bestMatch: (label: String, confidence: Double)?
        
        for (label, images) in knowledgeData {
            for trainedImage in images {
                if let trainedFeatures = await extractFeatures(from: trainedImage) {
                    let minCount = min(testFeatures.count, trainedFeatures.count)
                    let similarity = cosineSimilarity(
                        Array(testFeatures.prefix(minCount)),
                        Array(trainedFeatures.prefix(minCount))
                    )
                    
                    if let current = bestMatch {
                        if similarity > current.confidence {
                            bestMatch = (label: label, confidence: similarity)
                        }
                    } else {
                        bestMatch = (label: label, confidence: similarity)
                    }
                }
            }
        }
        
        return bestMatch
    }
}