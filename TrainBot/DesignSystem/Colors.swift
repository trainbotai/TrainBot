import SwiftUI

enum AppColor {
    static let primaryPurple = Color("PrimaryPurple")
    static let secondaryPurple = Color("SecondaryPurple")
    static let accentBlue = Color("AccentBlue")
    static let backgroundWhite = Color("BackgroundWhite")
    static let surfaceLight = Color("SurfaceLight")
    static let textPrimary = Color("TextPrimary")
    static let textSecondary = Color("TextSecondary")
    static let success = Color("Success")
    static let warning = Color("Warning")
    static let danger = Color("Danger")

    static let purpleGradient = LinearGradient(
        colors: [primaryPurple, accentBlue],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}
