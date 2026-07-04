import SwiftUI

struct BiasLessonView: View {
    @StateObject private var vm: BiasLessonViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var confettiTrigger = 0

    init() {
        _vm = StateObject(wrappedValue: BiasLessonViewModel(
            context: PersistenceController.shared.container.viewContext
        ))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                stepContent
            }
            .padding(20)
        }
        .background(AppColor.surfaceLight)
        .navigationTitle("Lectia AI")
        .navigationBarTitleDisplayMode(.large)
        .confetti(trigger: $confettiTrigger)
        .onChange(of: vm.achievementUnlocked) { _, unlocked in
            if unlocked {
                Haptics.success()
                confettiTrigger += 1
            }
        }
    }

    // MARK: - Step Routing

    @ViewBuilder
    private var stepContent: some View {
        stepIndicator
        switch vm.step {
        case .intro:      introStep
        case .training:   trainingStep
        case .testing:    testingStep
        case .conclusion: conclusionStep
        }
    }

    // MARK: - Step Indicator

    private var stepIndicator: some View {
        HStack(spacing: 8) {
            ForEach(BiasLessonViewModel.Step.allCases, id: \.rawValue) { s in
                Circle()
                    .fill(s.rawValue <= vm.step.rawValue ? AnyShapeStyle(AppColor.purpleGradient) : AnyShapeStyle(Color(AppColor.surfaceLight)))
                    .frame(width: 10, height: 10)
                    .overlay(Circle().stroke(AppColor.primaryPurple, lineWidth: 1.5))
            }
        }
    }

    // MARK: - Step 1: Intro

    private var introStep: some View {
        VStack(spacing: 20) {
            AppCard {
                VStack(spacing: 14) {
                    MascotView(state: .learning, size: 100)
                    Text("AI învață DOAR din ce-i arăți.")
                        .font(AppFont.headline())
                        .foregroundStyle(AppColor.textPrimary)
                        .multilineTextAlignment(.center)
                    Text("Hai să vedem ce se întâmplă dacă îl înveți greșit.")
                        .font(AppFont.body())
                        .foregroundStyle(AppColor.textSecondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
            }
            PrimaryButton("Hai să începem!", icon: "arrow.right") {
                Haptics.tap()
                vm.nextStep()
            }
        }
    }

    // MARK: - Step 2: Training

    private var trainingStep: some View {
        VStack(spacing: 20) {
            AppCard {
                VStack(spacing: 14) {
                    MascotView(state: vm.isTraining ? .learning : .idle, size: 100)
                    Text("Antrenăm botul cu mere ROȘII")
                        .font(AppFont.title())
                        .foregroundStyle(AppColor.textPrimary)
                        .multilineTextAlignment(.center)
                    Text("Îi dăm doar mere roșii ca să vadă cum funcționează AI-ul când are exemple limitate.")
                        .font(AppFont.bodySmall())
                        .foregroundStyle(AppColor.textSecondary)
                        .multilineTextAlignment(.center)

                    // Demo apple preview row
                    HStack(spacing: 8) {
                        ForEach(0..<5) { _ in
                            ApplePreviewCircle(color: .red)
                        }
                    }
                    .padding(.top, 4)
                }
                .frame(maxWidth: .infinity)
            }

            if vm.isTraining {
                AppCard {
                    VStack(spacing: 8) {
                        Text("Antrenez...").font(AppFont.bodySmall()).foregroundStyle(AppColor.textSecondary)
                        ProgressView(value: vm.trainingProgress)
                            .tint(AppColor.primaryPurple)
                    }
                }
            } else if let err = vm.trainingError {
                Text(err).font(AppFont.bodySmall()).foregroundStyle(AppColor.danger)
            }

            if vm.trainedClassifier != nil {
                PrimaryButton("Acum testează cu un măr verde!", icon: "arrow.right") {
                    Haptics.tap()
                    vm.nextStep()
                }
            } else if !vm.isTraining {
                PrimaryButton("Antrenează botul!", icon: "brain") {
                    Haptics.tap()
                    Task { await vm.trainRedAppleModel() }
                }
                .disabled(vm.isTraining)
            }
        }
    }

    // MARK: - Step 3: Testing

    private var testingStep: some View {
        VStack(spacing: 20) {
            AppCard {
                VStack(spacing: 14) {
                    MascotView(state: vm.testPrediction == nil ? .thinking : .confused, size: 100)
                    Text("Acum îi arătăm un măr VERDE 🍏")
                        .font(AppFont.title())
                        .foregroundStyle(AppColor.textPrimary)
                        .multilineTextAlignment(.center)
                    Text("Ce crezi că va zice botul?")
                        .font(AppFont.bodySmall())
                        .foregroundStyle(AppColor.textSecondary)

                    ApplePreviewCircle(color: .green)
                        .scaleEffect(1.6)
                        .padding(.vertical, 8)
                }
                .frame(maxWidth: .infinity)
            }

            if let pred = vm.testPrediction {
                AppCard {
                    VStack(spacing: 10) {
                        Text("Răspunsul botului:")
                            .font(AppFont.bodySmall())
                            .foregroundStyle(AppColor.textSecondary)
                        Text(pred.label)
                            .font(AppFont.headline())
                            .foregroundStyle(AppColor.primaryPurple)
                        Text("\(Int(pred.confidence * 100))% sigur")
                            .font(AppFont.body())
                            .foregroundStyle(pred.confidence > 0.7 ? AppColor.success : AppColor.warning)

                        if pred.allConfidences.count > 1 {
                            Divider()
                            VStack(spacing: 6) {
                                ForEach(pred.allConfidences.sorted { $0.value > $1.value }, id: \.key) { label, conf in
                                    HStack(spacing: 6) {
                                        Text(label)
                                            .font(AppFont.bodySmall())
                                            .foregroundStyle(AppColor.textPrimary)
                                            .frame(width: 80, alignment: .leading)
                                            .lineLimit(1)
                                        ProgressView(value: conf).tint(AppColor.primaryPurple)
                                        Text("\(Int(conf * 100))%")
                                            .font(AppFont.caption())
                                            .foregroundStyle(AppColor.textSecondary)
                                            .frame(width: 30, alignment: .trailing)
                                    }
                                }
                            }
                        }
                    }
                }

                PrimaryButton("Înțeleg! Ce urmează?", icon: "arrow.right") {
                    Haptics.tap()
                    vm.nextStep()
                }
            } else {
                PrimaryButton("Testează acum!", icon: "viewfinder") {
                    Haptics.tap()
                    Task { await vm.testGreenApple() }
                }
            }
        }
    }

    // MARK: - Step 4: Conclusion

    private var conclusionStep: some View {
        VStack(spacing: 20) {
            AppCard {
                VStack(spacing: 14) {
                    MascotView(state: .happy, size: 100)
                    Text("Ai descoperit o limită a AI-ului!")
                        .font(AppFont.headline())
                        .foregroundStyle(AppColor.textPrimary)
                        .multilineTextAlignment(.center)
                    Text("Botul n-a văzut niciodată un măr verde, așa că nu l-a recunoscut corect.")
                        .font(AppFont.body())
                        .foregroundStyle(AppColor.textSecondary)
                        .multilineTextAlignment(.center)
                    Text("De aceea trebuie să-i arăți exemple VARIATE — roșii, verzi, galbene, mari, mici!")
                        .font(AppFont.bodyBold())
                        .foregroundStyle(AppColor.primaryPurple)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
            }

            if vm.achievementUnlocked {
                AppCard {
                    HStack(spacing: 14) {
                        ZStack {
                            Circle().fill(AnyShapeStyle(AppColor.purpleGradient)).frame(width: 50, height: 50)
                            Image(systemName: "magnifyingglass.circle")
                                .font(.system(size: 22))
                                .foregroundStyle(.white)
                        }
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Realizare deblocata!")
                                .font(AppFont.title())
                                .foregroundStyle(AppColor.textPrimary)
                            Text("Detectiv AI")
                                .font(AppFont.bodySmall())
                                .foregroundStyle(AppColor.textSecondary)
                        }
                        Spacer()
                        Image(systemName: "checkmark.seal.fill").foregroundStyle(AppColor.success)
                    }
                }
            }

            PrimaryButton("Super! Gata.", icon: "checkmark") {
                Haptics.success()
                dismiss()
            }
        }
    }
}

// MARK: - ApplePreviewCircle

private struct ApplePreviewCircle: View {
    let color: Color

    var body: some View {
        ZStack {
            Circle().fill(color).frame(width: 36, height: 36)
                .shadow(color: color.opacity(0.4), radius: 4, y: 2)
            Text(color == .red ? "🍎" : "🍏").font(.system(size: 20))
        }
    }
}
