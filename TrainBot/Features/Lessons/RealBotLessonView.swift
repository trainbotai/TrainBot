import SwiftUI
import CoreData

// MARK: - ViewModel

@MainActor
final class RealBotLessonViewModel: ObservableObject {
    enum Step: Int, CaseIterable { case intro = 0, steps, launch }

    @Published var step: Step = .intro
    @Published var achievementUnlocked = false

    private let context: NSManagedObjectContext

    init(context: NSManagedObjectContext) {
        self.context = context
    }

    func nextStep() {
        switch step {
        case .intro:  step = .steps
        case .steps:  step = .launch
        case .launch: break
        }
    }

    /// Unlock achievement on first launch of the real bot flow.
    func unlockAchievement() {
        guard !achievementUnlocked else { return }
        let service = AchievementsService(context: context)
        service.recordRealBotLessonStarted()
        achievementUnlocked = true
    }
}

// MARK: - View

struct RealBotLessonView: View {
    @StateObject private var vm: RealBotLessonViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var navigateToBotList = false
    @State private var confettiTrigger = 0

    init() {
        _vm = StateObject(wrappedValue: RealBotLessonViewModel(
            context: PersistenceController.shared.container.viewContext
        ))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                stepIndicator
                stepContent
            }
            .padding(20)
        }
        .background(AppColor.surfaceLight)
        .navigationTitle("Creează un bot AI")
        .navigationBarTitleDisplayMode(.large)
        .confetti(trigger: $confettiTrigger)
        .navigationDestination(isPresented: $navigateToBotList) {
            BotListView()
        }
        .onChange(of: vm.achievementUnlocked) { _, unlocked in
            if unlocked {
                Haptics.success()
                confettiTrigger += 1
            }
        }
    }

    // MARK: - Step indicator

    private var stepIndicator: some View {
        HStack(spacing: 8) {
            ForEach(RealBotLessonViewModel.Step.allCases, id: \.rawValue) { s in
                Circle()
                    .fill(s.rawValue <= vm.step.rawValue
                          ? AnyShapeStyle(AppColor.purpleGradient)
                          : AnyShapeStyle(AppColor.surfaceLight))
                    .frame(width: 10, height: 10)
                    .overlay(Circle().stroke(AppColor.primaryPurple, lineWidth: 1.5))
            }
        }
    }

    // MARK: - Step routing

    @ViewBuilder
    private var stepContent: some View {
        switch vm.step {
        case .intro:  introStep
        case .steps:  stepsStep
        case .launch: launchStep
        }
    }

    // MARK: - Step 1: Intro

    private var introStep: some View {
        VStack(spacing: 20) {
            AppCard {
                VStack(spacing: 14) {
                    MascotView(state: .happy, size: 100)
                    Text("Hai să-ți faci propriul bot AI!")
                        .font(AppFont.headline())
                        .foregroundStyle(AppColor.textPrimary)
                        .multilineTextAlignment(.center)
                    Text("Îi dai câteva exemple de întrebare și răspuns, și botul tău va învăța să răspundă exact în stilul tău.")
                        .font(AppFont.body())
                        .foregroundStyle(AppColor.textSecondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
            }
            PrimaryButton("Spune-mi mai mult!", icon: "arrow.right") {
                Haptics.tap()
                vm.nextStep()
            }
        }
    }

    // MARK: - Step 2: Pașii explicați

    private var stepsStep: some View {
        VStack(spacing: 20) {
            AppCard {
                VStack(alignment: .leading, spacing: 18) {
                    MascotView(state: .learning, size: 80)
                        .frame(maxWidth: .infinity, alignment: .center)
                    Text("Cum îți faci botul?")
                        .font(AppFont.title())
                        .foregroundStyle(AppColor.textPrimary)

                    stepRow(
                        icon: "text.bubble.fill",
                        color: AppColor.primaryPurple,
                        text: "Dă-i botului un nume — de exemplu \"Botul meu de matematică\"."
                    )
                    stepRow(
                        icon: "questionmark.circle.fill",
                        color: AppColor.accentBlue,
                        text: "Adaugă exemple: scrie o întrebare și răspunsul ei. Cu cât mai multe, cu atât mai deștept!"
                    )
                    stepRow(
                        icon: "square.and.arrow.down.fill",
                        color: AppColor.primaryPurple,
                        text: "Salvează botul — e gata în câteva secunde!"
                    )
                    stepRow(
                        icon: "bubble.left.and.bubble.right.fill",
                        color: AppColor.accentBlue,
                        text: "Conversează cu el și vezi cum răspunde cu stilul tău."
                    )
                }
                .frame(maxWidth: .infinity)
            }
            PrimaryButton("Super, hai să-l creez!", icon: "arrow.right") {
                Haptics.tap()
                vm.nextStep()
            }
        }
    }

    // MARK: - Step 3: Launch

    private var launchStep: some View {
        VStack(spacing: 20) {
            AppCard {
                VStack(spacing: 14) {
                    MascotView(state: .idle, size: 100)
                    Text("Ești pregătit!")
                        .font(AppFont.headline())
                        .foregroundStyle(AppColor.textPrimary)
                        .multilineTextAlignment(.center)
                    Text("Vei ajunge la lista de boți. Apasă \"Bot nou\", dă-i un nume, adaugă exemple și salvează-l!")
                        .font(AppFont.body())
                        .foregroundStyle(AppColor.textSecondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
            }

            if vm.achievementUnlocked {
                achievementBanner(
                    icon: "bubble.left.and.bubble.right.fill",
                    title: "Realizare deblocată!",
                    subtitle: "Creator de boți"
                )
            }

            PrimaryButton("Creează botul!", icon: "arrow.right.circle.fill") {
                Haptics.tap()
                vm.unlockAchievement()
                navigateToBotList = true
            }
        }
    }

    // MARK: - Helpers

    private func stepRow(icon: String, color: Color, text: String) -> some View {
        HStack(alignment: .top, spacing: 14) {
            ZStack {
                Circle()
                    .fill(color.opacity(0.15))
                    .frame(width: 38, height: 38)
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(color)
            }
            Text(text)
                .font(AppFont.bodySmall())
                .foregroundStyle(AppColor.textPrimary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func achievementBanner(icon: String, title: String, subtitle: String) -> some View {
        AppCard {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(AnyShapeStyle(AppColor.purpleGradient))
                        .frame(width: 50, height: 50)
                    Image(systemName: icon)
                        .font(.system(size: 22))
                        .foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(AppFont.title())
                        .foregroundStyle(AppColor.textPrimary)
                    Text(subtitle)
                        .font(AppFont.bodySmall())
                        .foregroundStyle(AppColor.textSecondary)
                }
                Spacer()
                Image(systemName: "checkmark.seal.fill")
                    .foregroundStyle(AppColor.success)
            }
        }
    }
}
