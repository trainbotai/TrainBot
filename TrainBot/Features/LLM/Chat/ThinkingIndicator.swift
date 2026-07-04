import SwiftUI

struct ThinkingIndicator: View {
    @State private var dotCount = 0
    let timer = Timer.publish(every: 0.4, on: .main, in: .common).autoconnect()

    var body: some View {
        HStack(spacing: 10) {
            MascotView(state: .thinking, size: 36)
            Text("Robotul gandeste" + String(repeating: ".", count: dotCount))
                .font(AppFont.body())
                .foregroundStyle(AppColor.textSecondary)
        }
        .onReceive(timer) { _ in
            dotCount = (dotCount + 1) % 4
        }
    }
}
