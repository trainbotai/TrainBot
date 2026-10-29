import Foundation
import Observation

@Observable
@MainActor
final class AuthSession {
    private(set) var currentUser: AuthUser?
    private(set) var accessToken: String?
    private(set) var refreshToken: String?

    var isAuthenticated: Bool { currentUser != nil }

    private enum Keys {
        static let accessToken = "auth.accessToken"
        static let refreshToken = "auth.refreshToken"
        static let userJSON = "auth.currentUser"
    }

    private let api: APIClient
    private var refreshTask: Task<Void, Error>?

    init(api: APIClient = .shared) {
        self.api = api
        accessToken = KeychainHelper.load(for: Keys.accessToken)
        refreshToken = KeychainHelper.load(for: Keys.refreshToken)
        if let raw = KeychainHelper.load(for: Keys.userJSON),
           let data = raw.data(using: .utf8) {
            currentUser = try? JSONDecoder().decode(AuthUser.self, from: data)
        }
    }

    func login(classCode: String, username: String, password: String) async throws {
        let endpoint = APIEndpoint.studentLogin(
            classCode: classCode,
            username: username,
            password: password
        )
        let response: AuthResponse = try await api.request(endpoint)
        apply(response)
    }

    func logout() async {
        if let token = refreshToken {
            let _: EmptyResponse? = try? await api.request(APIEndpoint.logout(token))
        }
        clear()
    }

    /// Runs `operation` with the current access token. On a 401 the token is refreshed
    /// (one shared refresh for concurrent callers) and the operation is retried once.
    func withAuth<T>(_ operation: (String) async throws -> T) async throws -> T {
        guard let used = accessToken else { throw APIError.unauthorized }
        do {
            return try await operation(used)
        } catch APIError.unauthorized {
            // Another caller may already have refreshed while our request was in flight.
            if accessToken == used { try await refreshAccessToken() }
            guard let fresh = accessToken else { throw APIError.unauthorized }
            return try await operation(fresh)
        }
    }

    func request<T: Decodable>(_ endpoint: APIEndpoint) async throws -> T {
        try await withAuth { try await api.request(endpoint, bearerToken: $0) }
    }

    /// Refresh tokens rotate, so concurrent callers must share a single in-flight refresh.
    func refreshAccessToken() async throws {
        if let task = refreshTask { return try await task.value }
        let task = Task { try await performRefresh() }
        refreshTask = task
        defer { refreshTask = nil }
        try await task.value
    }

    private func performRefresh() async throws {
        guard let token = refreshToken else { throw APIError.unauthorized }
        do {
            let response: AuthResponse = try await api.request(APIEndpoint.refreshToken(token))
            apply(response)
        } catch APIError.unauthorized {
            clear() // refresh token rejected: session is really over
            throw APIError.unauthorized
        } catch APIError.httpError(let code, _) where code == 400 || code == 403 {
            clear()
            throw APIError.unauthorized
        }
        // Network / 5xx errors propagate and keep the session (child stays logged in offline).
    }

    private func apply(_ response: AuthResponse) {
        accessToken = response.accessToken
        refreshToken = response.refreshToken
        currentUser = response.user
        KeychainHelper.save(response.accessToken, for: Keys.accessToken)
        KeychainHelper.save(response.refreshToken, for: Keys.refreshToken)
        if let data = try? JSONEncoder().encode(response.user),
           let str = String(data: data, encoding: .utf8) {
            KeychainHelper.save(str, for: Keys.userJSON)
        }
    }

    private func clear() {
        accessToken = nil
        refreshToken = nil
        currentUser = nil
        KeychainHelper.delete(for: Keys.accessToken)
        KeychainHelper.delete(for: Keys.refreshToken)
        KeychainHelper.delete(for: Keys.userJSON)
    }
}
