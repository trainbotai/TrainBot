import Foundation
import CoreData

struct AchievementDefinition: Identifiable {
    let id: String
    let title: String
    let description: String
    let icon: String
    let target: Int
}

enum AchievementCatalog {
    static let all: [AchievementDefinition] = [
        .init(id: "first_image", title: "Prima poza", description: "Adauga prima poza", icon: "photo", target: 1),
        .init(id: "ten_images", title: "Antrenor", description: "Adauga 10 poze", icon: "photo.stack", target: 10),
        .init(id: "fifty_images", title: "Profesor", description: "Adauga 50 de poze", icon: "rosette", target: 50),
        .init(id: "first_model", title: "Primul AI", description: "Antreneaza primul model", icon: "brain.head.profile", target: 1),
        .init(id: "high_accuracy", title: "Mintea Stralucitoare", description: "Atinge 90% accuracy", icon: "sparkles", target: 1),
        .init(id: "bias_lesson", title: "Detectiv AI", description: "Completeaza lectia despre limitele AI", icon: "magnifyingglass.circle", target: 1),
    ]
}

final class AchievementsService {
    private let context: NSManagedObjectContext
    init(context: NSManagedObjectContext) { self.context = context }

    func loadAll() -> [(AchievementDefinition, Int, Bool)] {
        let req: NSFetchRequest<AchievementEntity> = AchievementEntity.fetchRequest()
        let entities = (try? context.fetch(req)) ?? []
        let map = Dictionary(uniqueKeysWithValues: entities.map { ($0.identifier ?? "", $0) })
        return AchievementCatalog.all.map { def in
            let entity = map[def.id]
            return (def, Int(entity?.progress ?? 0), entity?.unlockedAt != nil)
        }
    }

    func recordImagesAdded(total: Int) {
        bump("first_image", to: min(total, 1))
        bump("ten_images", to: min(total, 10))
        bump("fifty_images", to: min(total, 50))
    }

    func recordModelTrained(accuracy: Double) {
        bump("first_model", to: 1)
        if accuracy >= 0.9 { bump("high_accuracy", to: 1) }
    }

    func recordBiasLessonCompleted() {
        bump("bias_lesson", to: 1)
    }

    private func bump(_ id: String, to value: Int) {
        let req: NSFetchRequest<AchievementEntity> = AchievementEntity.fetchRequest()
        req.predicate = NSPredicate(format: "identifier == %@", id)
        let entity = (try? context.fetch(req).first) ?? AchievementEntity(context: context)
        entity.identifier = id
        entity.progress = max(entity.progress, Int32(value))
        if let def = AchievementCatalog.all.first(where: { $0.id == id }), entity.progress >= def.target, entity.unlockedAt == nil {
            entity.unlockedAt = Date()
        }
        try? context.save()
    }
}
