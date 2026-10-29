import Foundation

/// Service wrapper for non-streaming LLM endpoints.
/// For the streaming `/query` endpoint, see `LLMStreamingService`.
@MainActor
final class LLMService {
    private let authSession: AuthSession

    init(authSession: AuthSession) {
        self.authSession = authSession
    }

    func listSessions() async throws -> [SessionSummary] {
        let res: SessionListResponse = try await authSession.request(
            APIEndpoint.listLLMSessions()
        )
        return res.sessions
    }

    func getSession(id: String) async throws -> SessionDetail {
        try await authSession.request(
            APIEndpoint.getLLMSession(id: id)
        )
    }

    func createSession(name: String, examples: [Example], assignmentId: String? = nil) async throws -> SessionDetail {
        let body = APIEndpoint.CreateSessionBody(
            name: name,
            examples: examples.map { .init(user: $0.user, ai: $0.ai) },
            assignmentId: assignmentId
        )
        return try await authSession.request(
            APIEndpoint.createLLMSession(body)
        )
    }

    func addVersion(sessionId: String, examples: [Example]) async throws -> SessionDetail {
        let body = APIEndpoint.AddVersionBody(
            examples: examples.map { .init(user: $0.user, ai: $0.ai) }
        )
        return try await authSession.request(
            APIEndpoint.addLLMVersion(sessionId: sessionId, body)
        )
    }

    func deleteSession(id: String) async throws {
        let _: EmptyResponse = try await authSession.request(
            APIEndpoint.deleteLLMSession(id: id)
        )
    }

    func listQueries(sessionId: String, version: Int? = nil) async throws -> [ChatHistoryItem] {
        let res: ChatHistoryResponse = try await authSession.request(
            APIEndpoint.listLLMQueries(sessionId: sessionId, version: version)
        )
        return res.queries
    }

    struct ReportResponse: Decodable { let reportId: String }

    func reportSession(sessionId: String, reason: String?) async throws -> String {
        let res: ReportResponse = try await authSession.request(
            APIEndpoint.reportLLMSession(sessionId: sessionId, reason: reason)
        )
        return res.reportId
    }

    func getQuota() async throws -> QueryQuota {
        try await authSession.request(
            APIEndpoint.llmQuota()
        )
    }
}
