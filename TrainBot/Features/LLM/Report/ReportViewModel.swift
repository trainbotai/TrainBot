import Foundation
import Observation

@Observable
@MainActor
final class ReportViewModel {
    var reason: String = ""
    private(set) var isSubmitting = false

    var trimmedReason: String? {
        let trimmed = reason.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
