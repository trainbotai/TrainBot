import SwiftUI

struct StudentLoginView: View {
    @State private var viewModel: StudentLoginViewModel

    init(authSession: AuthSession) {
        _viewModel = State(initialValue: StudentLoginViewModel(authSession: authSession))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 28) {
                MascotView(state: .idle, size: 120)
                    .padding(.top, 48)

                VStack(spacing: 6) {
                    Text("Bun venit!")
                        .font(AppFont.displayMedium())
                        .foregroundStyle(AppColor.primaryPurple)
                    Text("Intră în clasa ta TrainBot")
                        .font(AppFont.body())
                        .foregroundStyle(AppColor.textSecondary)
                }

                VStack(spacing: 14) {
                    TextField("Codul clasei (ex: AB-12CD)", text: $viewModel.classCode)
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()

                    TextField("Utilizator", text: $viewModel.username)
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()

                    SecureField("Parolă", text: $viewModel.password)
                        .textFieldStyle(.roundedBorder)
                }
                .padding(.horizontal, 4)

                if let error = viewModel.errorMessage {
                    Text(error)
                        .font(AppFont.bodySmall())
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 8)
                }

                PrimaryButton(viewModel.isLoading ? "Se conectează..." : "Intră") {
                    Task { await viewModel.login() }
                }
                .disabled(!viewModel.canSubmit)
                .opacity(viewModel.canSubmit ? 1 : 0.6)

                Spacer(minLength: 40)
            }
            .padding(.horizontal, 30)
        }
        .background(AppColor.surfaceLight)
    }
}
