import UIKit

// Manages saving, loading, and deleting images and their metadata
class StorageManager {
    static let shared = StorageManager() // Singleton instance for shared access
    private let defaults = UserDefaults.standard // UserDefaults for storing metadata
    
    // Returns the URL of the folder where images are stored
    private func getImgFolderURL() -> URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("img")
    }
    
    // Saves an image to the file system and associates it with a label
    func saveImage(_ image: UIImage, label: String) -> String? {
        let imageName = UUID().uuidString + ".png" // Generate a unique name for the image
        let imgFolderURL = getImgFolderURL()
        
        // Create the directory if it doesn't exist
        if !FileManager.default.fileExists(atPath: imgFolderURL.path) {
            try? FileManager.default.createDirectory(at: imgFolderURL, withIntermediateDirectories: true, attributes: nil)
        }
        
        // Save the image as a PNG file
        if let imageData = image.pngData() {
            let imageURL = imgFolderURL.appendingPathComponent(imageName)
            try? imageData.write(to: imageURL) // Write the image data to the file
            
            // Save the image metadata (label) to UserDefaults
            var metadata = defaults.dictionary(forKey: "imageMetadata") as? [String: String] ?? [:]
            metadata[imageName] = label
            defaults.setValue(metadata, forKey: "imageMetadata")
            
            // Increment progress for the daily challenge
            DailyChallengeManager.shared.incrementProgress()
            
            return imageName // Return the name of the saved image
        }
        return nil // Return nil if the image could not be saved
    }
    
    // Loads all saved images and organizes them by their labels
    func loadImages() -> [String: [UIImage]] {
        var result: [String: [UIImage]] = [:] // Dictionary to store images grouped by labels
        let imgFolderURL = getImgFolderURL()
        let metadata = defaults.dictionary(forKey: "imageMetadata") as? [String: String] ?? [:]
        
        // Iterate through the metadata to load images
        for (imageName, label) in metadata {
            let imageURL = imgFolderURL.appendingPathComponent(imageName)
            if let imageData = try? Data(contentsOf: imageURL), // Load image data
               let image = UIImage(data: imageData) { // Convert data to UIImage
                if result[label] == nil {
                    result[label] = []
                }
                result[label]?.append(image) // Add the image to the corresponding label group
            }
        }
        
        return result // Return the dictionary of images grouped by labels
    }
    
    // Deletes an image from the file system and removes its metadata
    func deleteImage(_ imageName: String) {
        let imgFolderURL = getImgFolderURL()
        let imageURL = imgFolderURL.appendingPathComponent(imageName)
        
        // Delete the image file
        try? FileManager.default.removeItem(at: imageURL)
        
        // Remove the image metadata from UserDefaults
        var metadata = defaults.dictionary(forKey: "imageMetadata") as? [String: String] ?? [:]
        metadata.removeValue(forKey: imageName)
        defaults.setValue(metadata, forKey: "imageMetadata")
    }
}
