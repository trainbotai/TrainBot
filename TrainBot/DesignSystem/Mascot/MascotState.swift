import Foundation

enum MascotState: String, CaseIterable {
    case idle           // ochi normali, blink ocazional
    case thinking       // ochi mici, animatie "..."
    case learning       // ochi pulse, gradient anim
    case happy          // ochi zambet
    case confused       // ochi asimetrici
    case error          // ochi X
}
