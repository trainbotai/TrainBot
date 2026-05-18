import SwiftUI

// MARK: - Typography
//
// PHASE 0 NOTE: TT Norms and TT Forms (commercial license, ~€100-200) and
// Mistrully (free) are not yet bundled. We use SF Pro Rounded for headings
// (Mistrully substitute) and SF Pro for body/UI (TT Norms / TT Forms substitute).
//
// To swap to the licensed fonts:
//   1. Add the .otf files to TrainBot/Resources/Fonts/
//   2. Register them via UIAppFonts in project.yml info.properties
//   3. Update the helpers below to use .custom("PostScriptName", size:) instead
//      of the SF Pro system font helpers below.
//
enum AppFont {
    // Headings (substitute for Mistrully) — using SF Pro Rounded
    static func displayLarge() -> Font { .system(size: 48, weight: .bold, design: .rounded) }
    static func displayMedium() -> Font { .system(size: 36, weight: .bold, design: .rounded) }
    static func headline() -> Font { .system(size: 28, weight: .semibold, design: .rounded) }
    static func title() -> Font { .system(size: 22, weight: .semibold, design: .rounded) }

    // Body (substitute for TT Norms) — using SF Pro
    static func bodyLarge() -> Font { .system(size: 18, weight: .regular, design: .default) }
    static func body() -> Font { .system(size: 16, weight: .regular, design: .default) }
    static func bodySmall() -> Font { .system(size: 14, weight: .regular, design: .default) }
    static func bodyBold() -> Font { .system(size: 16, weight: .bold, design: .default) }

    // UI Elements (substitute for TT Forms) — using SF Pro
    static func buttonLarge() -> Font { .system(size: 18, weight: .bold, design: .default) }
    static func button() -> Font { .system(size: 16, weight: .medium, design: .default) }
    static func label() -> Font { .system(size: 14, weight: .regular, design: .default) }
    static func caption() -> Font { .system(size: 12, weight: .regular, design: .default) }
}
