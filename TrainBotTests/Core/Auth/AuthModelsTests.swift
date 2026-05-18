import XCTest
@testable import TrainBot

final class AuthModelsTests: XCTestCase {

    func test_authUser_decodesFromJSON() throws {
        let json = """
        {"id":"abc123","role":"student","name":"Ion Pop","tenantId":"tenant-1"}
        """.data(using: .utf8)!
        let user = try JSONDecoder().decode(AuthUser.self, from: json)
        XCTAssertEqual(user.id, "abc123")
        XCTAssertEqual(user.role, "student")
        XCTAssertEqual(user.name, "Ion Pop")
        XCTAssertEqual(user.tenantId, "tenant-1")
    }

    func test_authResponse_decodesFromJSON() throws {
        let json = """
        {
          "accessToken": "at-token",
          "refreshToken": "rt-token",
          "user": {"id":"u1","role":"student","name":"Ana","tenantId":"t1"}
        }
        """.data(using: .utf8)!
        let res = try JSONDecoder().decode(AuthResponse.self, from: json)
        XCTAssertEqual(res.accessToken, "at-token")
        XCTAssertEqual(res.refreshToken, "rt-token")
        XCTAssertEqual(res.user.name, "Ana")
    }

    func test_problemDetail_decodesDetailField() throws {
        let json = """
        {"type":"https://trainbot.ro/errors/unauthorized","title":"Unauthorized","status":401,"detail":"Invalid class code, username, or password","instance":"/api/v1/auth/student/login"}
        """.data(using: .utf8)!
        let pd = try JSONDecoder().decode(ProblemDetail.self, from: json)
        XCTAssertEqual(pd.detail, "Invalid class code, username, or password")
    }

    func test_emptyResponse_decodesFromEmptyObject() throws {
        let json = "{}".data(using: .utf8)!
        XCTAssertNoThrow(try JSONDecoder().decode(EmptyResponse.self, from: json))
    }
}
