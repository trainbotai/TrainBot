import SwiftUI

struct BotListView: View {
    @Environment(AuthSession.self) private var authSession
    @State private var vm: BotListViewModel?
    @State private var showEditor = false
    @State private var editingSession: SessionSummary?
    @State private var selectedSession: SessionSummary?
    @State private var showAnimation = false
    @AppStorage("llm.hasSeenAnimation") private var hasSeenAnimation = false

    var body: some View {
        Group {
            if let vm {
                content(vm: vm)
            } else {
                ProgressView()
                    .task {
                        let service = LLMService(authSession: authSession)
                        let viewModel = BotListViewModel(service: service)
                        await viewModel.load()
                        vm = viewModel
                        if !hasSeenAnimation {
                            showAnimation = true
                        }
                    }
            }
        }
        .navigationTitle("AI-ul tau")
        .navigationBarTitleDisplayMode(.large)
        .fullScreenCover(isPresented: $showAnimation) {
            TokenizationAnimationView {
                hasSeenAnimation = true
                showAnimation = false
            }
        }
    }

    @ViewBuilder
    private func content(vm: BotListViewModel) -> some View {
        if vm.isLoading {
            ProgressView()
        } else if let error = vm.errorMessage {
            VStack(spacing: 12) {
                Text(error).foregroundStyle(AppColor.danger)
                PrimaryButton("Reincearca") {
                    Task { await vm.load() }
                }
            }
            .padding()
        } else {
            ScrollView {
                VStack(spacing: 14) {
                    if let quota = vm.quota {
                        quotaCard(quota)
                    }
                    if vm.sessions.isEmpty {
                        emptyState
                    } else {
                        ForEach(vm.sessions) { session in
                            Button {
                                selectedSession = session
                            } label: {
                                sessionCard(session)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    newBotButton
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
            }
            .navigationDestination(item: $selectedSession) { session in
                ChatView(sessionId: session.id, sessionName: session.name)
            }
            .sheet(isPresented: $showEditor) {
                BotEditorView(
                    editing: editingSession,
                    onSaved: { _ in
                        Task { await vm.load() }
                        showEditor = false
                    }
                )
            }
        }
    }

    private func quotaCard(_ q: QueryQuota) -> some View {
        AppCard {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Mesaje ramase azi").font(AppFont.bodySmall()).foregroundStyle(AppColor.textSecondary)
                    Text("\(q.remaining) / \(q.limit)").font(AppFont.title()).foregroundStyle(AppColor.primaryPurple)
                }
                Spacer()
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            MascotView(state: .happy, size: 100)
            Text("Niciun bot inca").font(AppFont.title()).foregroundStyle(AppColor.textPrimary)
            Text("Creeaza primul tau bot AI dandu-i exemple de cum sa raspunda.").font(AppFont.body()).foregroundStyle(AppColor.textSecondary).multilineTextAlignment(.center)
        }
        .padding(.top, 40)
        .padding(.horizontal, 20)
    }

    private var newBotButton: some View {
        PrimaryButton("Bot nou") {
            editingSession = nil
            showEditor = true
        }
    }

    private func sessionCard(_ s: SessionSummary) -> some View {
        AppCard {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(s.name).font(AppFont.title()).foregroundStyle(AppColor.textPrimary)
                    Text("\(s.versionsCount) versiuni · \(s.queriesCount) mesaje").font(AppFont.bodySmall()).foregroundStyle(AppColor.textSecondary)
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
        BotListView()
            .environment(AuthSession())
    }
}
