import Foundation

struct Example: Codable, Equatable, Identifiable {
    let id: UUID
    var user: String
    var ai: String

    init(id: UUID = UUID(), user: String = "", ai: String = "") {
        self.id = id
        self.user = user
        self.ai = ai
    }

    private enum CodingKeys: String, CodingKey { case user, ai }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = UUID()
        self.user = try c.decode(String.self, forKey: .user)
        self.ai = try c.decode(String.self, forKey: .ai)
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(user, forKey: .user)
        try c.encode(ai, forKey: .ai)
    }
}

struct BotVersion: Decodable, Identifiable {
    let id: String
    let versionNumber: Int
    let examples: [Example]
    let createdAt: String
}

struct SessionSummary: Decodable, Identifiable, Hashable {
    let id: String
    let name: String
    let assignmentId: String?
    let currentVersionNumber: Int
    let versionsCount: Int
    let queriesCount: Int
    let flaggedCount: Int
    let createdAt: String
    let updatedAt: String
}

struct SessionDetail: Decodable, Identifiable {
    let id: String
    let name: String
    let assignmentId: String?
    let currentVersionNumber: Int
    let versionsCount: Int
    let queriesCount: Int
    let flaggedCount: Int
    let createdAt: String
    let updatedAt: String
    let versions: [BotVersion]
}

struct SessionListResponse: Decodable {
    let sessions: [SessionSummary]
}
