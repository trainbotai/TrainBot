import XCTest
@testable import TrainBot

/// URLProtocol stub: routes by path, records requests.
final class StubURLProtocol: URLProtocol {
    nonisolated(unsafe) static var handler: ((URLRequest) -> (Int, String))?
    nonisolated(unsafe) static var requests: [URLRequest] = []
    private static let lock = NSLock()

    static func reset() {
        lock.lock(); defer { lock.unlock() }
        handler = nil; requests = []
    }
    static func count(path: String) -> Int {
        lock.lock(); defer { lock.unlock() }
        return requests.filter { $0.url?.path.hasSuffix(path) == true }.count
    }

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        Self.lock.lock()
        Self.requests.append(request)
        let h = Self.handler
        Self.lock.unlock()
        let (status, body) = h?(request) ?? (500, "{}")
        if status == 0 { // simulated network failure
            client?.urlProtocol(self, didFailWithError: URLError(.notConnectedToInternet))
            return
        }
        let resp = HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: nil, headerFields: nil)!
        client?.urlProtocol(self, didReceive: resp, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: Data(body.utf8))
        client?.urlProtocolDidFinishLoading(self)
    }
    override func stopLoading() {}
}

@MainActor
final class AuthRefreshTests: XCTestCase {
    private var session: AuthSession!

    private func authJSON(access: String, refresh: String) -> String {
        """
        {"accessToken":"\(access)","refreshToken":"\(refresh)",
         "user":{"id":"u1","role":"student","name":"Ana","tenantId":"t1"}}
        """
    }

    override func setUp() async throws {
        StubURLProtocol.reset()
        let cfg = URLSessionConfiguration.ephemeral
        cfg.protocolClasses = [StubURLProtocol.self]
        let api = APIClient(session: URLSession(configuration: cfg))
        // Login through the stub to seed tokens.
        StubURLProtocol.handler = { _ in (200, self.authJSON(access: "a0", refresh: "r0")) }
        session = AuthSession(api: api)
        try await session.login(classCode: "C", username: "ana", password: "pw")
        StubURLProtocol.requests = []
    }

    override func tearDown() async throws {
        StubURLProtocol.reset()
        StubURLProtocol.handler = { _ in (200, "{}") }
        await session.logout()
        StubURLProtocol.reset()
    }

    func test_401_refreshes_then_retriesOnce() async throws {
        StubURLProtocol.handler = { req in
            switch req.url!.path.hasSuffix("/auth/refresh") ? "refresh" : "x" {
            case "refresh": return (200, self.authJSON(access: "a1", refresh: "r1"))
            default:
                let ok = req.value(forHTTPHeaderField: "Authorization") == "Bearer a1"
                return ok ? (200, "{}") : (401, "{}")
            }
        }
        let _: EmptyResponse = try await session.request(APIEndpoint.llmQuota())
        XCTAssertEqual(session.accessToken, "a1")
        XCTAssertEqual(session.refreshToken, "r1")
        XCTAssertEqual(StubURLProtocol.count(path: "/auth/refresh"), 1)
        XCTAssertEqual(StubURLProtocol.requests.count, 3) // 401, refresh, retry
    }

    func test_concurrent401s_triggerSingleRefresh() async throws {
        StubURLProtocol.handler = { req in
            switch req.url!.path.hasSuffix("/auth/refresh") ? "refresh" : "x" {
            case "refresh": return (200, self.authJSON(access: "a1", refresh: "r1"))
            default:
                let ok = req.value(forHTTPHeaderField: "Authorization") == "Bearer a1"
                return ok ? (200, "{}") : (401, "{}")
            }
        }
        let s = session!
        try await withThrowingTaskGroup(of: Void.self) { group in
            for _ in 0..<5 {
                group.addTask { @MainActor in
                    let _: EmptyResponse = try await s.request(APIEndpoint.llmQuota())
                }
            }
            try await group.waitForAll()
        }
        XCTAssertEqual(StubURLProtocol.count(path: "/auth/refresh"), 1)
        XCTAssertEqual(session.accessToken, "a1")
    }

    func test_refreshRejected_logsOut() async {
        StubURLProtocol.handler = { _ in (401, "{}") }
        do {
            let _: EmptyResponse = try await session.request(APIEndpoint.llmQuota())
            XCTFail("expected unauthorized")
        } catch {
            guard case APIError.unauthorized = error else { return XCTFail("got \(error)") }
        }
        XCTAssertFalse(session.isAuthenticated)
        XCTAssertNil(session.accessToken)
        XCTAssertNil(session.refreshToken)
    }

    func test_refreshNetworkFailure_keepsSession() async {
        StubURLProtocol.handler = { req in
            req.url!.path.hasSuffix("/auth/refresh") ? (0, "") : (401, "{}")
        }
        do {
            let _: EmptyResponse = try await session.request(APIEndpoint.llmQuota())
            XCTFail("expected error")
        } catch {
            XCTAssertNotNil(error)
        }
        XCTAssertTrue(session.isAuthenticated)
        XCTAssertEqual(session.refreshToken, "r0")
    }
}
