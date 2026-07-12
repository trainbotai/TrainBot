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

    /// Latura maximă la stocare. O poză de 12MP ținută full-res în RAM ≈ 48MB →
    /// jetsam kill pe device-urile cu 3-4GB (exact publicul țintă). Modelul lucrează
    /// oricum la 224px; 1024px păstrează calitatea pentru afișare.
    private static let maxDimension: CGFloat = 1024

    func save(image: UIImage) throws -> String {
        let filename = "\(UUID().uuidString).jpg"
        let url = rootDirectory.appendingPathComponent(filename)

        // Downscale la maxDimension păstrând proporțiile (fără upscaling).
        let longest = max(image.size.width, image.size.height)
        let scale = longest > Self.maxDimension ? Self.maxDimension / longest : 1
        let targetSize = CGSize(width: image.size.width * scale, height: image.size.height * scale)

        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        let normalized = UIGraphicsImageRenderer(size: targetSize, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: targetSize))
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
