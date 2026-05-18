import Foundation

struct AuthUser: Codable, Equatable {
    let id: String
    let role: String
    let name: String
    let tenantId: String
}

struct AuthResponse: Codable {
    let accessToken: String
    let refreshToken: String
    let user: AuthUser
}

struct ProblemDetail: Codable {
    let detail: String?
    let title: String?
}

struct EmptyResponse: Codable {}
