import SwiftUI

@main
struct TrainBotApp: App {
    let persistence = PersistenceController.shared
    @AppStorage("hasSeenOnboarding") private var hasSeenOnboarding = false
    @State private var authSession = AuthSession()
    @State private var mlSync: MLSyncService

    init() {
        let session = AuthSession()
        self._authSession = State(initialValue: session)
        self._mlSync = State(initialValue: MLSyncService(
            context: PersistenceController.shared.container.viewContext,
            authSession: session
        ))
    }

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
            .environment(mlSync)
            .task(id: authSession.isAuthenticated) {
                if authSession.isAuthenticated && authSession.currentUser?.role == "student" {
                    await mlSync.syncAll()
                }
            }
        }
    }
}
