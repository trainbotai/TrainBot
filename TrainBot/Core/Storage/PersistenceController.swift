import CoreData

final class PersistenceController {
    static let shared = PersistenceController()

    let container: NSPersistentContainer

    private init(inMemory: Bool = false) {
        container = NSPersistentContainer(name: "TrainBot")
        if inMemory {
            container.persistentStoreDescriptions.first?.url = URL(fileURLWithPath: "/dev/null")
        }
        container.loadPersistentStores { _, error in
            if let error = error as NSError? {
                fatalError("Core Data load failed: \(error), \(error.userInfo)")
            }
        }
        container.viewContext.automaticallyMergesChangesFromParent = true
    }

    static func makeInMemory() -> PersistenceController {
        PersistenceController(inMemory: true)
    }

    func save() throws {
        let ctx = container.viewContext
        guard ctx.hasChanges else { return }
        try ctx.save()
    }
}
