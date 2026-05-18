import SwiftUI
import CoreData

struct KnowledgeView: View {
    @Environment(\.managedObjectContext) private var ctx
    @State private var projects: [MLProjectEntity] = []
    private var repo: MLProjectRepository { MLProjectRepository(context: ctx) }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if projects.isEmpty {
                    AppCard {
                        VStack { MascotView(state: .idle, size: 80); Text("Nu ai cunostinte inca.").font(AppFont.body()) }
                    }
                }
                ForEach(projects, id: \.id) { project in
                    AppCard {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text(project.name ?? "—").font(AppFont.title())
                                Spacer()
                                Button(role: .destructive) {
                                    try? repo.deleteProject(project)
                                    load()
                                } label: { Image(systemName: "trash").foregroundStyle(AppColor.danger) }
                            }
                            ForEach((project.labels?.allObjects as? [MLLabelEntity] ?? []).sorted { ($0.name ?? "") < ($1.name ?? "") }, id: \.id) { label in
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack {
                                        Text(label.name ?? "—").font(AppFont.bodyBold())
                                        Spacer()
                                        Text("\(label.images?.count ?? 0)").font(AppFont.caption()).foregroundStyle(AppColor.textSecondary)
                                    }
                                    let imgs = repo.loadImages(for: label)
                                    ScrollView(.horizontal) {
                                        HStack(spacing: 8) {
                                            ForEach(imgs, id: \.0.id) { entity, img in
                                                Image(uiImage: img).resizable().scaledToFill()
                                                    .frame(width: 70, height: 70).clipShape(RoundedRectangle(cornerRadius: 10))
                                                    .onLongPressGesture {
                                                        try? repo.deleteImage(entity)
                                                        load()
                                                    }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .padding(20)
        }
        .background(AppColor.surfaceLight)
        .navigationTitle("Cunostinte")
        .onAppear { load() }
    }

    private func load() {
        projects = (try? repo.loadAllProjects()) ?? []
    }
}
