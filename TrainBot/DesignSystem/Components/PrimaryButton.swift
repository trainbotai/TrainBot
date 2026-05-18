import SwiftUI

struct PrimaryButton: View {
    let title: String
    let icon: String?
    let action: () -> Void
    @State private var isPressed = false

    init(_ title: String, icon: String? = nil, action: @escaping () -> Void) {
        self.title = title
        self.icon = icon
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let icon { Image(systemName: icon) }
                Text(title).font(AppFont.buttonLarge())
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(AppColor.purpleGradient)
            .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
            .shadow(color: AppColor.primaryPurple.opacity(0.35), radius: isPressed ? 4 : 12, y: isPressed ? 2 : 6)
            .scaleEffect(isPressed ? 0.97 : 1)
            .animation(.spring(response: 0.25, dampingFraction: 0.7), value: isPressed)
        }
        .buttonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

#Preview {
    VStack(spacing: 20) {
        PrimaryButton("Antreneaza", icon: "brain") {}
        PrimaryButton("Continua") {}
    }
    .padding()
}
