import Foundation
import SwiftUI
import CoreData

@MainActor
final class MoreDataLessonViewModel: ObservableObject {

    enum Step: Int, CaseIterable {
        case intro = 0
        case fewData
        case moreData
        case conclusion
    }

    // MARK: Published

    @Published var step: Step = .intro
    @Published var isTraining = false
    @Published var trainingProgress: Double = 0
    @Published var trainingError: String?

    @Published var fewDataClassifier: TrainedClassifier?
    @Published var fewDataPrediction: TrainedClassifier.Prediction?

    @Published var moreDataClassifier: TrainedClassifier?
    @Published var moreDataPrediction: TrainedClassifier.Prediction?

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
        case .intro:    step = .fewData
        case .fewData:  step = .moreData
        case .moreData: step = .conclusion; unlockAchievement()
        case .conclusion: break
        }
    }

    // MARK: - Training with FEW data (2 apple images)

    /// Trains with 2 apples + 5 filler "altceva" images (satisfying ≥2 labels, ≥5 images).
    func trainFewData() async {
        isTraining = true
        trainingProgress = 0
        trainingError = nil
        defer { isTraining = false }

        let fewApples = MoreDataLessonDemoImages.apples(count: 2)
        // Pad to minimum 5 with extra synthetic variations
        let paddedApples = fewApples + (0..<3).map { i in solidColorImage(hue: 0.08, brightness: 0.75 - CGFloat(i) * 0.05) }
        let altceva = (0..<5).map { i in solidColorImage(hue: CGFloat(i) * 0.15 + 0.4) }

        let dataset: [String: [UIImage]] = [
            "Mar": paddedApples,
            "Altceva": altceva
        ]

        do {
            fewDataClassifier = try await trainer.train(labeledImages: dataset) { [weak self] p in
                Task { @MainActor in self?.trainingProgress = progressValue(p) }
            }
        } catch {
            trainingError = "Antrenarea a eșuat: \(error.localizedDescription)"
        }
    }

    func testFewData() async {
        guard let classifier = fewDataClassifier else { return }
        let testImage = MoreDataLessonDemoImages.testApple
        do {
            fewDataPrediction = try await classifier.predict(image: testImage)
        } catch {
            trainingError = error.localizedDescription
        }
    }

    // MARK: - Training with MORE data (6 apple images)

    /// Trains with 6 apples + 5 filler, then retests same apple.
    func trainMoreData() async {
        isTraining = true
        trainingProgress = 0
        trainingError = nil
        defer { isTraining = false }

        let manyApples = MoreDataLessonDemoImages.apples(count: 6)
        let altceva = (0..<5).map { i in solidColorImage(hue: CGFloat(i) * 0.15 + 0.4) }

        let dataset: [String: [UIImage]] = [
            "Mar": manyApples,
            "Altceva": altceva
        ]

        do {
            moreDataClassifier = try await trainer.train(labeledImages: dataset) { [weak self] p in
                Task { @MainActor in self?.trainingProgress = progressValue(p) }
            }
        } catch {
            trainingError = "Antrenarea a eșuat: \(error.localizedDescription)"
        }
    }

    func testMoreData() async {
        guard let classifier = moreDataClassifier else { return }
        let testImage = MoreDataLessonDemoImages.testApple
        do {
            moreDataPrediction = try await classifier.predict(image: testImage)
        } catch {
            trainingError = error.localizedDescription
        }
    }

    // MARK: - Achievement

    private func unlockAchievement() {
        let service = AchievementsService(context: context)
        service.recordMoreDataLessonCompleted()
        achievementUnlocked = true
    }

    // MARK: - Helpers

    private func solidColorImage(hue: CGFloat, brightness: CGFloat = 0.8) -> UIImage {
        let size = CGSize(width: 224, height: 224)
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { ctx in
            UIColor(hue: hue, saturation: 0.5, brightness: brightness, alpha: 1).setFill()
            ctx.fill(CGRect(origin: .zero, size: size))
        }
    }
}

// MARK: - Progress helper (free function, no self capture needed)

private func progressValue(_ progress: ImageClassifierTrainer.Progress) -> Double {
    switch progress.phase {
    case .preparing: return 0.1
    case .training(let p): return 0.1 + p * 0.7
    case .evaluating: return 0.85
    case .finalizing: return 1.0
    }
}
