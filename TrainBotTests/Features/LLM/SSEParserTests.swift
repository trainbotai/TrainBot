import XCTest
@testable import TrainBot

final class SSEParserTests: XCTestCase {
    func test_parsesChunk() {
        let event = SSEParser.parseLine(#"data: {"chunk":"Salut"}"#)
        guard case .chunk(let text) = event else { XCTFail("expected chunk"); return }
        XCTAssertEqual(text, "Salut")
    }

    func test_parsesWhitespaceChunk() {
        let event = SSEParser.parseLine(#"data: {"chunk":" "}"#)
        guard case .chunk(let text) = event else { XCTFail("expected chunk"); return }
        XCTAssertEqual(text, " ")
    }

    func test_parsesDoneEvent() {
        let event = SSEParser.parseLine(#"data: {"done":true,"inputTokens":100,"outputTokens":20}"#)
        guard case .done(let inT, let outT) = event else { XCTFail("expected done"); return }
        XCTAssertEqual(inT, 100)
        XCTAssertEqual(outT, 20)
    }

    func test_returnsNilForInvalidLine() {
        XCTAssertNil(SSEParser.parseLine("not a data line"))
        XCTAssertNil(SSEParser.parseLine("data: not json"))
        XCTAssertNil(SSEParser.parseLine(""))
    }

    func test_ignoresEmptyLine() {
        XCTAssertNil(SSEParser.parseLine(""))
    }
}
