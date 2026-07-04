import SwiftUI
import PhotosUI

struct TestingView: View {
    @StateObject private var vm = TestingViewModel(context: PersistenceController.shared.container.viewContext)
    @State private var pickerItem: PhotosPickerItem?
    @State private var confettiTrigger = 0

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if vm.selectedProject == nil { projectChooser } else { tester }
            }
            .padding(20)
        }
        .background(AppColor.surfaceLight)
        .navigationTitle("Testeaza")
        .confetti(trigger: $confettiTrigger)
        .onAppear { vm.loadProjects() }
        .onChange(of: pickerItem) { _, item in
            Task {
                guard let item, let data = try? await item.loadTransferable(type: Data.self), let img = UIImage(data: data) else { return }
                Haptics.tap()
                await vm.predict(img)
                if let pred = vm.prediction {
                    if pred.confidence > 0.6 {
                        Haptics.success()
                        confettiTrigger += 1
                    } else {
                        Haptics.warning()
                    }
                }
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

    @MainActor
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
                    VStack(spacing: 12) {
                        MascotView(state: pred.confidence > 0.6 ? .happy : .confused, size: 80)
                        Text("Cred ca e:").font(AppFont.bodySmall()).foregroundStyle(AppColor.textSecondary)
                        Text(pred.label).font(AppFont.headline()).foregroundStyle(AppColor.primaryPurple)
                        Text("\(Int(pred.confidence * 100))% sigur").font(AppFont.body()).foregroundStyle(AppColor.textSecondary)

                        if pred.allConfidences.count > 1 {
                            Divider()
                            Text("Cat de sigur e botul:").font(AppFont.caption()).foregroundStyle(AppColor.textSecondary)
                            VStack(spacing: 8) {
                                ForEach(pred.allConfidences.sorted { $0.value > $1.value }, id: \.key) { label, conf in
                                    HStack(spacing: 8) {
                                        Text(label)
                                            .font(AppFont.bodySmall())
                                            .foregroundStyle(AppColor.textPrimary)
                                            .frame(width: 90, alignment: .leading)
                                            .lineLimit(1)
                                        ProgressView(value: conf)
                                            .tint(label == pred.label ? AppColor.primaryPurple : AppColor.textSecondary)
                                        Text("\(Int(conf * 100))%")
                                            .font(AppFont.caption())
                                            .foregroundStyle(AppColor.textSecondary)
                                            .frame(width: 34, alignment: .trailing)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            let pickerLabelText = vm.testImage == nil ? "Alege poza" : "Alta poza"
            PhotosPicker(selection: $pickerItem, matching: .images) {
                Text(pickerLabelText)
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
