import SwiftUI

struct BotEditorView: View {
    @Environment(AuthSession.self) private var authSession
    @Environment(\.dismiss) private var dismiss
    @State private var vm: BotEditorViewModel?
    let editing: SessionSummary?
    let assignmentId: String?
    let onSaved: (SessionDetail) -> Void

    init(editing: SessionSummary? = nil, assignmentId: String? = nil, onSaved: @escaping (SessionDetail) -> Void) {
        self.editing = editing
        self.assignmentId = assignmentId
        self.onSaved = onSaved
    }

    var body: some View {
        NavigationStack {
            Group {
                if let vm {
                    BotEditorFormView(
                        vm: vm,
                        editing: editing,
                        onSaved: onSaved,
                        dismiss: dismiss
                    )
                } else {
                    Color.clear.task {
                        let service = LLMService(authSession: authSession)
                        vm = BotEditorViewModel(service: service, editing: editing, assignmentId: assignmentId)
                    }
                }
            }
            .navigationTitle(editing == nil ? "Bot nou" : "Editeaza \(editing?.name ?? "")")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Anuleaza") { dismiss() }
                }
            }
        }
    }
}

/// Inner form view that holds @Bindable at the top level.
private struct BotEditorFormView: View {
    @Bindable var vm: BotEditorViewModel
    let editing: SessionSummary?
    let onSaved: (SessionDetail) -> Void
    let dismiss: DismissAction

    var body: some View {
        Form {
            Section("Nume") {
                TextField("Numele botului tau", text: $vm.name)
            }
            examplesSection
            if let error = vm.errorMessage {
                Section { Text(error).foregroundStyle(AppColor.danger) }
            }
            Section {
                PrimaryButton(
                    vm.isSaving ? "Se salveaza..." : (editing == nil ? "Creeaza bot" : "Salveaza versiune noua")
                ) {
                    Task {
                        await vm.save { saved in
                            onSaved(saved)
                            dismiss()
                        }
                    }
                }
                .disabled(!vm.isValid || vm.isSaving)
            }
        }
    }

    private var examplesSection: some View {
        Section("Exemple (\(vm.examples.count)/\(BotEditorViewModel.maxExamples))") {
            ExamplesListView(vm: vm)
            if vm.canAddExample {
                Button {
                    vm.addExample()
                } label: {
                    Label("Adauga exemplu", systemImage: "plus.circle.fill")
                }
            }
        }
    }
}

/// Separate view for the examples list to isolate @Bindable subscript binding.
private struct ExamplesListView: View {
    @Bindable var vm: BotEditorViewModel

    var body: some View {
        ForEach(vm.examples.indices, id: \.self) { index in
            ExamplePairRow(
                example: $vm.examples[index],
                index: index,
                onDelete: { vm.removeExample(vm.examples[index].id) }
            )
            .listRowInsets(EdgeInsets(top: 8, leading: 0, bottom: 8, trailing: 0))
            .listRowBackground(Color.clear)
        }
    }
}
