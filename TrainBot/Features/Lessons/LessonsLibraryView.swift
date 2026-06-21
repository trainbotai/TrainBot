import SwiftUI
import CoreData

// MARK: - Lesson descriptor

private struct LessonItem: Identifiable, Hashable {
    let id: String
    let title: String
    let subtitle: String
    let icon: String
    let achievementID: String
}

private let allLessons: [LessonItem] = [
    LessonItem(
        id: "bias",
        title: "Limitele AI",
        subtitle: "De ce greșește uneori botul?",
        icon: "magnifyingglass.circle.fill",
        achievementID: "bias_lesson"
    ),
    LessonItem(
        id: "label",
        title: "Ce e o etichetă?",
        subtitle: "Cum îl înveți pe AI să sorteze lucruri",
        icon: "tag.circle.fill",
        achievementID: "label_lesson"
    ),
    LessonItem(
        id: "more_data",
        title: "Mai multe poze = AI mai deștept",
        subtitle: "De ce contează câte exemple îi dai",
        icon: "tray.full.fill",
        achievementID: "more_data_lesson"
    ),
]

// MARK: - LessonsLibraryView

struct LessonsLibraryView: View {
    @Environment(\.managedObjectContext) private var context

    /// Maps achievementID → isUnlocked
    @State private var unlockedIDs: Set<String> = []

    @State private var selectedLesson: LessonItem?

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                headerCard
                ForEach(allLessons) { lesson in
                    lessonCard(for: lesson)
                }
                Spacer(minLength: 40)
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
        }
        .background(AppColor.surfaceLight)
        .navigationTitle("Lecții AI")
        .navigationBarTitleDisplayMode(.large)
        .onAppear { refreshUnlocked() }
        .navigationDestination(item: $selectedLesson) { lesson in
            destinationView(for: lesson)
        }
    }

    // MARK: - Header

    private var headerCard: some View {
        AppCard {
            HStack(spacing: 14) {
                MascotView(state: .learning, size: 70)
                VStack(alignment: .leading, spacing: 6) {
                    Text("Lecții AI")
                        .font(AppFont.title())
                        .foregroundStyle(AppColor.textPrimary)
                    Text("Alege o lecție și descoperă cum funcționează inteligența artificială!")
                        .font(AppFont.bodySmall())
                        .foregroundStyle(AppColor.textSecondary)
                }
            }
        }
    }

    // MARK: - Lesson card

    private func lessonCard(for lesson: LessonItem) -> some View {
        let isCompleted = unlockedIDs.contains(lesson.achievementID)
        return Button {
            Haptics.tap()
            selectedLesson = lesson
        } label: {
            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(isCompleted ? AnyShapeStyle(AppColor.purpleGradient) : AnyShapeStyle(Color.gray.opacity(0.15)))
                        .frame(width: 56, height: 56)
                    Image(systemName: lesson.icon)
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundStyle(isCompleted ? .white : AppColor.textSecondary)
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text(lesson.title)
                        .font(AppFont.title())
                        .foregroundStyle(AppColor.textPrimary)
                    Text(lesson.subtitle)
                        .font(AppFont.bodySmall())
                        .foregroundStyle(AppColor.textSecondary)
                        .lineLimit(2)
                }
                Spacer()
                if isCompleted {
                    Image(systemName: "checkmark.seal.fill")
                        .foregroundStyle(AppColor.success)
                } else {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(AppColor.textSecondary)
                }
            }
            .padding(20)
            .background(AppColor.backgroundWhite)
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            .shadow(color: .black.opacity(0.06), radius: 12, y: 4)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Destination routing

    @ViewBuilder
    private func destinationView(for lesson: LessonItem) -> some View {
        switch lesson.id {
        case "bias":
            BiasLessonView()
        case "label":
            LabelLessonView()
        case "more_data":
            MoreDataLessonView()
        default:
            EmptyView()
        }
    }

    // MARK: - Helpers

    private func refreshUnlocked() {
        let service = AchievementsService(context: context)
        let all = service.loadAll()
        unlockedIDs = Set(all.compactMap { def, _, isUnlocked in isUnlocked ? def.id : nil })
    }
}
