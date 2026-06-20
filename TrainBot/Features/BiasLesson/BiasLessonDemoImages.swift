import UIKit

/// Generates simple demo images for the bias lesson.
/// Uses programmatic drawing — no external assets required.
enum BiasLessonDemoImages {

    // MARK: - Public

    /// 5 red-apple-like images (red circle + green stem on white).
    static var redApples: [UIImage] {
        (0..<5).map { i in drawApple(bodyColor: .systemRed, variant: i) }
    }

    /// 1 green-apple-like image for the test step.
    static var greenApple: UIImage {
        drawApple(bodyColor: .systemGreen, variant: 0)
    }

    // MARK: - Drawing

    private static func drawApple(bodyColor: UIColor, variant: Int) -> UIImage {
        let size = CGSize(width: 224, height: 224)
        let renderer = UIGraphicsImageRenderer(size: size)

        return renderer.image { ctx in
            // Background
            UIColor.white.setFill()
            ctx.fill(CGRect(origin: .zero, size: size))

            let c = ctx.cgContext
            let center = CGPoint(x: size.width / 2, y: size.height / 2 + 10)
            let radius: CGFloat = 80 + CGFloat(variant % 3) * 4

            // Apple body
            c.setFillColor(bodyColor.cgColor)
            c.addEllipse(in: CGRect(x: center.x - radius, y: center.y - radius,
                                    width: radius * 2, height: radius * 2))
            c.fillPath()

            // Slight shine
            let shineColor = UIColor.white.withAlphaComponent(0.3)
            c.setFillColor(shineColor.cgColor)
            let shineR: CGFloat = radius * 0.3
            c.addEllipse(in: CGRect(x: center.x - radius * 0.4 - shineR / 2,
                                    y: center.y - radius * 0.45 - shineR / 2,
                                    width: shineR, height: shineR))
            c.fillPath()

            // Stem
            c.setStrokeColor(UIColor.brown.cgColor)
            c.setLineWidth(6)
            c.setLineCap(.round)
            c.move(to: CGPoint(x: center.x, y: center.y - radius))
            c.addLine(to: CGPoint(x: center.x + 10, y: center.y - radius - 22))
            c.strokePath()

            // Leaf
            c.setFillColor(UIColor.systemGreen.cgColor)
            let leafPath = CGMutablePath()
            let leafBase = CGPoint(x: center.x + 4, y: center.y - radius - 10)
            leafPath.move(to: leafBase)
            leafPath.addQuadCurve(to: CGPoint(x: center.x + 26, y: center.y - radius - 20),
                                  control: CGPoint(x: center.x + 20, y: center.y - radius - 30))
            leafPath.addQuadCurve(to: leafBase,
                                  control: CGPoint(x: center.x + 10, y: center.y - radius - 5))
            c.addPath(leafPath)
            c.fillPath()

            // Label text (small, descriptive)
            let attrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 14, weight: .medium),
                .foregroundColor: UIColor.darkGray
            ]
            let label = bodyColor == .systemRed ? "măr roșu" : "măr verde"
            (label as NSString).draw(at: CGPoint(x: 10, y: size.height - 26), withAttributes: attrs)
        }
    }
}
