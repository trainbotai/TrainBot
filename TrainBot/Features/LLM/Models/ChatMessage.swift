import Foundation

struct ChatHistoryItem: Decodable, Identifiable {
    let id: String
    let userPrompt: String
    let aiResponse: String
    let flagged: Bool
    let createdAt: String
}

struct ChatHistoryResponse: Decodable {
    let queries: [ChatHistoryItem]
}

/// Local-only — used in ChatViewModel for in-progress streaming response.
struct PendingMessage: Identifiable {
    let id: UUID = UUID()
    let userPrompt: String
    var accumulatedResponse: String = ""
    var isComplete: Bool = false
}
