import XCTest
@testable import TrainBot

final class BotEditorViewModelTests: XCTestCase {
    @MainActor
    func test_initialState_hasOneEmptyExample_andIsInvalid() {
        let service = LLMService(authSession: AuthSession())
        let vm = BotEditorViewModel(service: service)
        XCTAssertEqual(vm.examples.count, 1)
        XCTAssertFalse(vm.isValid)
    }

    @MainActor
    func test_isValid_withNameAndOneExample() {
        let service = LLMService(authSession: AuthSession())
        let vm = BotEditorViewModel(service: service)
        vm.name = "Robot"
        vm.examples[0].user = "Salut"
        vm.examples[0].ai = "Buna"
        XCTAssertTrue(vm.isValid)
    }

    @MainActor
    func test_isInvalid_whenExampleTooLong() {
        let service = LLMService(authSession: AuthSession())
        let vm = BotEditorViewModel(service: service)
        vm.name = "Robot"
        vm.examples[0].user = String(repeating: "a", count: 501)
        vm.examples[0].ai = "Buna"
        XCTAssertFalse(vm.isValid)
    }

    @MainActor
    func test_addExample_capsAtMax() {
        let service = LLMService(authSession: AuthSession())
        let vm = BotEditorViewModel(service: service)
        for _ in 0..<15 { vm.addExample() }
        XCTAssertEqual(vm.examples.count, BotEditorViewModel.maxExamples)
    }
}
