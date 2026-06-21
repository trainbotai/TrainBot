import UIKit

/// Programmatic demo images for the "More data = smarter AI" lesson.
enum MoreDataLessonDemoImages {

    // MARK: - Public

    /// Returns `count` apple images with slight visual variation each.
    static func apples(count: Int) -> [UIImage] {
        (0..<count).map { drawApple(variant: $0) }
    }

    /// A fixed test apple used for both low-data and high-data prediction.
    static var testApple: UIImage {
        drawApple(variant: 99)  // distinct variant not in training set
    }

    // MARK: - Drawing

    private static func drawApple(variant: Int) -> UIImage {
        let size = CGSize(width: 224, height: 224)
        let renderer = UIGraphicsImageRenderer(size: size)

        // Cycle through slight hue/size variations to simulate real-world diversity
        let hueShift = CGFloat(variant % 6) * 0.015   // slight red hue shift
        let radiusDelta = CGFloat(variant % 4) * 5.0  // size variation

        return renderer.image { ctx in
            // Background — slight off-white variation
            let bgBrightness = 0.97 - CGFloat(variant % 3) * 0.02
            UIColor(white: bgBrightness, alpha: 1).setFill()
            ctx.fill(CGRect(origin: .zero, size: size))

            let c = ctx.cgContext
            let center = CGPoint(x: size.width / 2, y: size.height / 2 + 8)
            let radius: CGFloat = 78 + radiusDelta

            // Apple body
            let bodyColor = UIColor(hue: 0.02 + hueShift, saturation: 0.85, brightness: 0.82, alpha: 1)
            c.setFillColor(bodyColor.cgColor)
            c.addEllipse(in: CGRect(x: center.x - radius, y: center.y - radius,
                                    width: radius * 2, height: radius * 2))
            c.fillPath()

            // Shine
            c.setFillColor(UIColor.white.withAlphaComponent(0.28).cgColor)
            let shineR: CGFloat = radius * 0.3
            c.addEllipse(in: CGRect(x: center.x - radius * 0.4 - shineR / 2,
                                    y: center.y - radius * 0.44 - shineR / 2,
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

            // Small variant label for debugging (optional, very faint)
            let attrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 12, weight: .light),
                .foregroundColor: UIColor.lightGray
            ]
            ("v\(variant)" as NSString).draw(at: CGPoint(x: 6, y: size.height - 20), withAttributes: attrs)
        }
    }
}
