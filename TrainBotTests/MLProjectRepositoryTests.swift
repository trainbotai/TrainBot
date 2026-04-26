import XCTest
import CoreData
import UIKit
@testable import TrainBot

final class MLProjectRepositoryTests: XCTestCase {
    var repo: MLProjectRepository!
    var pc: PersistenceController!
    var tempStorageDir: URL!

    override func setUpWithError() throws {
        pc = PersistenceController.makeInMemory()
        tempStorageDir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: tempStorageDir, withIntermediateDirectories: true)
        let storage = ImageStorage(rootDirectory: tempStorageDir)
        repo = MLProjectRepository(context: pc.container.viewContext, imageStorage: storage)
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: tempStorageDir)
    }

    func test_createProject_returnsProject() throws {
        let project = try repo.createProject(name: "Animale")
        XCTAssertEqual(project.name, "Animale")
        XCTAssertNotNil(project.id)
    }

    func test_addLabel_appearsInProjectLabels() throws {
        let project = try repo.createProject(name: "Test")
        let label = try repo.addLabel(name: "Pisica", to: project)
        let projectLabels = (project.labels?.allObjects as? [MLLabelEntity]) ?? []
        XCTAssertEqual(projectLabels.first?.name, "Pisica")
        XCTAssertEqual(label.name, "Pisica")
    }

    func test_addImage_savesAndAssociates() throws {
        let project = try repo.createProject(name: "Test")
        let label = try repo.addLabel(name: "A", to: project)
        let img = makeRedImage()
        let image = try repo.addImage(img, to: label)
        XCTAssertNotNil(image.filename)
        let labelImages = (label.images?.allObjects as? [MLImageEntity]) ?? []
        XCTAssertEqual(labelImages.count, 1)
    }

    func test_deleteLabel_cascadesImages() throws {
        let project = try repo.createProject(name: "Test")
        let label = try repo.addLabel(name: "A", to: project)
        _ = try repo.addImage(makeRedImage(), to: label)
        try repo.deleteLabel(label)
        let fetch: NSFetchRequest<MLImageEntity> = MLImageEntity.fetchRequest()
        XCTAssertEqual(try pc.container.viewContext.fetch(fetch).count, 0)
    }

    func test_loadAllProjects_returnsAll() throws {
        _ = try repo.createProject(name: "P1")
        _ = try repo.createProject(name: "P2")
        XCTAssertEqual(try repo.loadAllProjects().count, 2)
    }

    func test_loadImages_returnsImagesForLabel() throws {
        let project = try repo.createProject(name: "Test")
        let label = try repo.addLabel(name: "A", to: project)
        _ = try repo.addImage(makeRedImage(), to: label)
        _ = try repo.addImage(makeRedImage(), to: label)
        let loaded = repo.loadImages(for: label)
        XCTAssertEqual(loaded.count, 2)
    }

    func test_deleteImage_removesFromStore() throws {
        let project = try repo.createProject(name: "Test")
        let label = try repo.addLabel(name: "A", to: project)
        let entity = try repo.addImage(makeRedImage(), to: label)
        try repo.deleteImage(entity)
        let labelImages = (label.images?.allObjects as? [MLImageEntity]) ?? []
        XCTAssertEqual(labelImages.count, 0)
    }

    private func makeRedImage(size: CGSize = CGSize(width: 50, height: 50)) -> UIImage {
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { ctx in
            UIColor.red.setFill()
            ctx.fill(CGRect(origin: .zero, size: size))
        }
    }
}
