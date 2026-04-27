import SwiftUI

struct SettingsView: View {
    @AppStorage("botName") private var botName = "TrainBot"
    @AppStorage("soundEnabled") private var soundEnabled = true
    @AppStorage("hasSeenOnboarding") private var hasSeenOnboarding = true

    var body: some View {
        Form {
            Section("Bot") {
                TextField("Numele bot-ului", text: $botName)
                Toggle("Sunete", isOn: $soundEnabled)
            }
            Section("Tutorial") {
                Button("Afiseaza din nou tutorialul") { hasSeenOnboarding = false }
            }
            Section("Despre") {
                Text("TrainBot v1.0.0 (Faza 0)")
                Text("Facut cu drag pentru Crocorobo")
            }
        }
        .navigationTitle("Setari")
    }
}
