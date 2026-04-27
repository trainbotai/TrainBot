import SwiftUI

@main
struct TrainBotApp: App {
    let persistence = PersistenceController.shared
    @AppStorage("hasSeenOnboarding") private var hasSeenOnboarding = false

    var body: some Scene {
        WindowGroup {
            Group {
                if hasSeenOnboarding {
                    HomeView()
                } else {
                    OnboardingView()
                }
            }
            .environment(\.managedObjectContext, persistence.container.viewContext)
        }
    }
}
