import SwiftUI

struct AchievementsView: View {
    @Environment(\.managedObjectContext) private var ctx
    @State private var items: [(AchievementDefinition, Int, Bool)] = []
    @State private var confettiTrigger = 0
    @State private var previousUnlockedCount = 0

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                ForEach(items, id: \.0.id) { def, progress, unlocked in
                    AppCard {
                        HStack(spacing: 16) {
                            ZStack {
                                Circle().fill(unlocked ? AnyShapeStyle(AppColor.purpleGradient) : AnyShapeStyle(AppColor.surfaceLight))
                                    .frame(width: 56, height: 56)
                                Image(systemName: def.icon).font(.system(size: 22)).foregroundStyle(unlocked ? .white : AppColor.textSecondary)
                            }
                            VStack(alignment: .leading, spacing: 4) {
                                Text(def.title).font(AppFont.title()).foregroundStyle(unlocked ? AppColor.textPrimary : AppColor.textSecondary)
                                Text(def.description).font(AppFont.caption()).foregroundStyle(AppColor.textSecondary)
                                ProgressView(value: Double(progress), total: Double(def.target)).tint(AppColor.primaryPurple)
                            }
                            if unlocked { Image(systemName: "checkmark.seal.fill").foregroundStyle(AppColor.success) }
                        }
                    }
                }
            }
            .padding(20)
        }
        .background(AppColor.surfaceLight)
        .navigationTitle("Realizari")
        .confetti(trigger: $confettiTrigger)
        .onAppear {
            items = AchievementsService(context: ctx).loadAll()
            previousUnlockedCount = items.filter { $0.2 }.count
        }
        .onChange(of: items.filter { $0.2 }.count) { _, newCount in
            if newCount > previousUnlockedCount {
                Haptics.success()
                confettiTrigger += 1
                previousUnlockedCount = newCount
            }
        }
    }
}
