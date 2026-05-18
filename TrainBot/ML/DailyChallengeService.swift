import Foundation
import CoreData

struct DailyChallenge {
    let dateKey: String
    let description: String
    let goal: Int
    var progress: Int
    var completed: Bool
}

final class DailyChallengeService {
    private let templates: [(String, Int)] = [
        ("Antreneaza 5 poze noi", 5),
        ("Testeaza 3 imagini", 3),
        ("Adauga o eticheta noua", 1),
        ("Antreneaza un model", 1)
    ]

    private let context: NSManagedObjectContext

    init(context: NSManagedObjectContext) { self.context = context }

    func todayChallenge() -> DailyChallenge {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let key = formatter.string(from: Date())

        let req: NSFetchRequest<DailyChallengeEntity> = DailyChallengeEntity.fetchRequest()
        req.predicate = NSPredicate(format: "dateKey == %@", key)
        if let existing = try? context.fetch(req).first {
            return DailyChallenge(
                dateKey: existing.dateKey ?? key,
                description: existing.descriptionText ?? "",
                goal: Int(existing.goal),
                progress: Int(existing.progress),
                completed: existing.completed
            )
        }

        // Generate deterministic from date
        let seed = key.reduce(0) { $0 + Int($1.asciiValue ?? 0) }
        let template = templates[seed % templates.count]

        let entity = DailyChallengeEntity(context: context)
        entity.dateKey = key
        entity.descriptionText = template.0
        entity.goal = Int32(template.1)
        entity.progress = 0
        entity.completed = false
        try? context.save()

        return DailyChallenge(dateKey: key, description: template.0, goal: template.1, progress: 0, completed: false)
    }

    func incrementProgress(by amount: Int = 1) {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let key = formatter.string(from: Date())
        let req: NSFetchRequest<DailyChallengeEntity> = DailyChallengeEntity.fetchRequest()
        req.predicate = NSPredicate(format: "dateKey == %@", key)
        guard let entity = try? context.fetch(req).first else { return }
        entity.progress = min(entity.progress + Int32(amount), entity.goal)
        if entity.progress >= entity.goal { entity.completed = true }
        try? context.save()
    }
}
