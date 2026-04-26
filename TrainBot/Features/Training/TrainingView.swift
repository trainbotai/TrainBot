import SwiftUI
import PhotosUI
import CoreData

struct TrainingView: View {
    @StateObject private var vm = TrainingViewModel(context: PersistenceController.shared.container.viewContext)

    @State private var showNewProjectSheet = false
    @State private var newProjectName = ""
    @State private var showNewLabelSheet = false
    @State private var newLabelName = ""
    @State private var photoPickerSelection: [PhotosPickerItem] = []
    @State private var pickerTargetLabel: MLLabelEntity?

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if vm.selectedProject == nil {
                    projectsList
                } else {
                    projectEditor
                }
            }
            .padding(20)
        }
        .background(AppColor.surfaceLight)
        .navigationTitle("Antreneaza")
        .navigationBarTitleDisplayMode(.large)
        .sheet(isPresented: $showNewProjectSheet) {
            promptSheet(title: "Proiect nou", placeholder: "ex. Pisici si caini", text: $newProjectName) {
                vm.createProject(name: newProjectName)
                newProjectName = ""
                showNewProjectSheet = false
            }
        }
        .sheet(isPresented: $showNewLabelSheet) {
            promptSheet(title: "Eticheta noua", placeholder: "ex. Pisica", text: $newLabelName) {
                vm.addLabel(name: newLabelName)
                newLabelName = ""
                showNewLabelSheet = false
            }
        }
        .photosPicker(isPresented: Binding(get: { pickerTargetLabel != nil }, set: { if !$0 { pickerTargetLabel = nil } }),
                      selection: $photoPickerSelection, maxSelectionCount: 10, matching: .images)
        .onChange(of: photoPickerSelection) { _, items in
            Task {
                guard let label = pickerTargetLabel else { return }
                for item in items {
                    if let data = try? await item.loadTransferable(type: Data.self), let img = UIImage(data: data) {
                        vm.addImage(img, to: label)
                    }
                }
                photoPickerSelection = []
                pickerTargetLabel = nil
            }
        }
        .onAppear { vm.loadProjects() }
    }

    private var projectsList: some View {
        VStack(spacing: 14) {
            PrimaryButton("Proiect nou", icon: "plus") { showNewProjectSheet = true }
            ForEach(vm.projects, id: \.id) { p in
                Button { vm.selectProject(p) } label: {
                    AppCard {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(p.name ?? "—").font(AppFont.title()).foregroundStyle(AppColor.textPrimary)
                                Text("\((p.labels?.count ?? 0)) etichete").font(AppFont.caption()).foregroundStyle(AppColor.textSecondary)
                            }
                            Spacer()
                            Image(systemName: "chevron.right").foregroundStyle(AppColor.textSecondary)
                        }
                    }
                }
                .buttonStyle(.plain)
            }
            if vm.projects.isEmpty {
                Text("Niciun proiect. Creeaza primul!").font(AppFont.body()).foregroundStyle(AppColor.textSecondary).padding(.top, 20)
            }
        }
    }

    private var projectEditor: some View {
        VStack(spacing: 16) {
            HStack {
                Button { vm.selectedProject = nil } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left")
                        Text("Inapoi").font(AppFont.button())
                    }
                    .foregroundStyle(AppColor.primaryPurple)
                }
                Spacer()
                Text(vm.selectedProject?.name ?? "").font(AppFont.title()).foregroundStyle(AppColor.textPrimary)
                Spacer()
                Color.clear.frame(width: 60)
            }

            ForEach(vm.labels, id: \.id) { label in
                AppCard {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text(label.name ?? "—").font(AppFont.title()).foregroundStyle(AppColor.textPrimary)
                            Spacer()
                            Text("\((label.images?.count ?? 0)) poze").font(AppFont.caption()).foregroundStyle(AppColor.textSecondary)
                        }
                        if let id = label.id {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(vm.imagesByLabel[id] ?? [], id: \.0.id) { _, img in
                                        Image(uiImage: img).resizable().scaledToFill()
                                            .frame(width: 80, height: 80).clipShape(RoundedRectangle(cornerRadius: 12))
                                    }
                                }
                            }
                        }
                        SecondaryButton(title: "Adauga poze") {
                            pickerTargetLabel = label
                        }
                    }
                }
            }

            SecondaryButton(title: "+ Eticheta noua") { showNewLabelSheet = true }

            if vm.isTraining {
                AppCard {
                    VStack(spacing: 12) {
                        MascotView(state: .learning, size: 80)
                        Text("Antrenez...").font(AppFont.title()).foregroundStyle(AppColor.textPrimary)
                        if case .training(let percent) = vm.trainingProgress?.phase {
                            ProgressView(value: percent).tint(AppColor.primaryPurple)
                        }
                    }
                }
            } else if let acc = vm.lastAccuracy {
                AppCard {
                    VStack(spacing: 8) {
                        MascotView(state: .happy, size: 80)
                        Text("Bot-ul tau e \(Int(acc * 100))% inteligent!").font(AppFont.title()).foregroundStyle(AppColor.success)
                    }
                }
            }

            if let err = vm.trainingError {
                Text(err).font(AppFont.bodySmall()).foregroundStyle(AppColor.danger).multilineTextAlignment(.center)
            }

            PrimaryButton("Antreneaza!", icon: "brain") {
                Task { await vm.train() }
            }
            .disabled(vm.isTraining || vm.labels.count < 2)
            .opacity(vm.labels.count < 2 ? 0.5 : 1)
        }
    }

    private func promptSheet(title: String, placeholder: String, text: Binding<String>, onSubmit: @escaping () -> Void) -> some View {
        VStack(spacing: 20) {
            Text(title).font(AppFont.headline())
            TextField(placeholder, text: text)
                .textFieldStyle(.roundedBorder)
                .font(AppFont.body())
            PrimaryButton("OK") {
                onSubmit()
            }
        }
        .padding(20)
        .presentationDetents([.height(220)])
    }
}
