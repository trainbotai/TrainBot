import Foundation
import SwiftUI
import CoreData

@MainActor
final class BiasLessonViewModel: ObservableObject {

    enum Step: Int, CaseIterable {
        case intro = 0
        case training
        case testing
        case conclusion
    }

    // MARK: Published

    @Published var step: Step = .intro
    @Published var isTraining = false
    @Published var trainingProgress: Double = 0
    @Published var trainedClassifier: TrainedClassifier?
    @Published var testPrediction: TrainedClassifier.Prediction?
    @Published var trainingError: String?
    @Published var achievementUnlocked = false

    // MARK: Private

    private let trainer = ImageClassifierTrainer()
    private let context: NSManagedObjectContext

    init(context: NSManagedObjectContext) {
        self.context = context
    }

    // MARK: - Navigation

    func nextStep() {
        switch step {
        case .intro:
            step = .training
        case .training:
            step = .testing
        case .testing:
            step = .conclusion
            unlockAchievement()
        case .conclusion:
            break
        }
    }

    // MARK: - Training

    /// Trains a throwaway model on red-apple images + a tiny "altceva" class
    /// so the real pipeline is satisfied (requires ≥2 labels, ≥5 images each).
    func trainRedAppleModel() async {
        isTraining = true
        trainingProgress = 0
        trainingError = nil
        defer { isTraining = false }

        let redApples = BiasLessonDemoImages.redApples       // 5 images
        // Generate 5 plain grey squares as the "altceva" class
        let altcevaImages = (0..<5).map { i in solidColorImage(hue: CGFloat(i) * 0.15 + 0.5) }

        let dataset: [String: [UIImage]] = [
            "Mar rosu": redApples,
            "Altceva": altcevaImages
        ]

        do {
            let classifier = try await trainer.train(labeledImages: dataset) { [weak self] progress in
                Task { @MainActor in
                    switch progress.phase {
                    case .preparing: self?.trainingProgress = 0.1
                    case .training(let p): self?.trainingProgress = 0.1 + p * 0.7
                    case .evaluating: self?.trainingProgress = 0.85
                    case .finalizing: self?.trainingProgress = 1.0
                    }
                }
            }
            trainedClassifier = classifier
        } catch {
            trainingError = "Antrenarea a esuat: \(error.localizedDescription)"
        }
    }

    // MARK: - Testing

    func testGreenApple() async {
        guard let classifier = trainedClassifier else { return }
        let greenApple = BiasLessonDemoImages.greenApple
        do {
            testPrediction = try await classifier.predict(image: greenApple)
        } catch {
            trainingError = error.localizedDescription
        }
    }

    // MARK: - Achievement

    private func unlockAchievement() {
        let service = AchievementsService(context: context)
        service.recordBiasLessonCompleted()
        achievementUnlocked = true
    }

    // MARK: - Helpers

    private func solidColorImage(hue: CGFloat) -> UIImage {
        let size = CGSize(width: 224, height: 224)
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { ctx in
            UIColor(hue: hue, saturation: 0.5, brightness: 0.8, alpha: 1).setFill()
            ctx.fill(CGRect(origin: .zero, size: size))
        }
    }
}
