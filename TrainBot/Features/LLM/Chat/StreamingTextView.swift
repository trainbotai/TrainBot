import SwiftUI

/// Renders accumulated streaming text with smooth append.
struct StreamingTextView: View {
    let text: String

    var body: some View {
        MessageBubble(text: text, isUser: false, flagged: false)
            .animation(.easeOut(duration: 0.15), value: text)
    }
}
