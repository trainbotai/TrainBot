import Foundation

@MainActor
final class LLMStreamingService {
    private let authSession: AuthSession

    init(authSession: AuthSession) {
        self.authSession = authSession
    }

    struct QueryDone {
        let inputTokens: Int
        let outputTokens: Int
    }

    /// Streams a teacher-bot response identically to `streamQuery`.
    func streamTeacherBotQuery(botId: String, prompt: String) async throws -> AsyncThrowingStream<SSEEvent, Error> {
        let url = URL(string: "\(APIEndpoint.baseURL)/student/llm/teacher-bots/\(botId)/query")!
        return try await openStream(url: url, prompt: prompt)
    }

    /// Streams the LLM response chunk-by-chunk.
    /// Caller observes the AsyncStream and accumulates text in their ViewModel.
    /// Throws on HTTP errors before stream starts (401, 429, 400, 502, 503).
    func streamQuery(sessionId: String, prompt: String) async throws -> (AsyncThrowingStream<SSEEvent, Error>) {
        let url = URL(string: "\(APIEndpoint.baseURL)/student/llm/sessions/\(sessionId)/query")!
        return try await openStream(url: url, prompt: prompt)
    }

    private func openStream(url: URL, prompt: String) async throws -> AsyncThrowingStream<SSEEvent, Error> {
        struct Body: Encodable { let prompt: String }
        let body = try JSONEncoder().encode(Body(prompt: prompt))

        // withAuth refreshes the token and retries once if the server answers 401.
        let bytes = try await authSession.withAuth { token in
            var req = URLRequest(url: url)
            req.httpMethod = "POST"
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            req.setValue("text/event-stream", forHTTPHeaderField: "Accept")
            req.httpBody = body

            let (bytes, response) = try await URLSession.shared.bytes(for: req)
            guard let http = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            if !(200..<300).contains(http.statusCode) {
                var data = Data()
                for try await byte in bytes { data.append(byte) }
                let detail = (try? JSONDecoder().decode(ProblemDetail.self, from: data))?.detail
                    ?? "Eroare \(http.statusCode)"
                if http.statusCode == 401 { throw APIError.unauthorized }
                throw APIError.httpError(statusCode: http.statusCode, detail: detail)
            }
            return bytes
        }

        return AsyncThrowingStream { continuation in
            let task = Task {
                do {
                    for try await line in bytes.lines {
                        if let event = SSEParser.parseLine(line) {
                            continuation.yield(event)
                            if case .done = event {
                                continuation.finish()
                                return
                            }
                        }
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
            // Stop reading (and close the connection) when the consumer goes away.
            continuation.onTermination = { _ in task.cancel() }
        }
    }
}
