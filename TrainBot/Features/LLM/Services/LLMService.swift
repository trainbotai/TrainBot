import Foundation

/// Service wrapper for non-streaming LLM endpoints.
/// For the streaming `/query` endpoint, see `LLMStreamingService`.
@MainActor
final class LLMService {
    private let authSession: AuthSession

    init(authSession: AuthSession) {
        self.authSession = authSession
    }

    private var token: String? { authSession.accessToken }

    func listSessions() async throws -> [SessionSummary] {
        let res: SessionListResponse = try await APIClient.shared.request(
            APIEndpoint.listLLMSessions(),
            bearerToken: token
        )
        return res.sessions
    }

    func getSession(id: String) async throws -> SessionDetail {
        try await APIClient.shared.request(
            APIEndpoint.getLLMSession(id: id),
            bearerToken: token
        )
    }

    func createSession(name: String, examples: [Example], assignmentId: String? = nil) async throws -> SessionDetail {
        let body = APIEndpoint.CreateSessionBody(
            name: name,
            examples: examples.map { .init(user: $0.user, ai: $0.ai) },
            assignmentId: assignmentId
        )
        return try await APIClient.shared.request(
            APIEndpoint.createLLMSession(body),
            bearerToken: token
        )
    }

    func addVersion(sessionId: String, examples: [Example]) async throws -> SessionDetail {
        let body = APIEndpoint.AddVersionBody(
            examples: examples.map { .init(user: $0.user, ai: $0.ai) }
        )
        return try await APIClient.shared.request(
            APIEndpoint.addLLMVersion(sessionId: sessionId, body),
            bearerToken: token
        )
    }

    func deleteSession(id: String) async throws {
        let _: EmptyResponse = try await APIClient.shared.request(
            APIEndpoint.deleteLLMSession(id: id),
            bearerToken: token
        )
    }

    func listQueries(sessionId: String, version: Int? = nil) async throws -> [ChatHistoryItem] {
        let res: ChatHistoryResponse = try await APIClient.shared.request(
            APIEndpoint.listLLMQueries(sessionId: sessionId, version: version),
            bearerToken: token
        )
        return res.queries
    }

    struct ReportResponse: Decodable { let reportId: String }

    func reportSession(sessionId: String, reason: String?) async throws -> String {
        let res: ReportResponse = try await APIClient.shared.request(
            APIEndpoint.reportLLMSession(sessionId: sessionId, reason: reason),
            bearerToken: token
        )
        return res.reportId
    }

    func getQuota() async throws -> QueryQuota {
        try await APIClient.shared.request(
            APIEndpoint.llmQuota(),
            bearerToken: token
        )
    }
}
