import SwiftUI

struct ExamplePairRow: View {
    @Binding var example: Example
    let index: Int
    let onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Exemplul \(index + 1)").font(AppFont.bodySmall()).foregroundStyle(AppColor.textSecondary)
                Spacer()
                Button(role: .destructive) { onDelete() } label: {
                    Image(systemName: "trash")
                }
            }
            VStack(alignment: .leading, spacing: 4) {
                Text("Intrebare").font(AppFont.bodySmall()).foregroundStyle(AppColor.textSecondary)
                TextField("Ex: Ce mai faci?", text: $example.user, axis: .vertical)
                    .lineLimit(2...4)
                    .textFieldStyle(.roundedBorder)
            }
            VStack(alignment: .leading, spacing: 4) {
                Text("Raspuns").font(AppFont.bodySmall()).foregroundStyle(AppColor.textSecondary)
                TextField("Ex: Sunt foarte bine, multumesc!", text: $example.ai, axis: .vertical)
                    .lineLimit(2...4)
                    .textFieldStyle(.roundedBorder)
            }
        }
        .padding()
        .background(AppColor.backgroundWhite)
        .cornerRadius(12)
    }
}
