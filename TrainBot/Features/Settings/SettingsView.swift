import SwiftUI

struct SettingsView: View {
    @AppStorage("botName") private var botName = "TrainBot"
    @AppStorage("soundEnabled") private var soundEnabled = true
    @AppStorage("hasSeenOnboarding") private var hasSeenOnboarding = true
    @AppStorage("uploadImagesEnabled") private var uploadImagesEnabled = false
    @Environment(AuthSession.self) private var authSession
    @Environment(MLSyncService.self) private var mlSync

    private var lastSyncText: String {
        guard let date = mlSync.lastSyncedAt else { return "niciodată" }
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .short
        return f.localizedString(for: date, relativeTo: Date())
    }

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
            Section {
                Toggle("Trimite pozele către profesor", isOn: $uploadImagesEnabled)
            } header: {
                Text("Confidențialitate")
            } footer: {
                Text("Implicit, pozele tale rămân doar pe acest dispozitiv — pleacă doar numele proiectului și cât de bine a învățat modelul. Activează asta doar dacă vrei ca profesorul să vadă și pozele tale.")
            }
            Section("Sincronizare") {
                HStack {
                    Text("Ultima sincronizare")
                    Spacer()
                    Text(lastSyncText).foregroundStyle(.secondary).font(.caption)
                }
                if mlSync.uploadedImageCount > 0 {
                    HStack {
                        Text("Imagini încărcate")
                        Spacer()
                        Text("\(mlSync.uploadedImageCount)").foregroundStyle(.secondary).font(.caption)
                    }
                }
                if let err = mlSync.lastError {
                    Text(err).font(.caption).foregroundStyle(.red)
                }
                Button {
                    Task { await mlSync.syncAll() }
                } label: {
                    HStack {
                        Text(mlSync.isSyncing ? "Se sincronizează..." : "Sincronizează acum")
                        Spacer()
                        if mlSync.isSyncing { ProgressView() }
                    }
                }
                .disabled(mlSync.isSyncing || !authSession.isAuthenticated)
            }
            Section("Legal") {
                Link("Politică de confidențialitate", destination: URL(string: "https://trainbot.moldluca.tech/privacy")!)
                Link("Termeni și Condiții", destination: URL(string: "https://trainbot.moldluca.tech/terms")!)
            }
            Section("Despre") {
                Text("TrainBot v1.0.0 (Faza 1B)")
                Text("Facut cu drag pentru Crocorobo")
            }
        }
        .navigationTitle("Setari")
    }
}
