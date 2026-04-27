import SwiftUI

struct OnboardingView: View {
    @AppStorage("hasSeenOnboarding") private var hasSeenOnboarding = false
    @State private var page = 0

    var body: some View {
        VStack(spacing: 30) {
            TabView(selection: $page) {
                onboardingPage(title: "Antreneaza", subtitle: "Invata AI-ul tau cu poze. Cu cat mai multe, cu atat mai bine!", icon: "brain.head.profile", state: .learning).tag(0)
                onboardingPage(title: "Testeaza", subtitle: "Vezi cat de bine recunoaste ce-i arati.", icon: "magnifyingglass", state: .thinking).tag(1)
                onboardingPage(title: "Invata despre AI", subtitle: "Descopera cum functioneaza inteligenta artificiala.", icon: "sparkles", state: .happy).tag(2)
            }
            .tabViewStyle(.page)

            PrimaryButton(page < 2 ? "Mai departe" : "Incepe!") {
                if page < 2 { page += 1 } else { hasSeenOnboarding = true }
            }
            .padding(.horizontal, 30)
            .padding(.bottom, 40)
        }
        .background(AppColor.surfaceLight)
    }

    private func onboardingPage(title: String, subtitle: String, icon: String, state: MascotState) -> some View {
        VStack(spacing: 20) {
            MascotView(state: state, size: 160).padding(.top, 60)
            Text(title).font(AppFont.displayMedium()).foregroundStyle(AppColor.primaryPurple)
            Text(subtitle).font(AppFont.body()).foregroundStyle(AppColor.textSecondary)
                .multilineTextAlignment(.center).padding(.horizontal, 40)
            Spacer()
        }
    }
}
