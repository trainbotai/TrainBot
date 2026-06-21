import SwiftUI

struct TeacherBotsView: View {
    @Environment(AuthSession.self) private var authSession
    @State private var vm: TeacherBotsViewModel?
    @State private var selectedBot: TeacherBot?

    var body: some View {
        Group {
            if let vm {
                content(vm: vm)
            } else {
                ProgressView()
                    .task {
                        let viewModel = TeacherBotsViewModel(authSession: authSession)
                        await viewModel.load()
                        vm = viewModel
                    }
            }
        }
        .navigationTitle("Boții profesorului")
        .navigationBarTitleDisplayMode(.large)
    }

    @ViewBuilder
    private func content(vm: TeacherBotsViewModel) -> some View {
        if vm.isLoading {
            ProgressView()
        } else if let error = vm.errorMessage {
            VStack(spacing: 12) {
                Text(error).foregroundStyle(AppColor.danger)
                PrimaryButton("Reincearcă") {
                    Task { await vm.load() }
                }
            }
            .padding()
        } else {
            ScrollView {
                VStack(spacing: 14) {
                    if vm.bots.isEmpty {
                        emptyState
                    } else {
                        ForEach(vm.bots) { bot in
                            Button {
                                selectedBot = bot
                            } label: {
                                botCard(bot)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
            }
            .navigationDestination(item: $selectedBot) { bot in
                ChatView(
                    sessionId: bot.id,
                    sessionName: bot.name,
                    teacherBotId: bot.id
                )
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            MascotView(state: .idle, size: 100)
            Text("Niciun bot disponibil")
                .font(AppFont.title())
                .foregroundStyle(AppColor.textPrimary)
            Text("Profesorul tău n-a creat încă boți. Revino mai târziu!")
                .font(AppFont.body())
                .foregroundStyle(AppColor.textSecondary)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 60)
        .padding(.horizontal, 20)
    }

    private func botCard(_ bot: TeacherBot) -> some View {
        AppCard {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(AppColor.primaryPurple.opacity(0.12))
                        .frame(width: 48, height: 48)
                    Image(systemName: "person.fill.checkmark")
                        .font(.system(size: 20))
                        .foregroundStyle(AppColor.primaryPurple)
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text(bot.name)
                        .font(AppFont.title())
                        .foregroundStyle(AppColor.textPrimary)
                    Text("creat de \(bot.teacherName)")
                        .font(AppFont.bodySmall())
                        .foregroundStyle(AppColor.textSecondary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundStyle(AppColor.textSecondary)
            }
        }
    }
}

#Preview {
    NavigationStack {
        TeacherBotsView()
            .environment(AuthSession())
    }
}
