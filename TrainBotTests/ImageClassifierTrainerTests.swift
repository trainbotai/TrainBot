import XCTest
import UIKit
@testable import TrainBot

final class ImageClassifierTrainerTests: XCTestCase {
    func test_train_withTooFewLabels_throws() async {
        let trainer = ImageClassifierTrainer()
        do {
            _ = try await trainer.train(labeledImages: ["A": [makeTestImage(.red)]], progress: { _ in })
            XCTFail("Expected throw")
        } catch TrainerError.insufficientLabels {
            // expected
        } catch {
            XCTFail("Wrong error: \(error)")
        }
    }

    func test_train_withTooFewImagesPerLabel_throws() async {
        let trainer = ImageClassifierTrainer()
        do {
            _ = try await trainer.train(labeledImages: [
                "Red": [makeTestImage(.red)],
                "Blue": [makeTestImage(.blue)]
            ], progress: { _ in })
            XCTFail("Expected throw")
        } catch TrainerError.insufficientImagesPerLabel(_, let count) {
            XCTAssertEqual(count, 1)
        } catch {
            XCTFail("Wrong error: \(error)")
        }
    }

    private func makeTestImage(_ color: UIColor, size: CGSize = CGSize(width: 224, height: 224)) -> UIImage {
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { ctx in
            color.setFill()
            ctx.fill(CGRect(origin: .zero, size: size))
        }
    }
}
