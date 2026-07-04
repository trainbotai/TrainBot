import Foundation
import Observation

@Observable
@MainActor
final class BotEditorViewModel {
    static let maxExamples = 10
    static let maxExampleLength = 500

    var name: String
    var examples: [Example]
    private(set) var isSaving = false
    private(set) var errorMessage: String?

    private let service: LLMService
    private let editingSessionId: String?
    private let assignmentId: String?

    init(service: LLMService, editing: SessionSummary? = nil, assignmentId: String? = nil) {
        self.service = service
        self.editingSessionId = editing?.id
        self.assignmentId = assignmentId
        self.name = editing?.name ?? ""
        self.examples = [Example()]  // Start with one empty pair
    }

    var canAddExample: Bool { examples.count < Self.maxExamples }

    var nonEmptyExamples: [Example] {
        examples.filter { !$0.user.trimmingCharacters(in: .whitespaces).isEmpty && !$0.ai.trimmingCharacters(in: .whitespaces).isEmpty }
    }

    var isValid: Bool {
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        guard !trimmedName.isEmpty, trimmedName.count <= 80 else { return false }
        let validExamples = nonEmptyExamples
        guard !validExamples.isEmpty else { return false }
        for ex in validExamples {
            if ex.user.count > Self.maxExampleLength || ex.ai.count > Self.maxExampleLength {
                return false
            }
        }
        return true
    }

    func addExample() {
        guard canAddExample else { return }
        examples.append(Example())
    }

    func removeExample(_ id: UUID) {
        examples.removeAll { $0.id == id }
        if examples.isEmpty { examples.append(Example()) }
    }

    func save(onSaved: (SessionDetail) -> Void) async {
        guard isValid else { return }
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let trimmedExamples = nonEmptyExamples.map {
            Example(user: $0.user.trimmingCharacters(in: .whitespaces),
                    ai: $0.ai.trimmingCharacters(in: .whitespaces))
        }
        do {
            let result: SessionDetail
            if let sessionId = editingSessionId {
                result = try await service.addVersion(sessionId: sessionId, examples: trimmedExamples)
            } else {
                result = try await service.createSession(name: trimmedName, examples: trimmedExamples, assignmentId: assignmentId)
            }
            onSaved(result)
        } catch let error as APIError {
            errorMessage = errorDescription(error)
        } catch {
            errorMessage = "A aparut o eroare la salvare."
        }
    }

    private func errorDescription(_ err: APIError) -> String {
        switch err {
        case .unauthorized: return "Sesiunea ta a expirat."
        case .network: return "Verifica conexiunea la internet."
        case .httpError(_, let detail): return detail
        default: return "A aparut o eroare."
        }
    }
}
