import Foundation
import Observation

@Observable
@MainActor
final class BotListViewModel {
    private(set) var sessions: [SessionSummary] = []
    private(set) var quota: QueryQuota?
    private(set) var isLoading = false
    private(set) var errorMessage: String?

    private let service: LLMService

    init(service: LLMService) {
        self.service = service
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            async let sessionsTask = service.listSessions()
            async let quotaTask = service.getQuota()
            sessions = try await sessionsTask
            quota = try await quotaTask
        } catch let error as APIError {
            errorMessage = errorDescription(error)
        } catch {
            errorMessage = "A aparut o eroare."
        }
    }

    func delete(_ session: SessionSummary) async {
        do {
            try await service.deleteSession(id: session.id)
            sessions.removeAll { $0.id == session.id }
        } catch let error as APIError {
            errorMessage = errorDescription(error)
        } catch {
            errorMessage = "A aparut o eroare la stergere."
        }
    }

    private func errorDescription(_ err: APIError) -> String {
        switch err {
        case .unauthorized: return "Sesiunea ta a expirat. Conecteaza-te din nou."
        case .network: return "Verifica conexiunea la internet."
        case .httpError(_, let detail): return detail
        default: return "A aparut o eroare."
        }
    }
}
