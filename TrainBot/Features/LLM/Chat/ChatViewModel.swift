import Foundation
import Observation

@Observable
@MainActor
final class ChatViewModel {
    let sessionId: String
    let sessionName: String
    /// When non-nil, this ViewModel operates in teacher-bot mode:
    /// streams from /teacher-bots/{id}/query and skips history loading.
    let teacherBotId: String?

    private(set) var history: [ChatHistoryItem] = []
    private(set) var pendingMessage: PendingMessage?
    private(set) var quota: QueryQuota?
    private(set) var isLoading = false
    private(set) var errorMessage: String?

    private let service: LLMService
    private let streaming: LLMStreamingService

    init(sessionId: String, sessionName: String, service: LLMService, streaming: LLMStreamingService, teacherBotId: String? = nil) {
        self.sessionId = sessionId
        self.sessionName = sessionName
        self.service = service
        self.streaming = streaming
        self.teacherBotId = teacherBotId
    }

    func load() async {
        // Teacher-bot chat has no history; only load quota so the counter is shown.
        if teacherBotId != nil {
            quota = try? await service.getQuota()
            return
        }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            async let historyTask = service.listQueries(sessionId: sessionId, version: nil)
            async let quotaTask = service.getQuota()
            history = try await historyTask
            quota = try await quotaTask
        } catch let error as APIError {
            errorMessage = errorDescription(error)
        } catch {
            errorMessage = "A aparut o eroare la incarcarea conversatiei."
        }
    }

    func send(_ prompt: String) async {
        guard pendingMessage == nil else { return }
        let pending = PendingMessage(userPrompt: prompt)
        pendingMessage = pending

        do {
            let stream: AsyncThrowingStream<SSEEvent, Error>
            if let botId = teacherBotId {
                stream = try await streaming.streamTeacherBotQuery(botId: botId, prompt: prompt)
            } else {
                stream = try await streaming.streamQuery(sessionId: sessionId, prompt: prompt)
            }
            for try await event in stream {
                switch event {
                case .chunk(let text):
                    pendingMessage?.accumulatedResponse += text
                case .done:
                    pendingMessage?.isComplete = true
                }
            }
            // Persist into history and refresh quota
            if let completed = pendingMessage, completed.isComplete {
                let newItem = ChatHistoryItem(
                    id: completed.id.uuidString,
                    userPrompt: completed.userPrompt,
                    aiResponse: completed.accumulatedResponse,
                    flagged: false,
                    createdAt: ISO8601DateFormatter().string(from: Date())
                )
                history.append(newItem)
            }
            pendingMessage = nil
            quota = try? await service.getQuota()
        } catch let error as APIError {
            errorMessage = errorDescription(error)
            pendingMessage = nil
        } catch {
            errorMessage = "A aparut o eroare la trimitere."
            pendingMessage = nil
        }
    }

    func reportSession(reason: String?) async -> Bool {
        do {
            _ = try await service.reportSession(sessionId: sessionId, reason: reason)
            return true
        } catch {
            errorMessage = "Nu am putut trimite raportul."
            return false
        }
    }

    private func errorDescription(_ err: APIError) -> String {
        switch err {
        case .unauthorized: return "Sesiunea ta a expirat. Conecteaza-te din nou."
        case .network: return "Verifica conexiunea la internet."
        case .httpError(_, let detail): return detail
        default: return "A aparut o eroare."
        }
    }
}
