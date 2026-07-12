import SwiftUI

struct HomeView: View {
    enum Destination: Hashable { case training, testing, knowledge, dailyChallenge, achievements, settings, botList, biasLesson, lessonsLibrary, teacherBots }
    @State private var path: [Destination] = []

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(spacing: 20) {
                    header
                    mascotSection
                    cardsGrid
                    Spacer(minLength: 40)
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
            }
            .background(AppColor.surfaceLight)
            .navigationDestination(for: Destination.self) { dest in
                destinationView(for: dest)
            }
        }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Salut!").font(AppFont.body()).foregroundStyle(AppColor.textSecondary)
                Text("TrainBot").font(AppFont.displayMedium()).foregroundStyle(AppColor.primaryPurple)
            }
            Spacer()
            Button { path.append(.settings) } label: {
                Image(systemName: "gearshape.fill")
                    .font(.system(size: 22))
                    .foregroundStyle(AppColor.textSecondary)
                    .padding(12)
                    .background(AppColor.backgroundWhite)
                    .clipShape(Circle())
                    .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
            }
        }
    }

    private var mascotSection: some View {
        AppCard {
            HStack {
                MascotView(state: .idle, size: 80)
                VStack(alignment: .leading, spacing: 6) {
                    Text("Bot-ul tau e gata!").font(AppFont.title()).foregroundStyle(AppColor.textPrimary)
                    Text("Antreneaza-l sa recunoasca lucruri noi.").font(AppFont.bodySmall()).foregroundStyle(AppColor.textSecondary)
                }
                Spacer()
            }
        }
    }

    private var cardsGrid: some View {
        VStack(spacing: 14) {
            NavigationCard(title: "Antrenează", subtitle: "Adaugă poze și învață AI-ul", icon: "brain.head.profile") { path.append(.training) }
            NavigationCard(title: "AI-ul tău", subtitle: "Antrenează-ți boții și conversează cu ei", icon: "bubble.left.and.bubble.right.fill") { path.append(.botList) }
            NavigationCard(title: "Boții profesorului", subtitle: "Vorbește cu boții AI făcuți de profesorul tău", icon: "person.2.wave.2.fill") { path.append(.teacherBots) }
            NavigationCard(title: "Testează", subtitle: "Vezi cât de bine recunoaște", icon: "viewfinder") { path.append(.testing) }
            NavigationCard(title: "Lecții AI", subtitle: "Învață cum funcționează AI-ul, pas cu pas", icon: "books.vertical.fill") { path.append(.lessonsLibrary) }
            NavigationCard(title: "Realizări", subtitle: "Insignele tale și XP-ul câștigat", icon: "trophy.fill") { path.append(.achievements) }
            NavigationCard(title: "Cunoștințe", subtitle: "Toate pozele învățate", icon: "books.vertical") { path.append(.knowledge) }
            NavigationCard(title: "Provocarea zilei", subtitle: "Câștigă XP rezolvând task-ul", icon: "star.circle") { path.append(.dailyChallenge) }
        }
    }

    @ViewBuilder
    private func destinationView(for dest: Destination) -> some View {
        switch dest {
        case .training: TrainingView()
        case .testing: TestingView()
        case .knowledge: KnowledgeView()
        case .dailyChallenge: DailyChallengeView()
        case .achievements: AchievementsView()
        case .settings: SettingsView()
        case .botList: BotListView()
        case .biasLesson: BiasLessonView()
        case .lessonsLibrary: LessonsLibraryView()
        case .teacherBots: TeacherBotsView()
        }
    }
}

#Preview {
    HomeView()
}
