import Foundation
import CoreData
import UIKit

final class MLProjectRepository {
    private let context: NSManagedObjectContext
    private let imageStorage: ImageStorage

    init(context: NSManagedObjectContext, imageStorage: ImageStorage = .default) {
        self.context = context
        self.imageStorage = imageStorage
    }

    // MARK: - Projects

    func createProject(name: String) throws -> MLProjectEntity {
        let project = MLProjectEntity(context: context)
        project.id = UUID()
        project.name = name
        project.createdAt = Date()
        project.updatedAt = Date()
        try context.save()
        return project
    }

    func loadAllProjects() throws -> [MLProjectEntity] {
        let req: NSFetchRequest<MLProjectEntity> = MLProjectEntity.fetchRequest()
        req.sortDescriptors = [NSSortDescriptor(keyPath: \MLProjectEntity.updatedAt, ascending: false)]
        return try context.fetch(req)
    }

    func deleteProject(_ project: MLProjectEntity) throws {
        for label in (project.labels?.allObjects as? [MLLabelEntity] ?? []) {
            for image in (label.images?.allObjects as? [MLImageEntity] ?? []) {
                try? imageStorage.delete(filename: image.filename ?? "")
            }
        }
        context.delete(project)
        try context.save()
    }

    // MARK: - Labels

    func addLabel(name: String, to project: MLProjectEntity) throws -> MLLabelEntity {
        let label = MLLabelEntity(context: context)
        label.id = UUID()
        label.name = name
        label.project = project
        project.updatedAt = Date()
        try context.save()
        return label
    }

    func deleteLabel(_ label: MLLabelEntity) throws {
        for image in (label.images?.allObjects as? [MLImageEntity] ?? []) {
            try? imageStorage.delete(filename: image.filename ?? "")
        }
        context.delete(label)
        try context.save()
    }

    // MARK: - Images

    func addImage(_ image: UIImage, to label: MLLabelEntity) throws -> MLImageEntity {
        let filename = try imageStorage.save(image: image)
        let entity = MLImageEntity(context: context)
        entity.id = UUID()
        entity.filename = filename
        entity.createdAt = Date()
        entity.label = label
        label.project?.updatedAt = Date()
        try context.save()
        return entity
    }

    func deleteImage(_ image: MLImageEntity) throws {
        try? imageStorage.delete(filename: image.filename ?? "")
        context.delete(image)
        try context.save()
    }

    func loadImages(for label: MLLabelEntity) -> [(MLImageEntity, UIImage)] {
        let images = (label.images?.allObjects as? [MLImageEntity] ?? [])
        return images.compactMap { entity in
            guard let fn = entity.filename, let img = try? imageStorage.load(filename: fn) else { return nil }
            return (entity, img)
        }
    }

    // MARK: - Models

    func saveTrainedModel(_ classifier: TrainedClassifier, for project: MLProjectEntity) throws -> MLModelEntity {
        let entity = MLModelEntity(context: context)
        entity.id = UUID()

        let lastVersion = (project.models?.allObjects as? [MLModelEntity] ?? []).map { $0.version }.max() ?? 0
        entity.version = lastVersion + 1
        entity.accuracy = classifier.accuracy
        entity.createdAt = Date()
        entity.project = project

        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let modelsDir = docs.appendingPathComponent("models", isDirectory: true)
        try FileManager.default.createDirectory(at: modelsDir, withIntermediateDirectories: true)
        let filename = "\(entity.id?.uuidString ?? UUID().uuidString).mlmodel"
        try classifier.modelData.write(to: modelsDir.appendingPathComponent(filename))
        entity.filename = filename

        project.updatedAt = Date()
        try context.save()
        return entity
    }
}
