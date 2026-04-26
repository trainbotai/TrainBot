import SwiftUI

struct MascotView: View {
    let state: MascotState
    var size: CGFloat = 120

    @State private var blink = false
    @State private var pulse = false

    var body: some View {
        ZStack {
            // Head
            RoundedRectangle(cornerRadius: size * 0.28, style: .continuous)
                .fill(AppColor.purpleGradient)
                .frame(width: size, height: size * 0.95)
                .shadow(color: AppColor.primaryPurple.opacity(0.35), radius: pulse ? 18 : 12, y: 6)
                .scaleEffect(pulse ? 1.03 : 1)

            // Eyes
            HStack(spacing: size * 0.16) {
                eyeShape
                eyeShape
            }
            .offset(y: -size * 0.05)
        }
        .onAppear { startAnimations() }
        .onChange(of: state) { _, _ in startAnimations() }
    }

    @ViewBuilder
    private var eyeShape: some View {
        switch state {
        case .idle:
            Capsule().fill(.white).frame(width: size * 0.13, height: blink ? size * 0.02 : size * 0.18)
        case .thinking:
            Circle().fill(.white).frame(width: size * 0.08, height: size * 0.08)
        case .learning:
            Circle().fill(.white).frame(width: size * 0.18, height: size * 0.18)
                .overlay(Circle().stroke(AppColor.primaryPurple, lineWidth: 2).scaleEffect(pulse ? 1.4 : 1).opacity(pulse ? 0 : 1))
        case .happy:
            ArcEye()
                .stroke(.white, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                .frame(width: size * 0.18, height: size * 0.1)
        case .confused:
            Capsule().fill(.white).frame(width: size * 0.13, height: size * 0.18)
                .rotationEffect(.degrees(-15))
        case .error:
            Image(systemName: "xmark").font(.system(size: size * 0.13, weight: .bold)).foregroundStyle(.white)
        }
    }

    private func startAnimations() {
        switch state {
        case .idle:
            withAnimation(.easeInOut(duration: 0.15).repeatForever(autoreverses: true).delay(2)) { blink.toggle() }
        case .learning:
            withAnimation(.easeInOut(duration: 0.9).repeatForever(autoreverses: false)) { pulse.toggle() }
        default:
            blink = false
            pulse = false
        }
    }
}

private struct ArcEye: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: 0, y: rect.midY))
        p.addQuadCurve(to: CGPoint(x: rect.width, y: rect.midY), control: CGPoint(x: rect.midX, y: rect.height))
        return p
    }
}

#Preview {
    HStack(spacing: 20) {
        VStack { MascotView(state: .idle); Text("idle") }
        VStack { MascotView(state: .learning); Text("learning") }
        VStack { MascotView(state: .happy); Text("happy") }
    }
    .padding()
    .background(AppColor.surfaceLight)
}
