import Foundation
import SwiftUI
import CoreData

@MainActor
final class LabelLessonViewModel: ObservableObject {

    enum Step: Int, CaseIterable {
        case intro = 0
        case labeling
        case conclusion
    }

    // Represents one image card the kid can tap to assign a label
    struct ImageCard: Identifiable {
        let id: Int
        let image: UIImage
        let correctLabel: String   // "Măr" or "Minge"
        var assignedLabel: String? = nil
    }

    // MARK: Published

    @Published var step: Step = .intro
    @Published var cards: [ImageCard] = []
    @Published var achievementUnlocked = false

    // MARK: Private

    private let context: NSManagedObjectContext

    init(context: NSManagedObjectContext) {
        self.context = context
        buildCards()
    }

    // MARK: - Navigation

    func nextStep() {
        switch step {
        case .intro:
            step = .labeling
        case .labeling:
            step = .conclusion
            unlockAchievement()
        case .conclusion:
            break
        }
    }

    // MARK: - Labeling

    var allLabeled: Bool {
        cards.allSatisfy { $0.assignedLabel != nil }
    }

    func assign(label: String, to cardID: Int) {
        guard let idx = cards.firstIndex(where: { $0.id == cardID }) else { return }
        cards[idx].assignedLabel = label
        Haptics.tap()
    }

    func countAssigned(to label: String) -> Int {
        cards.filter { $0.assignedLabel == label }.count
    }

    // MARK: - Achievement

    private func unlockAchievement() {
        let service = AchievementsService(context: context)
        service.recordLabelLessonCompleted()
        achievementUnlocked = true
    }

    // MARK: - Build demo cards

    private func buildCards() {
        let apples = LabelLessonDemoImages.apples    // 2 apple images
        let balls  = LabelLessonDemoImages.balls     // 2 ball images
        cards = [
            ImageCard(id: 0, image: apples[0], correctLabel: "Măr"),
            ImageCard(id: 1, image: balls[0],  correctLabel: "Minge"),
            ImageCard(id: 2, image: apples[1], correctLabel: "Măr"),
            ImageCard(id: 3, image: balls[1],  correctLabel: "Minge"),
        ]
    }
}
