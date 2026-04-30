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

    static let baseURL = "http://localhost:3000/api/v1"

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
}
