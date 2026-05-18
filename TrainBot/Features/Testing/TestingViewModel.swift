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
        loadLatestModel(for: project)
    }

    private func loadLatestModel(for project: MLProjectEntity) {
        guard let models = project.models?.allObjects as? [MLModelEntity],
              let latest = models.sorted(by: { $0.version > $1.version }).first,
              let filename = latest.filename else { return }

        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let modelURL = docs.appendingPathComponent("models/\(filename)")
        do {
            let compiledURL = try MLModel.compileModel(at: modelURL)
            let mlModel = try MLModel(contentsOf: compiledURL)
            guard let visionModel = try? VNCoreMLModel(for: mlModel) else { throw NSError(domain: "TestingVM", code: 1) }
            loadedClassifier = TrainedClassifier(
                model: mlModel,
                visionModel: visionModel,
                labels: [],
                accuracy: latest.accuracy,
                modelData: Data()
            )
        } catch {
            self.error = "Nu pot incarca modelul: \(error.localizedDescription)"
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
