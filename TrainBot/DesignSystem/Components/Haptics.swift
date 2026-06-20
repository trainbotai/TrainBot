import UIKit

/// Lightweight wrapper around UIKit feedback generators.
/// Call from the main thread only.
enum Haptics {
    /// Light tap — button press, picker selection.
    static func tap() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }

    /// Success notification — model trained, achievement unlocked, lesson complete.
    static func success() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }

    /// Warning notification — low confidence prediction.
    static func warning() {
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
    }

    /// Error notification — something went wrong.
    static func error() {
        UINotificationFeedbackGenerator().notificationOccurred(.error)
    }
}
