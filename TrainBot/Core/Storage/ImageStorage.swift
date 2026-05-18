import UIKit

enum ImageStorageError: Error {
    case encodingFailed
    case loadFailed
}

final class ImageStorage {
    private let rootDirectory: URL

    init(rootDirectory: URL) {
        self.rootDirectory = rootDirectory
    }

    static let `default`: ImageStorage = {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let imgDir = docs.appendingPathComponent("training-images", isDirectory: true)
        try? FileManager.default.createDirectory(at: imgDir, withIntermediateDirectories: true)
        return ImageStorage(rootDirectory: imgDir)
    }()

    func save(image: UIImage) throws -> String {
        let filename = "\(UUID().uuidString).jpg"
        let url = rootDirectory.appendingPathComponent(filename)

        // Render at scale=1 so pixel size == point size, making decoded image.size match original
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        let normalized = UIGraphicsImageRenderer(size: image.size, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: image.size))
        }
        guard let data = normalized.jpegData(compressionQuality: 0.85) else {
            throw ImageStorageError.encodingFailed
        }

        try FileManager.default.createDirectory(at: rootDirectory, withIntermediateDirectories: true)
        try data.write(to: url, options: .atomic)
        return filename
    }

    func load(filename: String) throws -> UIImage {
        let url = rootDirectory.appendingPathComponent(filename)
        let data = try Data(contentsOf: url)
        guard let image = UIImage(data: data) else {
            throw ImageStorageError.loadFailed
        }
        return image
    }

    func loadJpegData(filename: String) throws -> Data {
        let url = rootDirectory.appendingPathComponent(filename)
        return try Data(contentsOf: url)
    }

    func delete(filename: String) throws {
        let url = rootDirectory.appendingPathComponent(filename)
        try FileManager.default.removeItem(at: url)
    }

    func url(for filename: String) -> URL {
        rootDirectory.appendingPathComponent(filename)
    }
}
