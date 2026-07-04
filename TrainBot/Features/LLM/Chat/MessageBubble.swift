import SwiftUI

struct MessageBubble: View {
    let text: String
    let isUser: Bool
    let flagged: Bool

    var body: some View {
        HStack {
            if isUser { Spacer(minLength: 40) }
            VStack(alignment: .leading, spacing: 4) {
                Text(text)
                    .font(AppFont.body())
                    .foregroundStyle(isUser ? .white : AppColor.textPrimary)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(isUser ? AppColor.primaryPurple : AppColor.backgroundWhite)
                    .cornerRadius(16)
                if flagged {
                    Text("Mesaj raportat")
                        .font(AppFont.bodySmall())
                        .foregroundStyle(AppColor.warning)
                }
            }
            if !isUser { Spacer(minLength: 40) }
        }
    }
}
