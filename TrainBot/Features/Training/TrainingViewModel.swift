import Foundation
import SwiftUI
import UIKit
import CoreData

@MainActor
final class TrainingViewModel: ObservableObject {
    @Published var projects: [MLProjectEntity] = []
    @Published var selectedProject: MLProjectEntity?
    @Published var labels: [MLLabelEntity] = []
    @Published var imagesByLabel: [UUID: [(MLImageEntity, UIImage)]] = [:]
    @Published var trainingProgress: ImageClassifierTrainer.Progress?
    @Published var lastAccuracy: Double?
    @Published var trainingError: String?
    @Published var isTraining = false

    private let repo: MLProjectRepository
    private let trainer = ImageClassifierTrainer()

    init(context: NSManagedObjectContext) {
        self.repo = MLProjectRepository(context: context)
    }

    func loadProjects() {
        do {
            projects = try repo.loadAllProjects()
        } catch {
            trainingError = error.localizedDescription
        }
    }

    func selectProject(_ project: MLProjectEntity) {
        selectedProject = project
        labels = (project.labels?.allObjects as? [MLLabelEntity] ?? []).sorted { ($0.name ?? "") < ($1.name ?? "") }
        for label in labels {
            if let id = label.id { imagesByLabel[id] = repo.loadImages(for: label) }
        }
    }

    func createProject(name: String) {
        do {
            let p = try repo.createProject(name: name)
            loadProjects()
            selectProject(p)
        } catch {
            trainingError = error.localizedDescription
        }
    }

    func addLabel(name: String) {
        guard let project = selectedProject else { return }
        do {
            _ = try repo.addLabel(name: name, to: project)
            selectProject(project)
        } catch {
            trainingError = error.localizedDescription
        }
    }

    func addImage(_ image: UIImage, to label: MLLabelEntity) {
        do {
            _ = try repo.addImage(image, to: label)
            if let project = selectedProject { selectProject(project) }
        } catch {
            trainingError = error.localizedDescription
        }
    }

    func train() async {
        guard let project = selectedProject else { return }
        var dataset: [String: [UIImage]] = [:]
        for label in labels {
            guard let labelName = label.name, let id = label.id else { continue }
            let imgs = (imagesByLabel[id] ?? []).map { $0.1 }
            dataset[labelName] = imgs
        }

        isTraining = true
        trainingError = nil
        defer { isTraining = false; trainingProgress = nil }

        do {
            let result = try await trainer.train(labeledImages: dataset) { [weak self] progress in
                Task { @MainActor in self?.trainingProgress = progress }
            }
            _ = try repo.saveTrainedModel(result, for: project)
            lastAccuracy = result.accuracy
        } catch TrainerError.insufficientLabels {
            trainingError = "Adauga cel putin 2 etichete."
        } catch TrainerError.insufficientImagesPerLabel(let label, let count) {
            trainingError = "Eticheta '\(label)' are doar \(count) poze. Adauga minim 5."
        } catch {
            trainingError = "Antrenarea a esuat: \(error.localizedDescription)"
        }
    }
}
