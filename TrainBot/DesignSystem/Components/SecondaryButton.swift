import SwiftUI

struct SecondaryButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(AppFont.button())
                .foregroundStyle(AppColor.primaryPurple)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(AppColor.surfaceLight)
                .overlay(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .stroke(AppColor.primaryPurple.opacity(0.3), lineWidth: 1.5)
                )
                .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}
