import SwiftUI

@main
// Entry point for the TrainBot application
struct TrainBotApp: App {
    @StateObject private var settings = AppSettings() // Shared app settings
    
    var body: some Scene {
        WindowGroup {
            // Check if the bot setup is completed; show onboarding if not
            if UserDefaults.standard.bool(forKey: "isBotSetupCompleted") {
                OnboardingView()
                    .environmentObject(settings) // Pass shared settings to the environment
            } else {
                BotSetupView()
                    .environmentObject(settings) // Pass shared settings to the environment
            }
        }
    }
}
