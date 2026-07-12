import Foundation
import SwiftUI
import UIKit
import CoreML
import Vision
import CoreData

@MainActor
final class TestingViewModel: ObservableObject {
    @Published var projects: [MLProjectEntity] = []
    @Published var selectedProject: MLProjectEntity?
    @Published var prediction: TrainedClassifier.Prediction?
    @Published var testImage: UIImage?
    @Published var error: String?
    @Published var isPredicting = false

    private let repo: MLProjectRepository
    private var loadedClassifier: TrainedClassifier?

    init(context: NSManagedObjectContext) {
        self.repo = MLProjectRepository(context: context)
    }

    func loadProjects() {
        do { projects = try repo.loadAllProjects().filter { ($0.models?.count ?? 0) > 0 } }
        catch { self.error = error.localizedDescription }
    }

    func selectProject(_ project: MLProjectEntity) {
        selectedProject = project
        prediction = nil
        testImage = nil
        Task { await loadLatestModel(for: project) }
    }

    private func loadLatestModel(for project: MLProjectEntity) async {
        guard let models = project.models?.allObjects as? [MLModelEntity],
              let latest = models.sorted(by: { $0.version > $1.version }).first,
              let filename = latest.filename else { return }

        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let modelURL = docs.appendingPathComponent("models/\(filename)")
        let accuracy = latest.accuracy
        do {
            // Fișierul e deja un .mlmodelc compilat → încărcare directă, off-main,
            // fără MLModel.compileModel (care bloca main thread-ul + eșua pe JSON).
            let (mlModel, visionModel) = try await Task.detached(priority: .userInitiated) {
                let mlModel = try MLModel(contentsOf: modelURL)
                guard let visionModel = try? VNCoreMLModel(for: mlModel) else {
                    throw NSError(domain: "TestingVM", code: 1)
                }
                return (mlModel, visionModel)
            }.value
            loadedClassifier = TrainedClassifier(
                model: mlModel,
                visionModel: visionModel,
                labels: [],
                accuracy: accuracy,
                compiledModelURL: nil
            )
        } catch {
            self.error = "Nu pot încărca modelul: \(error.localizedDescription)"
        }
    }

    func predict(_ image: UIImage) async {
        guard let classifier = loadedClassifier else { return }
        testImage = image
        isPredicting = true
        prediction = nil
        defer { isPredicting = false }
        do {
            prediction = try await classifier.predict(image: image)
        } catch {
            self.error = error.localizedDescription
        }
    }
}
