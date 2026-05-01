import Foundation
import CoreData

@Observable
@MainActor
final class MLSyncService {
    private(set) var isSyncing = false
    private(set) var lastSyncedAt: Date?
    private(set) var lastError: String?
    private(set) var syncedCount: Int = 0

    private let context: NSManagedObjectContext
    private let authSession: AuthSession

    init(context: NSManagedObjectContext, authSession: AuthSession) {
        self.context = context
        self.authSession = authSession
    }

    func syncAll() async {
        guard let token = authSession.accessToken, authSession.currentUser?.role == "student" else {
            lastError = "Trebuie să fii conectat ca elev pentru a sincroniza."
            return
        }

        isSyncing = true
        lastError = nil
        defer { isSyncing = false }

        do {
            let projects = try fetchAllProjects()
            var ok = 0
            for project in projects {
                let payload = build(from: project)
                let _: AuthResponse? = try? await pushProject(payload, token: token)
                ok += 1
            }
            syncedCount = ok
            lastSyncedAt = Date()
        } catch {
            lastError = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }

    private func pushProject(_ payload: MLProjectSyncPayload, token: String) async throws -> AuthResponse {
        let endpoint = APIEndpoint.syncMLProject(payload)
        return try await APIClient.shared.request(endpoint, bearerToken: token)
    }

    private func fetchAllProjects() throws -> [MLProjectEntity] {
        let req: NSFetchRequest<MLProjectEntity> = MLProjectEntity.fetchRequest()
        return try context.fetch(req)
    }

    private func build(from project: MLProjectEntity) -> MLProjectSyncPayload {
        let labels = (project.labels?.allObjects as? [MLLabelEntity] ?? []).map { label -> MLLabelSyncPayload in
            let imageCount = (label.images as? Set<MLImageEntity>)?.count ?? 0
            return MLLabelSyncPayload(
                clientId: (label.id ?? UUID()).uuidString,
                name: label.name ?? "",
                imageCount: imageCount
            )
        }

        let modelsSet = project.models as? Set<MLModelEntity>
        let trainedAt: String? = modelsSet?
            .compactMap { $0.createdAt }
            .max()
            .map { ISO8601DateFormatter().string(from: $0) }
        let modelVersion = Int(modelsSet?.compactMap { Int($0.version) }.max() ?? 0)

        return MLProjectSyncPayload(
            clientId: (project.id ?? UUID()).uuidString,
            name: project.name ?? "Untitled",
            modelTrained: modelVersion > 0,
            modelVersion: modelVersion,
            trainedAt: trainedAt,
            labels: labels
        )
    }
}
