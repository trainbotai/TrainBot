import SwiftUI
import CoreData

// MARK: - ViewModel

@MainActor
final class RealTrainingLessonViewModel: ObservableObject {
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

    /// Called when the kid taps "Hai să începem!" and we hand off to TrainingView.
    /// We unlock immediately on first launch of the real flow — simple, no over-engineering.
    func unlockAchievement() {
        guard !achievementUnlocked else { return }
        let service = AchievementsService(context: context)
        service.recordRealTrainingLessonStarted()
        achievementUnlocked = true
    }
}

// MARK: - View

struct RealTrainingLessonView: View {
    @StateObject private var vm: RealTrainingLessonViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var navigateToTraining = false
    @State private var confettiTrigger = 0

    init() {
        _vm = StateObject(wrappedValue: RealTrainingLessonViewModel(
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
        .navigationTitle("Primul tău model")
        .navigationBarTitleDisplayMode(.large)
        .confetti(trigger: $confettiTrigger)
        .navigationDestination(isPresented: $navigateToTraining) {
            TrainingView()
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
            ForEach(RealTrainingLessonViewModel.Step.allCases, id: \.rawValue) { s in
                Circle()
                    .fill(s.rawValue <= vm.step.rawValue
                          ? AnyShapeStyle(AppColor.purpleGradient)
                          : AnyShapeStyle(AppColor.surfaceLight))
                    .frame(width: 10, height: 10)
                    .overlay(Circle().stroke(AppColor.primaryPurple, lineWidth: 1.5))
            }
        }
    }

    // MARK: - Step content routing

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
                    MascotView(state: .learning, size: 100)
                    Text("Hai să antrenăm AI-ul tău!")
                        .font(AppFont.headline())
                        .foregroundStyle(AppColor.textPrimary)
                        .multilineTextAlignment(.center)
                    Text("Vei învăța AI-ul să recunoască 2 lucruri din lumea ta reală — de exemplu creionul și guma ta.")
                        .font(AppFont.body())
                        .foregroundStyle(AppColor.textSecondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
            }
            PrimaryButton("Arată-mi cum!", icon: "arrow.right") {
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
                    MascotView(state: .happy, size: 80)
                        .frame(maxWidth: .infinity, alignment: .center)
                    Text("Cum funcționează?")
                        .font(AppFont.title())
                        .foregroundStyle(AppColor.textPrimary)

                    stepRow(number: "1", icon: "tag.fill", color: AppColor.primaryPurple,
                            text: "Fă 2 categorii — de exemplu \"Creion\" și \"Gumă\".")
                    stepRow(number: "2", icon: "camera.fill", color: AppColor.accentBlue,
                            text: "Fă câte 5+ poze la fiecare obiect din diverse unghiuri.")
                    stepRow(number: "3", icon: "brain.head.profile", color: AppColor.primaryPurple,
                            text: "Apasă \"Antrenează!\" și lasă AI-ul să învețe.")
                    stepRow(number: "4", icon: "viewfinder", color: AppColor.accentBlue,
                            text: "Testează: arată-i o poză și vezi dacă a recunoscut corect!")
                }
                .frame(maxWidth: .infinity)
            }
            PrimaryButton("Înțeles! Mergem!", icon: "arrow.right") {
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
                    Text("Gata să începi?")
                        .font(AppFont.headline())
                        .foregroundStyle(AppColor.textPrimary)
                        .multilineTextAlignment(.center)
                    Text("Vei ajunge în ecranul de antrenament. Creează un proiect nou, adaugă 2 etichete, fă poze și antrenează!")
                        .font(AppFont.body())
                        .foregroundStyle(AppColor.textSecondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
            }

            if vm.achievementUnlocked {
                achievementBanner(
                    icon: "cpu.fill",
                    title: "Realizare deblocată!",
                    subtitle: "Primul model"
                )
            }

            PrimaryButton("Hai să începem!", icon: "arrow.right.circle.fill") {
                Haptics.tap()
                vm.unlockAchievement()
                navigateToTraining = true
            }
        }
    }

    // MARK: - Helpers

    private func stepRow(number: String, icon: String, color: Color, text: String) -> some View {
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
