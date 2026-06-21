import SwiftUI

struct LabelLessonView: View {
    @StateObject private var vm: LabelLessonViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var confettiTrigger = 0

    init() {
        _vm = StateObject(wrappedValue: LabelLessonViewModel(
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
        .navigationTitle("Ce e o etichetă?")
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
        case .intro:       introStep
        case .labeling:    labelingStep
        case .conclusion:  conclusionStep
        }
    }

    // MARK: - Step indicator

    private var stepIndicator: some View {
        HStack(spacing: 8) {
            ForEach(LabelLessonViewModel.Step.allCases, id: \.rawValue) { s in
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
                    Text("AI sortează lucruri în «etichete»")
                        .font(AppFont.headline())
                        .foregroundStyle(AppColor.textPrimary)
                        .multilineTextAlignment(.center)
                    Text("O etichetă e un fel de nume pe care îl pui pe un grup de exemple. De exemplu: «Măr», «Minge», «Câine».")
                        .font(AppFont.body())
                        .foregroundStyle(AppColor.textSecondary)
                        .multilineTextAlignment(.center)
                    Text("Hai să încercăm chiar noi!")
                        .font(AppFont.bodyBold())
                        .foregroundStyle(AppColor.primaryPurple)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
            }
            PrimaryButton("Să sortăm!", icon: "arrow.right") {
                Haptics.tap()
                vm.nextStep()
            }
        }
    }

    // MARK: - Step 2: Labeling

    private var labelingStep: some View {
        VStack(spacing: 20) {
            AppCard {
                VStack(spacing: 10) {
                    MascotView(state: .thinking, size: 80)
                    Text("Atinge fiecare imagine și pune-o în găleata potrivită!")
                        .font(AppFont.title())
                        .foregroundStyle(AppColor.textPrimary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
            }

            // Image grid
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach(vm.cards) { card in
                    ImageCardView(card: card) { label in
                        vm.assign(label: label, to: card.id)
                    }
                }
            }

            // Buckets
            HStack(spacing: 14) {
                BucketView(label: "Măr", emoji: "🍎", count: vm.countAssigned(to: "Măr"))
                BucketView(label: "Minge", emoji: "⚽", count: vm.countAssigned(to: "Minge"))
            }

            if vm.allLabeled {
                PrimaryButton("Gata! Afișează concluzia", icon: "checkmark") {
                    Haptics.tap()
                    vm.nextStep()
                }
            }
        }
    }

    // MARK: - Step 3: Conclusion

    private var conclusionStep: some View {
        VStack(spacing: 20) {
            AppCard {
                VStack(spacing: 14) {
                    MascotView(state: .happy, size: 100)
                    Text("Bravo! Ai creat 2 etichete.")
                        .font(AppFont.headline())
                        .foregroundStyle(AppColor.textPrimary)
                        .multilineTextAlignment(.center)
                    Text("Ai pus 2 mere în «Măr» și 2 mingi în «Minge». Exact așa învață AI-ul: îi arăți exemple și le pui un nume.")
                        .font(AppFont.body())
                        .foregroundStyle(AppColor.textSecondary)
                        .multilineTextAlignment(.center)
                    Text("Cu cât îi dai mai multe exemple per etichetă, cu atât AI-ul recunoaște mai bine!")
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
                            Circle()
                                .fill(AnyShapeStyle(AppColor.purpleGradient))
                                .frame(width: 50, height: 50)
                            Image(systemName: "tag.circle")
                                .font(.system(size: 22))
                                .foregroundStyle(.white)
                        }
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Realizare deblocată!")
                                .font(AppFont.title())
                                .foregroundStyle(AppColor.textPrimary)
                            Text("Etichetator")
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

// MARK: - ImageCardView

private struct ImageCardView: View {
    let card: LabelLessonViewModel.ImageCard
    let onAssign: (String) -> Void

    @State private var showingMenu = false

    var body: some View {
        VStack(spacing: 8) {
            Image(uiImage: card.image)
                .resizable()
                .scaledToFit()
                .frame(width: 90, height: 90)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(
                            card.assignedLabel != nil ? AppColor.primaryPurple : Color.gray.opacity(0.2),
                            lineWidth: 2
                        )
                )

            if let label = card.assignedLabel {
                Text(label)
                    .font(AppFont.caption())
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(AppColor.purpleGradient)
                    .clipShape(Capsule())
            } else {
                Menu {
                    Button("🍎 Măr") { onAssign("Măr") }
                    Button("⚽ Minge") { onAssign("Minge") }
                } label: {
                    Text("Atinge pentru a eticheta")
                        .font(AppFont.caption())
                        .foregroundStyle(AppColor.textSecondary)
                        .multilineTextAlignment(.center)
                }
            }
        }
        .padding(10)
        .background(AppColor.backgroundWhite)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .shadow(color: .black.opacity(0.05), radius: 8, y: 2)
    }
}

// MARK: - BucketView

private struct BucketView: View {
    let label: String
    let emoji: String
    let count: Int

    var body: some View {
        VStack(spacing: 6) {
            Text(emoji).font(.system(size: 30))
            Text(label)
                .font(AppFont.bodyBold())
                .foregroundStyle(AppColor.textPrimary)
            Text("\(count) poze")
                .font(AppFont.bodySmall())
                .foregroundStyle(AppColor.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(AppColor.backgroundWhite)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .shadow(color: .black.opacity(0.05), radius: 8, y: 2)
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(count > 0 ? AppColor.primaryPurple.opacity(0.4) : Color.clear, lineWidth: 2)
        )
    }
}
