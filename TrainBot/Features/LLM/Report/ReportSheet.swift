import SwiftUI

struct ReportSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var vm = ReportViewModel()
    @State private var didSubmit = false
    let onSubmit: (String?) async -> Bool

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text("Spune-i profesorului ca ceva nu e in regula cu acest bot.")
                        .font(AppFont.body())
                        .foregroundStyle(AppColor.textSecondary)
                }
                Section("Motivul (optional)") {
                    TextField("Ce s-a intamplat?", text: $vm.reason, axis: .vertical)
                        .lineLimit(3...6)
                }
                Section {
                    PrimaryButton(vm.isSubmitting ? "Se trimite..." : "Trimite raport") {
                        Task {
                            vm.reason = vm.reason
                            let ok = await onSubmit(vm.trimmedReason)
                            if ok { didSubmit = true; dismiss() }
                        }
                    }
                    .disabled(vm.isSubmitting)
                }
            }
            .navigationTitle("Raporteaza")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Anuleaza") { dismiss() }
                }
            }
        }
    }
}
