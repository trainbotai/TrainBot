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

    init() {
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
        let response: AuthResponse = try await APIClient.shared.request(endpoint)
        apply(response)
    }

    func logout() async {
        if let token = refreshToken {
            let _: EmptyResponse? = try? await APIClient.shared.request(APIEndpoint.logout(token))
        }
        clear()
    }

    func refreshAccessToken() async throws {
        guard let token = refreshToken else { throw APIError.unauthorized }
        let response: AuthResponse = try await APIClient.shared.request(
            APIEndpoint.refreshToken(token)
        )
        apply(response)
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
