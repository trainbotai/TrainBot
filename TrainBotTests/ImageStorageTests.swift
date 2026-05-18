import XCTest
import UIKit
@testable import TrainBot

final class ImageStorageTests: XCTestCase {
    var storage: ImageStorage!
    var tempDir: URL!

    override func setUpWithError() throws {
        tempDir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
        storage = ImageStorage(rootDirectory: tempDir)
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: tempDir)
    }

    func test_save_returnsValidFilename() throws {
        let image = UIImage(systemName: "star.fill")!
        let filename = try storage.save(image: image)
        XCTAssertTrue(filename.hasSuffix(".jpg"))
        XCTAssertTrue(FileManager.default.fileExists(atPath: tempDir.appendingPathComponent(filename).path))
    }

    func test_load_returnsSavedImage() throws {
        let image = UIImage(systemName: "star.fill")!
        let filename = try storage.save(image: image)
        let loaded = try storage.load(filename: filename)
        XCTAssertEqual(loaded.size.width, image.size.width, accuracy: 1)
    }

    func test_delete_removesFile() throws {
        let image = UIImage(systemName: "star.fill")!
        let filename = try storage.save(image: image)
        try storage.delete(filename: filename)
        XCTAssertFalse(FileManager.default.fileExists(atPath: tempDir.appendingPathComponent(filename).path))
    }

    func test_load_missingFile_throws() {
        XCTAssertThrowsError(try storage.load(filename: "missing.jpg"))
    }

    func test_url_returnsCorrectPath() {
        let url = storage.url(for: "abc.jpg")
        XCTAssertEqual(url, tempDir.appendingPathComponent("abc.jpg"))
    }
}
