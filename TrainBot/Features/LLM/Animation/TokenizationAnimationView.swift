import SwiftUI

/// 3-scene educational animation: tokenize -> process -> respond.
/// Pure SwiftUI (NO Lottie dependency) — uses the existing MascotView.
struct TokenizationAnimationView: View {
    let onDone: () -> Void

    @State private var scene: Scene = .tokenize
    @State private var hasShownAll = false

    enum Scene: Int, CaseIterable {
        case tokenize, process, respond
    }

    var body: some View {
        ZStack {
            AppColor.surfaceLight.ignoresSafeArea()
            VStack(spacing: 30) {
                Spacer()
                MascotView(state: mascotState, size: 140)
                    .animation(.easeInOut(duration: 0.5), value: scene)
                title
                description
                Spacer()
                if hasShownAll {
                    PrimaryButton("Hai sa creez un bot", action: onDone)
                        .padding(.horizontal, 40)
                        .padding(.bottom, 40)
                }
            }
            .padding(.horizontal, 24)
        }
        .task { await runAnimation() }
    }

    private var mascotState: MascotState {
        switch scene {
        case .tokenize: return .learning
        case .process: return .thinking
        case .respond: return .happy
        }
    }

    @ViewBuilder
    private var title: some View {
        switch scene {
        case .tokenize:
            Text("Cum functioneaza un bot AI?")
                .font(AppFont.displayMedium())
                .foregroundStyle(AppColor.primaryPurple)
                .multilineTextAlignment(.center)
        case .process:
            Text("Robotul gandeste")
                .font(AppFont.displayMedium())
                .foregroundStyle(AppColor.primaryPurple)
        case .respond:
            Text("Si raspunde!")
                .font(AppFont.displayMedium())
                .foregroundStyle(AppColor.primaryPurple)
        }
    }

    @ViewBuilder
    private var description: some View {
        switch scene {
        case .tokenize:
            Text("Tu ii dai exemple — cum sa raspunda la intrebari — si el invata stilul tau.")
                .font(AppFont.body())
                .foregroundStyle(AppColor.textSecondary)
                .multilineTextAlignment(.center)
        case .process:
            Text("Cand tu ii scrii ceva nou, el cauta in exemplele tale ce se potriveste cel mai bine.")
                .font(AppFont.body())
                .foregroundStyle(AppColor.textSecondary)
                .multilineTextAlignment(.center)
        case .respond:
            Text("Apoi iti raspunde in stilul exemplelor tale. Cu cat ii dai mai multe exemple bune, cu atat raspunde mai bine!")
                .font(AppFont.body())
                .foregroundStyle(AppColor.textSecondary)
                .multilineTextAlignment(.center)
        }
    }

    private func runAnimation() async {
        for next in Scene.allCases {
            scene = next
            try? await Task.sleep(nanoseconds: 4_000_000_000)
        }
        hasShownAll = true
    }
}
