import Foundation
import Observation

@Observable
@MainActor
final class TeacherBotsViewModel {
    private(set) var bots: [TeacherBot] = []
    private(set) var isLoading = false
    private(set) var errorMessage: String?

    private let authSession: AuthSession

    init(authSession: AuthSession) {
        self.authSession = authSession
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let res: TeacherBotListResponse = try await APIClient.shared.request(
                APIEndpoint.listTeacherBots(),
                bearerToken: authSession.accessToken
            )
            bots = res.bots
        } catch let error as APIError {
            errorMessage = errorDescription(error)
        } catch {
            errorMessage = "A aparut o eroare la incarcarea botilor."
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
