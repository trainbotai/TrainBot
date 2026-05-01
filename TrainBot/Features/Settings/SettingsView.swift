import SwiftUI

struct SettingsView: View {
    @AppStorage("botName") private var botName = "TrainBot"
    @AppStorage("soundEnabled") private var soundEnabled = true
    @AppStorage("hasSeenOnboarding") private var hasSeenOnboarding = true
    @Environment(AuthSession.self) private var authSession

    var body: some View {
        Form {
            Section("Bot") {
                TextField("Numele bot-ului", text: $botName)
                Toggle("Sunete", isOn: $soundEnabled)
            }
            Section("Tutorial") {
                Button("Afiseaza din nou tutorialul") { hasSeenOnboarding = false }
            }
            Section("Cont") {
                if let user = authSession.currentUser {
                    HStack {
                        Text("Conectat ca")
                        Spacer()
                        Text(user.name).foregroundStyle(.secondary)
                    }
                }
                Button("Deconectare", role: .destructive) {
                    Task { await authSession.logout() }
                }
            }
            Section("Legal") {
                Link("Politică de confidențialitate", destination: URL(string: "https://trainbot.perpetuummobile.tech/privacy")!)
                Link("Termeni și Condiții", destination: URL(string: "https://trainbot.perpetuummobile.tech/terms")!)
            }
            Section("Despre") {
                Text("TrainBot v1.0.0 (Faza 1B)")
                Text("Facut cu drag pentru Crocorobo")
            }
        }
        .navigationTitle("Setari")
    }
}
