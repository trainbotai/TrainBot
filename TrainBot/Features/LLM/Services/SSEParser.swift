import Foundation

/// Server-Sent Events parser for the LLM faked-stream endpoint.
/// Backend emits two event shapes:
///   - `{"chunk": "<word or whitespace>"}` for each word
///   - `{"done": true, "inputTokens": N, "outputTokens": M}` final event
enum SSEEvent {
    case chunk(String)
    case done(inputTokens: Int, outputTokens: Int)
}

enum SSEParser {
    /// Parses one SSE line of the form `data: {"chunk":"..."}` and returns the event
    /// (or nil if the line does not contain a valid event).
    static func parseLine(_ line: String) -> SSEEvent? {
        guard line.hasPrefix("data: ") else { return nil }
        let jsonString = String(line.dropFirst(6))
        guard let data = jsonString.data(using: .utf8) else { return nil }

        // Try done event first (has explicit "done" key)
        struct DoneEvent: Decodable {
            let done: Bool
            let inputTokens: Int
            let outputTokens: Int
        }
        if let done = try? JSONDecoder().decode(DoneEvent.self, from: data), done.done {
            return .done(inputTokens: done.inputTokens, outputTokens: done.outputTokens)
        }

        // Try chunk event
        struct ChunkEvent: Decodable { let chunk: String }
        if let chunkEvent = try? JSONDecoder().decode(ChunkEvent.self, from: data) {
            return .chunk(chunkEvent.chunk)
        }

        return nil
    }
}
