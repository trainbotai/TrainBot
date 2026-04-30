import Foundation
import Observation

@Observable
@MainActor
final class StudentLoginViewModel {
    var classCode = ""
    var username = ""
    var password = ""
    var isLoading = false
    var errorMessage: String?

    private let authSession: AuthSession

    init(authSession: AuthSession) {
        self.authSession = authSession
    }

    var canSubmit: Bool {
        !classCode.trimmingCharacters(in: .whitespaces).isEmpty &&
        !username.trimmingCharacters(in: .whitespaces).isEmpty &&
        !password.isEmpty &&
        !isLoading
    }

    func login() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            try await authSession.login(
                classCode: classCode.trimmingCharacters(in: .whitespaces).uppercased(),
                username: username.trimmingCharacters(in: .whitespaces),
                password: password
            )
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
