import SwiftUI

struct MoreDataLessonView: View {
    @StateObject private var vm: MoreDataLessonViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var confettiTrigger = 0

    init() {
        _vm = StateObject(wrappedValue: MoreDataLessonViewModel(
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
        .navigationTitle("Mai multe poze = AI mai deștept")
        .navigationBarTitleDisplayMode(.large)
        .confetti(trigger: $confettiTrigger)
        .onChange(of: vm.achievementUnlocked) { _, unlocked in
            if unlocked {
                Haptics.success()
                confettiTrigger += 1
            }
        }
    }

    // MARK: - Step routing

    @ViewBuilder
    private var stepContent: some View {
        stepIndicator
        switch vm.step {
        case .intro:        introStep
        case .fewData:      fewDataStep
        case .moreData:     moreDataStep
        case .conclusion:   conclusionStep
        }
    }

    // MARK: - Step indicator

    private var stepIndicator: some View {
        HStack(spacing: 8) {
            ForEach(MoreDataLessonViewModel.Step.allCases, id: \.rawValue) { s in
                Circle()
                    .fill(s.rawValue <= vm.step.rawValue
                          ? AnyShapeStyle(AppColor.purpleGradient)
                          : AnyShapeStyle(Color(AppColor.surfaceLight)))
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
                    Text("Câte poze îi dai contează!")
                        .font(AppFont.headline())
                        .foregroundStyle(AppColor.textPrimary)
                        .multilineTextAlignment(.center)
                    Text("Dacă îl înveți pe AI cu puține poze, nu recunoaște prea bine. Dar dacă îi dai mai multe exemple variate, devine mult mai priceput!")
                        .font(AppFont.body())
                        .foregroundStyle(AppColor.textSecondary)
                        .multilineTextAlignment(.center)
                    Text("Hai să vedem asta în acțiune!")
                        .font(AppFont.bodyBold())
                        .foregroundStyle(AppColor.primaryPurple)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
            }
            PrimaryButton("Să experimentăm!", icon: "arrow.right") {
                Haptics.tap()
                vm.nextStep()
            }
        }
    }

    // MARK: - Step 2: Few data

    private var fewDataStep: some View {
        VStack(spacing: 20) {
            AppCard {
                VStack(spacing: 14) {
                    MascotView(state: vm.isTraining ? .learning : .thinking, size: 100)
                    Text("Antrenăm cu PUȚINE poze")
                        .font(AppFont.title())
                        .foregroundStyle(AppColor.textPrimary)
                        .multilineTextAlignment(.center)
                    Text("Îi dăm AI-ului doar 2 fotografii de mere. Nu prea multe...")
                        .font(AppFont.bodySmall())
                        .foregroundStyle(AppColor.textSecondary)
                        .multilineTextAlignment(.center)

                    // Mini preview row (2 apples)
                    HStack(spacing: 8) {
                        ForEach(0..<2, id: \.self) { i in
                            Image(uiImage: MoreDataLessonDemoImages.apples(count: 2)[i])
                                .resizable()
                                .scaledToFit()
                                .frame(width: 50, height: 50)
                                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        }
                        Text("+ 3 generate")
                            .font(AppFont.caption())
                            .foregroundStyle(AppColor.textSecondary)
                    }
                }
                .frame(maxWidth: .infinity)
            }

            if vm.isTraining {
                trainingProgressCard
            } else if let err = vm.trainingError {
                Text(err).font(AppFont.bodySmall()).foregroundStyle(AppColor.danger)
            }

            if vm.fewDataClassifier != nil {
                if let pred = vm.fewDataPrediction {
                    predictionCard(pred: pred, labelFor: "Mar", accentLow: true)
                    PrimaryButton("Acum încearcă cu mai multe poze!", icon: "arrow.right") {
                        Haptics.tap()
                        vm.nextStep()
                    }
                } else {
                    PrimaryButton("Testează cu aceeași poză!", icon: "viewfinder") {
                        Haptics.tap()
                        Task { await vm.testFewData() }
                    }
                }
            } else if !vm.isTraining {
                PrimaryButton("Antrenează cu 2 poze", icon: "brain") {
                    Haptics.tap()
                    Task { await vm.trainFewData() }
                }
            }
        }
    }

    // MARK: - Step 3: More data

    private var moreDataStep: some View {
        VStack(spacing: 20) {
            AppCard {
                VStack(spacing: 14) {
                    MascotView(state: vm.isTraining ? .learning : .idle, size: 100)
                    Text("Antrenăm cu MAI MULTE poze")
                        .font(AppFont.title())
                        .foregroundStyle(AppColor.textPrimary)
                        .multilineTextAlignment(.center)
                    Text("Acum îi dăm 6 fotografii de mere, fiecare puțin diferită. Să vedem ce se întâmplă!")
                        .font(AppFont.bodySmall())
                        .foregroundStyle(AppColor.textSecondary)
                        .multilineTextAlignment(.center)

                    // Mini preview row (6 apples)
                    HStack(spacing: 6) {
                        ForEach(0..<6, id: \.self) { i in
                            Image(uiImage: MoreDataLessonDemoImages.apples(count: 6)[i])
                                .resizable()
                                .scaledToFit()
                                .frame(width: 36, height: 36)
                                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                        }
                    }
                }
                .frame(maxWidth: .infinity)
            }

            if vm.isTraining {
                trainingProgressCard
            } else if let err = vm.trainingError {
                Text(err).font(AppFont.bodySmall()).foregroundStyle(AppColor.danger)
            }

            if vm.moreDataClassifier != nil {
                if let pred = vm.moreDataPrediction {
                    predictionCard(pred: pred, labelFor: "Mar", accentLow: false)
                    PrimaryButton("Super! Ce am învățat?", icon: "arrow.right") {
                        Haptics.tap()
                        vm.nextStep()
                    }
                } else {
                    PrimaryButton("Testează aceeași poză!", icon: "viewfinder") {
                        Haptics.tap()
                        Task { await vm.testMoreData() }
                    }
                }
            } else if !vm.isTraining {
                PrimaryButton("Antrenează cu 6 poze", icon: "brain") {
                    Haptics.tap()
                    Task { await vm.trainMoreData() }
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
                    Text("Ai văzut diferența!")
                        .font(AppFont.headline())
                        .foregroundStyle(AppColor.textPrimary)
                        .multilineTextAlignment(.center)
                    Text("Cu 2 poze, AI-ul era nesigur. Cu 6 poze variate, recunoaște mult mai bine!")
                        .font(AppFont.body())
                        .foregroundStyle(AppColor.textSecondary)
                        .multilineTextAlignment(.center)
                    Text("Vezi? Cu mai multe exemple variate, AI-ul recunoaște mult mai bine!")
                        .font(AppFont.bodyBold())
                        .foregroundStyle(AppColor.primaryPurple)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
            }

            // Side-by-side comparison
            if let few = vm.fewDataPrediction, let more = vm.moreDataPrediction {
                comparisonCard(few: few, more: more)
            }

            if vm.achievementUnlocked {
                AppCard {
                    HStack(spacing: 14) {
                        ZStack {
                            Circle()
                                .fill(AnyShapeStyle(AppColor.purpleGradient))
                                .frame(width: 50, height: 50)
                            Image(systemName: "tray.full")
                                .font(.system(size: 22))
                                .foregroundStyle(.white)
                        }
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Realizare deblocată!")
                                .font(AppFont.title())
                                .foregroundStyle(AppColor.textPrimary)
                            Text("Colecționar de exemple")
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

    // MARK: - Shared sub-views

    private var trainingProgressCard: some View {
        AppCard {
            VStack(spacing: 8) {
                Text("Antrenez...").font(AppFont.bodySmall()).foregroundStyle(AppColor.textSecondary)
                ProgressView(value: vm.trainingProgress).tint(AppColor.primaryPurple)
            }
        }
    }

    /// Shows a prediction result card. `accentLow` colors confidence red when low.
    private func predictionCard(pred: TrainedClassifier.Prediction, labelFor winnerLabel: String, accentLow: Bool) -> some View {
        AppCard {
            VStack(spacing: 10) {
                Text("Răspunsul AI-ului:")
                    .font(AppFont.bodySmall())
                    .foregroundStyle(AppColor.textSecondary)
                Text(pred.label)
                    .font(AppFont.headline())
                    .foregroundStyle(AppColor.primaryPurple)
                let confColor: Color = pred.confidence > 0.6
                    ? AppColor.success
                    : (accentLow ? AppColor.danger : AppColor.warning)
                Text("\(Int(pred.confidence * 100))% sigur")
                    .font(AppFont.body())
                    .foregroundStyle(confColor)

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
    }

    private func comparisonCard(few: TrainedClassifier.Prediction, more: TrainedClassifier.Prediction) -> some View {
        AppCard {
            VStack(spacing: 10) {
                Text("Comparație")
                    .font(AppFont.title())
                    .foregroundStyle(AppColor.textPrimary)
                HStack {
                    VStack(spacing: 4) {
                        Text("2 poze").font(AppFont.bodySmall()).foregroundStyle(AppColor.textSecondary)
                        Text("\(Int(few.confidence * 100))%")
                            .font(AppFont.headline())
                            .foregroundStyle(few.confidence > 0.6 ? AppColor.success : AppColor.danger)
                    }
                    .frame(maxWidth: .infinity)
                    Divider().frame(height: 40)
                    VStack(spacing: 4) {
                        Text("6 poze").font(AppFont.bodySmall()).foregroundStyle(AppColor.textSecondary)
                        Text("\(Int(more.confidence * 100))%")
                            .font(AppFont.headline())
                            .foregroundStyle(more.confidence > 0.6 ? AppColor.success : AppColor.warning)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
    }
}
