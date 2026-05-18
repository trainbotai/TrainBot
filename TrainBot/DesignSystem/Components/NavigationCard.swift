import SwiftUI

struct NavigationCard: View {
    let title: String
    let subtitle: String
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(AppColor.purpleGradient)
                        .frame(width: 56, height: 56)
                    Image(systemName: icon)
                        .font(.system(size: 26, weight: .semibold))
                        .foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(AppFont.title()).foregroundStyle(AppColor.textPrimary)
                    Text(subtitle).font(AppFont.bodySmall()).foregroundStyle(AppColor.textSecondary).lineLimit(2)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(AppColor.textSecondary)
            }
            .padding(20)
            .background(AppColor.backgroundWhite)
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            .shadow(color: .black.opacity(0.06), radius: 12, y: 4)
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    VStack(spacing: 16) {
        NavigationCard(title: "Antreneaza", subtitle: "Invata AI-ul tau cu poze", icon: "brain.head.profile") {}
        NavigationCard(title: "Testeaza", subtitle: "Vezi cat de bine recunoaste", icon: "magnifyingglass") {}
    }
    .padding()
    .background(AppColor.surfaceLight)
}
