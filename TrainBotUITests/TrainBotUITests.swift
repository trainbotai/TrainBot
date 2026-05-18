import XCTest

final class TrainBotUITests: XCTestCase {
    func test_app_launches() throws {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.exists)
    }
}
