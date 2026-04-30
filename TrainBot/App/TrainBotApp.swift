import SwiftUI

@main
struct TrainBotApp: App {
    let persistence = PersistenceController.shared
    @AppStorage("hasSeenOnboarding") private var hasSeenOnboarding = false
    @State private var authSession = AuthSession()

    var body: some Scene {
        WindowGroup {
            Group {
                if !authSession.isAuthenticated {
                    StudentLoginView(authSession: authSession)
                } else if !hasSeenOnboarding {
                    OnboardingView()
                } else {
                    HomeView()
                }
            }
            .environment(\.managedObjectContext, persistence.container.viewContext)
            .environment(authSession)
        }
    }
}
