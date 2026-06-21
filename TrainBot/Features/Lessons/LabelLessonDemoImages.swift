import UIKit

/// Programmatically-drawn demo images for the label lesson.
/// No external assets required.
enum LabelLessonDemoImages {

    // MARK: - Public

    /// 2 apple images (slight color variation).
    static var apples: [UIImage] {
        [drawApple(variant: 0), drawApple(variant: 1)]
    }

    /// 2 ball images (different stripe colors).
    static var balls: [UIImage] {
        [drawBall(stripeColor: .systemRed, variant: 0),
         drawBall(stripeColor: .systemBlue, variant: 1)]
    }

    // MARK: - Apple drawing

    private static func drawApple(variant: Int) -> UIImage {
        let size = CGSize(width: 200, height: 200)
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { ctx in
            UIColor.white.setFill()
            ctx.fill(CGRect(origin: .zero, size: size))

            let c = ctx.cgContext
            let center = CGPoint(x: 100, y: 110)
            let radius: CGFloat = 65 + CGFloat(variant) * 4

            // Apple body
            c.setFillColor(UIColor.systemRed.cgColor)
            c.addEllipse(in: CGRect(x: center.x - radius, y: center.y - radius,
                                    width: radius * 2, height: radius * 2))
            c.fillPath()

            // Shine
            c.setFillColor(UIColor.white.withAlphaComponent(0.25).cgColor)
            let shineR: CGFloat = radius * 0.28
            c.addEllipse(in: CGRect(x: center.x - radius * 0.38 - shineR / 2,
                                    y: center.y - radius * 0.42 - shineR / 2,
                                    width: shineR, height: shineR))
            c.fillPath()

            // Stem
            c.setStrokeColor(UIColor.brown.cgColor)
            c.setLineWidth(5)
            c.setLineCap(.round)
            c.move(to: CGPoint(x: center.x, y: center.y - radius))
            c.addLine(to: CGPoint(x: center.x + 8, y: center.y - radius - 18))
            c.strokePath()

            // Leaf
            c.setFillColor(UIColor.systemGreen.cgColor)
            let leafPath = CGMutablePath()
            let leafBase = CGPoint(x: center.x + 3, y: center.y - radius - 8)
            leafPath.move(to: leafBase)
            leafPath.addQuadCurve(to: CGPoint(x: center.x + 22, y: center.y - radius - 16),
                                  control: CGPoint(x: center.x + 16, y: center.y - radius - 26))
            leafPath.addQuadCurve(to: leafBase,
                                  control: CGPoint(x: center.x + 8, y: center.y - radius - 4))
            c.addPath(leafPath)
            c.fillPath()
        }
    }

    // MARK: - Ball drawing

    private static func drawBall(stripeColor: UIColor, variant: Int) -> UIImage {
        let size = CGSize(width: 200, height: 200)
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { ctx in
            UIColor.white.setFill()
            ctx.fill(CGRect(origin: .zero, size: size))

            let c = ctx.cgContext
            let center = CGPoint(x: 100, y: 100)
            let radius: CGFloat = 68 + CGFloat(variant) * 3
            let rect = CGRect(x: center.x - radius, y: center.y - radius,
                              width: radius * 2, height: radius * 2)

            // Clip to circle
            c.saveGState()
            c.addEllipse(in: rect)
            c.clip()

            // Base fill — light orange (soccer-ball look)
            c.setFillColor(UIColor.systemOrange.withAlphaComponent(0.9).cgColor)
            c.fill(rect)

            // Stripes
            c.setFillColor(stripeColor.withAlphaComponent(0.55).cgColor)
            let stripeW: CGFloat = radius * 0.4
            c.fill(CGRect(x: center.x - stripeW / 2, y: center.y - radius, width: stripeW, height: radius * 2))
            c.fill(CGRect(x: center.x - radius, y: center.y - stripeW / 2, width: radius * 2, height: stripeW))

            c.restoreGState()

            // Outline
            c.setStrokeColor(UIColor.darkGray.withAlphaComponent(0.3).cgColor)
            c.setLineWidth(3)
            c.addEllipse(in: rect)
            c.strokePath()

            // Shine
            c.setFillColor(UIColor.white.withAlphaComponent(0.22).cgColor)
            let shineR: CGFloat = radius * 0.25
            c.addEllipse(in: CGRect(x: center.x - radius * 0.4 - shineR / 2,
                                    y: center.y - radius * 0.45 - shineR / 2,
                                    width: shineR, height: shineR))
            c.fillPath()
        }
    }
}
