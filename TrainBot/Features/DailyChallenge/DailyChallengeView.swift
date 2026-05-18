import SwiftUI

struct DailyChallengeView: View {
    @Environment(\.managedObjectContext) private var ctx
    @State private var challenge: DailyChallenge?

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                MascotView(state: challenge?.completed == true ? .happy : .idle, size: 120).padding(.top, 20)

                if let c = challenge {
                    AppCard {
                        VStack(spacing: 12) {
                            Text("Provocarea de azi").font(AppFont.bodySmall()).foregroundStyle(AppColor.textSecondary)
                            Text(c.description).font(AppFont.headline()).multilineTextAlignment(.center)
                            ProgressView(value: Double(c.progress), total: Double(c.goal)).tint(AppColor.primaryPurple)
                            Text("\(c.progress) / \(c.goal)").font(AppFont.body())
                            if c.completed {
                                Text("✓ Felicitari! Ai castigat XP.").font(AppFont.bodyBold()).foregroundStyle(AppColor.success)
                            }
                        }
                    }
                }
            }
            .padding(20)
        }
        .background(AppColor.surfaceLight)
        .navigationTitle("Provocarea zilei")
        .onAppear {
            challenge = DailyChallengeService(context: ctx).todayChallenge()
        }
    }
}
