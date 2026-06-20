import Foundation

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case patch = "PATCH"
    case delete = "DELETE"
}

struct APIEndpoint {
    let method: HTTPMethod
    let path: String
    let body: (any Encodable)?

    #if DEBUG
    static let baseURL = "http://localhost:3000/api/v1"
    #else
    static let baseURL = "https://api.trainbot.moldluca.tech:33443/api/v1"
    #endif

    func urlRequest() throws -> URLRequest {
        guard let url = URL(string: Self.baseURL + path) else {
            throw APIError.invalidResponse
        }
        var req = URLRequest(url: url)
        req.httpMethod = method.rawValue
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let body {
            req.httpBody = try JSONEncoder().encode(body)
        }
        return req
    }
}

extension APIEndpoint {
    static func studentLogin(classCode: String, username: String, password: String) -> Self {
        struct Body: Encodable {
            let classCode: String
            let username: String
            let password: String
        }
        return Self(
            method: .post,
            path: "/auth/student/login",
            body: Body(classCode: classCode, username: username, password: password)
        )
    }

    static func refreshToken(_ token: String) -> Self {
        struct Body: Encodable { let refreshToken: String }
        return Self(method: .post, path: "/auth/refresh", body: Body(refreshToken: token))
    }

    static func logout(_ token: String) -> Self {
        struct Body: Encodable { let refreshToken: String }
        return Self(method: .post, path: "/auth/logout", body: Body(refreshToken: token))
    }

    static func syncMLProject(_ payload: MLProjectSyncPayload) -> Self {
        return Self(method: .post, path: "/student/ml/projects", body: payload)
    }
}

extension APIEndpoint {
    // MARK: - LLM Student endpoints

    static func listLLMSessions() -> Self {
        Self(method: .get, path: "/student/llm/sessions", body: nil)
    }

    static func getLLMSession(id: String) -> Self {
        Self(method: .get, path: "/student/llm/sessions/\(id)", body: nil)
    }

    struct CreateSessionBody: Encodable {
        let name: String
        let examples: [Example]
        let assignmentId: String?
        struct Example: Encodable { let user: String; let ai: String }
    }

    static func createLLMSession(_ body: CreateSessionBody) -> Self {
        Self(method: .post, path: "/student/llm/sessions", body: body)
    }

    struct AddVersionBody: Encodable {
        let examples: [CreateSessionBody.Example]
    }

    static func addLLMVersion(sessionId: String, _ body: AddVersionBody) -> Self {
        Self(method: .post, path: "/student/llm/sessions/\(sessionId)/versions", body: body)
    }

    static func deleteLLMSession(id: String) -> Self {
        Self(method: .delete, path: "/student/llm/sessions/\(id)", body: nil)
    }

    static func listLLMQueries(sessionId: String, version: Int? = nil) -> Self {
        var path = "/student/llm/sessions/\(sessionId)/queries"
        if let v = version { path += "?version=\(v)" }
        return Self(method: .get, path: path, body: nil)
    }

    struct ReportSessionBody: Encodable {
        let reason: String?
    }

    static func reportLLMSession(sessionId: String, reason: String?) -> Self {
        Self(method: .post, path: "/student/llm/sessions/\(sessionId)/report", body: ReportSessionBody(reason: reason))
    }

    static func llmQuota() -> Self {
        Self(method: .get, path: "/student/llm/quota", body: nil)
    }
}

struct MLLabelSyncPayload: Encodable {
    let clientId: String
    let name: String
    let imageCount: Int
}

struct MLProjectSyncPayload: Encodable {
    let clientId: String
    let name: String
    let modelTrained: Bool
    let modelVersion: Int
    let trainedAt: String?
    let labels: [MLLabelSyncPayload]
}
