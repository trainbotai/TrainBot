import XCTest
@testable import TrainBot

final class BotSessionTests: XCTestCase {
    func test_sessionSummary_decodes() throws {
        let json = #"{"id":"s1","name":"Robot prietenos","assignmentId":null,"currentVersionNumber":2,"versionsCount":2,"queriesCount":5,"flaggedCount":0,"createdAt":"2026-06-08T10:00:00Z","updatedAt":"2026-06-08T10:00:00Z"}"#.data(using: .utf8)!
        let s = try JSONDecoder().decode(SessionSummary.self, from: json)
        XCTAssertEqual(s.id, "s1")
        XCTAssertEqual(s.name, "Robot prietenos")
        XCTAssertNil(s.assignmentId)
        XCTAssertEqual(s.currentVersionNumber, 2)
    }

    func test_sessionListResponse_decodes() throws {
        let json = #"{"sessions":[]}"#.data(using: .utf8)!
        let r = try JSONDecoder().decode(SessionListResponse.self, from: json)
        XCTAssertEqual(r.sessions.count, 0)
    }

    func test_example_roundtrip() throws {
        let ex = Example(user: "Salut", ai: "Salut prieten")
        let data = try JSONEncoder().encode(ex)
        let decoded = try JSONDecoder().decode(Example.self, from: data)
        XCTAssertEqual(decoded.user, "Salut")
        XCTAssertEqual(decoded.ai, "Salut prieten")
    }

    func test_chatHistoryResponse_decodes() throws {
        let json = #"{"queries":[{"id":"q1","userPrompt":"hi","aiResponse":"salut","flagged":false,"createdAt":"2026-06-08T10:00:00Z"}]}"#.data(using: .utf8)!
        let r = try JSONDecoder().decode(ChatHistoryResponse.self, from: json)
        XCTAssertEqual(r.queries.count, 1)
        XCTAssertFalse(r.queries[0].flagged)
    }
}
