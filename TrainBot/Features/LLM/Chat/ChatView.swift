import SwiftUI

struct ChatView: View {
    @Environment(AuthSession.self) private var authSession
    let sessionId: String
    let sessionName: String

    @State private var vm: ChatViewModel?
    @State private var inputText: String = ""
    @State private var showReport = false

    var body: some View {
        Group {
            if let vm {
                content(vm: vm)
            } else {
                ProgressView()
                    .task {
                        let service = LLMService(authSession: authSession)
                        let streaming = LLMStreamingService(authSession: authSession)
                        let viewModel = ChatViewModel(sessionId: sessionId, sessionName: sessionName, service: service, streaming: streaming)
                        await viewModel.load()
                        vm = viewModel
                    }
            }
        }
        .navigationTitle(sessionName)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showReport = true } label: {
                    Image(systemName: "flag")
                }
            }
        }
        .sheet(isPresented: $showReport) {
            if let vm {
                ReportSheet(onSubmit: { reason in
                    let ok = await vm.reportSession(reason: reason)
                    return ok
                })
            }
        }
    }

    @ViewBuilder
    private func content(vm: ChatViewModel) -> some View {
        VStack(spacing: 0) {
            if let quota = vm.quota {
                HStack {
                    Text("\(quota.remaining) / \(quota.limit) mesaje ramase azi")
                        .font(AppFont.bodySmall())
                        .foregroundStyle(AppColor.textSecondary)
                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(AppColor.backgroundWhite.opacity(0.5))
            }

            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 10) {
                        ForEach(vm.history) { item in
                            MessageBubble(text: item.userPrompt, isUser: true, flagged: item.flagged)
                            MessageBubble(text: item.aiResponse, isUser: false, flagged: item.flagged)
                        }
                        if let pending = vm.pendingMessage {
                            MessageBubble(text: pending.userPrompt, isUser: true, flagged: false)
                            if pending.accumulatedResponse.isEmpty {
                                HStack { ThinkingIndicator(); Spacer() }
                                    .padding(.horizontal, 16)
                            } else {
                                StreamingTextView(text: pending.accumulatedResponse)
                            }
                        }
                        Color.clear.frame(height: 1).id("bottom")
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 12)
                }
                .onChange(of: vm.history.count) { _, _ in
                    withAnimation { proxy.scrollTo("bottom", anchor: .bottom) }
                }
                .onChange(of: vm.pendingMessage?.accumulatedResponse) { _, _ in
                    proxy.scrollTo("bottom", anchor: .bottom)
                }
            }

            if let error = vm.errorMessage {
                Text(error).foregroundStyle(AppColor.danger)
                    .font(AppFont.bodySmall())
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
            }

            HStack(spacing: 8) {
                TextField("Scrie un mesaj...", text: $inputText, axis: .vertical)
                    .lineLimit(1...4)
                    .textFieldStyle(.roundedBorder)
                Button {
                    let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !text.isEmpty, vm.pendingMessage == nil else { return }
                    inputText = ""
                    Task { await vm.send(text) }
                } label: {
                    Image(systemName: "paperplane.fill")
                        .foregroundStyle(.white)
                        .padding(12)
                        .background(AppColor.primaryPurple)
                        .clipShape(Circle())
                }
                .disabled(inputText.trimmingCharacters(in: .whitespaces).isEmpty || vm.pendingMessage != nil)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(AppColor.backgroundWhite)
        }
        .background(AppColor.surfaceLight)
    }
}
