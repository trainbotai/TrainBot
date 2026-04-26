import SwiftUI
import PhotosUI

struct TestingView: View {
    @StateObject private var vm = TestingViewModel(context: PersistenceController.shared.container.viewContext)
    @State private var pickerItem: PhotosPickerItem?

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if vm.selectedProject == nil { projectChooser } else { tester }
            }
            .padding(20)
        }
        .background(AppColor.surfaceLight)
        .navigationTitle("Testeaza")
        .onAppear { vm.loadProjects() }
        .onChange(of: pickerItem) { _, item in
            Task {
                guard let item, let data = try? await item.loadTransferable(type: Data.self), let img = UIImage(data: data) else { return }
                await vm.predict(img)
                pickerItem = nil
            }
        }
    }

    private var projectChooser: some View {
        VStack(spacing: 14) {
            if vm.projects.isEmpty {
                AppCard {
                    VStack(spacing: 12) {
                        MascotView(state: .confused, size: 80)
                        Text("Nu ai niciun model antrenat inca.").font(AppFont.body())
                        Text("Mergi la Antreneaza si creeaza primul!").font(AppFont.bodySmall()).foregroundStyle(AppColor.textSecondary)
                    }
                }
            } else {
                Text("Alege ce model vrei sa testezi:").font(AppFont.body()).foregroundStyle(AppColor.textSecondary)
                ForEach(vm.projects, id: \.id) { p in
                    Button { vm.selectProject(p) } label: {
                        AppCard {
                            HStack {
                                Text(p.name ?? "—").font(AppFont.title()).foregroundStyle(AppColor.textPrimary)
                                Spacer()
                                Image(systemName: "chevron.right").foregroundStyle(AppColor.textSecondary)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var tester: some View {
        VStack(spacing: 16) {
            HStack {
                Button { vm.selectedProject = nil } label: {
                    HStack { Image(systemName: "chevron.left"); Text("Inapoi") }.foregroundStyle(AppColor.primaryPurple)
                }
                Spacer()
            }

            if let img = vm.testImage {
                Image(uiImage: img).resizable().scaledToFit().frame(maxHeight: 280).clipShape(RoundedRectangle(cornerRadius: 20))
            }

            if vm.isPredicting {
                MascotView(state: .thinking, size: 100)
                Text("Ma gandesc...").font(AppFont.body())
            } else if let pred = vm.prediction {
                AppCard {
                    VStack(spacing: 8) {
                        MascotView(state: pred.confidence > 0.6 ? .happy : .confused, size: 80)
                        Text("Cred ca e:").font(AppFont.bodySmall()).foregroundStyle(AppColor.textSecondary)
                        Text(pred.label).font(AppFont.headline()).foregroundStyle(AppColor.primaryPurple)
                        Text("\(Int(pred.confidence * 100))% sigur").font(AppFont.body()).foregroundStyle(AppColor.textSecondary)
                    }
                }
            }

            PhotosPicker(selection: $pickerItem, matching: .images) {
                Text(vm.testImage == nil ? "Alege poza" : "Alta poza")
                    .font(AppFont.buttonLarge())
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(AppColor.purpleGradient)
                    .clipShape(RoundedRectangle(cornerRadius: 28))
            }

            if let err = vm.error {
                Text(err).font(AppFont.bodySmall()).foregroundStyle(AppColor.danger)
            }
        }
    }
}
