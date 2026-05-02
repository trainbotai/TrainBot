import Foundation
import CoreData

private struct SyncedProjectResponse: Decodable {
    let id: String
    let labels: [SyncedLabel]
    struct SyncedLabel: Decodable {
        let id: String
        let clientId: String
    }
}

@Observable
@MainActor
final class MLSyncService {
    private(set) var isSyncing = false
    private(set) var lastSyncedAt: Date?
    private(set) var lastError: String?
    private(set) var syncedCount: Int = 0
    private(set) var uploadedImageCount: Int = 0

    private let context: NSManagedObjectContext
    private let authSession: AuthSession
    private let imageStorage: ImageStorage

    init(
        context: NSManagedObjectContext,
        authSession: AuthSession,
        imageStorage: ImageStorage = .default
    ) {
        self.context = context
        self.authSession = authSession
        self.imageStorage = imageStorage
    }

    func syncAll() async {
        guard let token = authSession.accessToken, authSession.currentUser?.role == "student" else {
            lastError = "Trebuie să fii conectat ca elev pentru a sincroniza."
            return
        }

        isSyncing = true
        lastError = nil
        uploadedImageCount = 0
        defer { isSyncing = false }

        do {
            let projects = try fetchAllProjects()
            var syncedProjects = 0
            var uploaded = 0
            for project in projects {
                let payload = build(from: project)
                guard let response: SyncedProjectResponse = try? await pushProject(payload, token: token) else {
                    continue
                }
                syncedProjects += 1
                let labelMap = Dictionary(uniqueKeysWithValues: response.labels.map { ($0.clientId, $0.id) })
                uploaded += try await uploadPendingImages(for: project, projectServerId: response.id, labelClientToServer: labelMap, token: token)
            }
            syncedCount = syncedProjects
            uploadedImageCount = uploaded
            lastSyncedAt = Date()
        } catch {
            lastError = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }

    private func pushProject(_ payload: MLProjectSyncPayload, token: String) async throws -> SyncedProjectResponse {
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

    private func uploadPendingImages(
        for project: MLProjectEntity,
        projectServerId: String,
        labelClientToServer: [String: String],
        token: String
    ) async throws -> Int {
        var uploaded = 0
        let labels = (project.labels?.allObjects as? [MLLabelEntity] ?? [])
        for label in labels {
            let labelClientId = (label.id ?? UUID()).uuidString
            guard let labelServerId = labelClientToServer[labelClientId] else { continue }
            let images = (label.images as? Set<MLImageEntity> ?? [])
                .filter { $0.serverImageId == nil && $0.filename != nil }
            for image in images {
                guard let filename = image.filename, let imageId = image.id else { continue }
                let jpegData: Data
                do {
                    jpegData = try imageStorage.loadJpegData(filename: filename)
                } catch {
                    continue // missing local file — skip
                }
                do {
                    let resp = try await MultipartUploader.uploadImage(
                        projectServerId: projectServerId,
                        labelServerId: labelServerId,
                        clientId: imageId.uuidString,
                        jpegData: jpegData,
                        bearerToken: token
                    )
                    image.serverImageId = resp.id
                    try? context.save()
                    uploaded += 1
                } catch {
                    // Don't stop the whole sync — just log and continue
                    lastError = (error as? APIError)?.errorDescription ?? error.localizedDescription
                }
            }
        }
        return uploaded
    }
}
