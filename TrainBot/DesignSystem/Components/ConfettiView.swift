import SwiftUI

// MARK: - Confetti Particle

private struct Particle: Identifiable {
    let id = UUID()
    var x: CGFloat
    var y: CGFloat
    let emoji: String
    let size: CGFloat
    let rotation: Double
    let xDrift: CGFloat
    let speed: Double
}

// MARK: - ConfettiView

/// A lightweight emoji-confetti overlay. Attach via `.overlay` or `.fullScreenCover`.
/// Triggers automatically when `trigger` increments.
///
/// Usage:
/// ```swift
/// @State private var confettiTrigger = 0
/// someView.confetti(trigger: $confettiTrigger)
/// // Later: confettiTrigger += 1
/// ```
struct ConfettiView: View {
    @Binding var trigger: Int
    @State private var particles: [Particle] = []
    @State private var animating = false

    private let emojis = ["🎉", "⭐", "🌟", "✨", "🎊", "🟣", "💜", "🔵"]

    var body: some View {
        GeometryReader { geo in
            ZStack {
                ForEach(particles) { p in
                    Text(p.emoji)
                        .font(.system(size: p.size))
                        .rotationEffect(.degrees(p.rotation + (animating ? 360 : 0)))
                        .position(
                            x: p.x + (animating ? p.xDrift : 0),
                            y: animating ? geo.size.height + 60 : p.y
                        )
                        .opacity(animating ? 0 : 1)
                        .animation(
                            .easeIn(duration: p.speed).delay(p.speed * 0.1),
                            value: animating
                        )
                }
            }
        }
        .allowsHitTesting(false)
        .onChange(of: trigger) { _, _ in burst() }
    }

    private func burst() {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else { return }
        let width = windowScene.screen.bounds.width

        particles = (0..<30).map { _ in
            Particle(
                x: CGFloat.random(in: 0..<width),
                y: CGFloat.random(in: -20 ... 40),
                emoji: emojis.randomElement()!,
                size: CGFloat.random(in: 18...32),
                rotation: Double.random(in: 0...360),
                xDrift: CGFloat.random(in: -60...60),
                speed: Double.random(in: 1.2...2.2)
            )
        }
        animating = false

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
            withAnimation { animating = true }
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            particles = []
            animating = false
        }
    }
}

// MARK: - View modifier

extension View {
    /// Overlay a confetti burst. Increment `trigger` to fire.
    func confetti(trigger: Binding<Int>) -> some View {
        self.overlay(ConfettiView(trigger: trigger))
    }
}
