import XCTest
import CoreData
@testable import TrainBot

final class PersistenceControllerTests: XCTestCase {
    func test_inMemoryStore_loadsSuccessfully() {
        let pc = PersistenceController.makeInMemory()
        XCTAssertNotNil(pc.container.viewContext)
    }

    func test_save_withNoChanges_doesNotThrow() throws {
        let pc = PersistenceController.makeInMemory()
        XCTAssertNoThrow(try pc.save())
    }

    func test_createMLProject_persists() throws {
        let pc = PersistenceController.makeInMemory()
        let ctx = pc.container.viewContext
        let project = MLProjectEntity(context: ctx)
        project.id = UUID()
        project.name = "Test"
        project.createdAt = Date()
        project.updatedAt = Date()
        try pc.save()

        let fetch: NSFetchRequest<MLProjectEntity> = MLProjectEntity.fetchRequest()
        let results = try ctx.fetch(fetch)
        XCTAssertEqual(results.count, 1)
        XCTAssertEqual(results.first?.name, "Test")
    }

    func test_relationship_labelToProject_works() throws {
        let pc = PersistenceController.makeInMemory()
        let ctx = pc.container.viewContext
        let project = MLProjectEntity(context: ctx)
        project.id = UUID()
        project.name = "P"
        project.createdAt = Date()
        project.updatedAt = Date()
        let label = MLLabelEntity(context: ctx)
        label.id = UUID()
        label.name = "L"
        label.project = project
        try pc.save()

        let fetch: NSFetchRequest<MLLabelEntity> = MLLabelEntity.fetchRequest()
        let labels = try ctx.fetch(fetch)
        XCTAssertEqual(labels.first?.project?.name, "P")
    }

    func test_cascadeDelete_projectDeletesLabels() throws {
        let pc = PersistenceController.makeInMemory()
        let ctx = pc.container.viewContext
        let project = MLProjectEntity(context: ctx)
        project.id = UUID()
        project.name = "P"
        project.createdAt = Date()
        project.updatedAt = Date()
        let label = MLLabelEntity(context: ctx)
        label.id = UUID()
        label.name = "L"
        label.project = project
        try pc.save()

        ctx.delete(project)
        try pc.save()

        let fetch: NSFetchRequest<MLLabelEntity> = MLLabelEntity.fetchRequest()
        let count = try ctx.count(for: fetch)
        XCTAssertEqual(count, 0, "Cascade delete should remove labels when project is deleted")
    }
}
