import CoreData
import os

final class PersistenceController {
    static let shared = PersistenceController()

    /// Loaded once: several NSManagedObjectModel instances make entity lookups ambiguous.
    private static let model: NSManagedObjectModel = {
        let url = Bundle(for: PersistenceController.self).url(forResource: "TrainBot", withExtension: "momd")!
        return NSManagedObjectModel(contentsOf: url)!
    }()

    private static let log = Logger(subsystem: "com.trainbot", category: "persistence")

    let container: NSPersistentContainer

    private init(inMemory: Bool = false) {
        container = NSPersistentContainer(name: "TrainBot", managedObjectModel: Self.model)
        if inMemory {
            container.persistentStoreDescriptions.first?.url = URL(fileURLWithPath: "/dev/null")
        }
        if let error = loadStores() {
            // Never crash-loop on a broken store: rebuild it (local data is lost), else go in-memory.
            Self.log.error("Core Data load failed, recreating store (local data lost): \(error.localizedDescription)")
            destroyStores()
            if let error = loadStores() {
                Self.log.error("Recreate failed, using in-memory store: \(error.localizedDescription)")
                container.persistentStoreDescriptions.forEach { $0.type = NSInMemoryStoreType; $0.url = nil }
                if let error = loadStores() {
                    Self.log.fault("In-memory store failed: \(error.localizedDescription)")
                }
            }
        }
        container.viewContext.automaticallyMergesChangesFromParent = true
    }

    /// Returns the first load error, if any.
    private func loadStores() -> Error? {
        var failure: Error?
        container.loadPersistentStores { _, error in
            if failure == nil { failure = error }
        }
        return failure
    }

    private func destroyStores() {
        let coordinator = container.persistentStoreCoordinator
        for description in container.persistentStoreDescriptions {
            guard let url = description.url else { continue }
            try? coordinator.destroyPersistentStore(at: url, ofType: description.type, options: nil)
        }
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
