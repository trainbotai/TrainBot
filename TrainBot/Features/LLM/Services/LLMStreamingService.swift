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
        guard let token = authSession.accessToken else {
            throw APIError.unauthorized
        }
        let url = URL(string: "\(APIEndpoint.baseURL)/student/llm/teacher-bots/\(botId)/query")!
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        struct Body: Encodable { let prompt: String }
        req.httpBody = try JSONEncoder().encode(Body(prompt: prompt))

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

        return AsyncThrowingStream { continuation in
            Task {
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
        }
    }

    /// Streams the LLM response chunk-by-chunk.
    /// Caller observes the AsyncStream and accumulates text in their ViewModel.
    /// Throws on HTTP errors before stream starts (401, 429, 400, 502, 503).
    func streamQuery(sessionId: String, prompt: String) async throws -> (AsyncThrowingStream<SSEEvent, Error>) {
        guard let token = authSession.accessToken else {
            throw APIError.unauthorized
        }

        let url = URL(string: "\(APIEndpoint.baseURL)/student/llm/sessions/\(sessionId)/query")!
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        struct Body: Encodable { let prompt: String }
        req.httpBody = try JSONEncoder().encode(Body(prompt: prompt))

        let (bytes, response) = try await URLSession.shared.bytes(for: req)

        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        if !(200..<300).contains(http.statusCode) {
            // Drain bytes into Data and decode ProblemDetail for the error message
            var data = Data()
            for try await byte in bytes { data.append(byte) }
            let detail = (try? JSONDecoder().decode(ProblemDetail.self, from: data))?.detail
                ?? "Eroare \(http.statusCode)"
            if http.statusCode == 401 { throw APIError.unauthorized }
            throw APIError.httpError(statusCode: http.statusCode, detail: detail)
        }

        return AsyncThrowingStream { continuation in
            Task {
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
        }
    }
}
