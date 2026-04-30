import XCTest
@testable import TrainBot

final class KeychainHelperTests: XCTestCase {

    func test_save_and_load_returnsStoredValue() {
        let key = "test.\(UUID().uuidString)"
        KeychainHelper.save("hello-world", for: key)
        XCTAssertEqual(KeychainHelper.load(for: key), "hello-world")
        KeychainHelper.delete(for: key)
    }

    func test_load_missingKey_returnsNil() {
        let key = "nonexistent.\(UUID().uuidString)"
        XCTAssertNil(KeychainHelper.load(for: key))
    }

    func test_delete_removesValue() {
        let key = "test.\(UUID().uuidString)"
        KeychainHelper.save("to-be-deleted", for: key)
        KeychainHelper.delete(for: key)
        XCTAssertNil(KeychainHelper.load(for: key))
    }

    func test_overwrite_replacesOldValue() {
        let key = "test.\(UUID().uuidString)"
        KeychainHelper.save("first", for: key)
        KeychainHelper.save("second", for: key)
        XCTAssertEqual(KeychainHelper.load(for: key), "second")
        KeychainHelper.delete(for: key)
    }
}
