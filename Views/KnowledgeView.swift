import SwiftUI

// Displays the knowledge base, allowing users to view and manage labeled images
struct KnowledgeView: View {
    @Binding var knowledgeData: [String: [UIImage]] // Dictionary of labels and their associated images
    @EnvironmentObject var settings: AppSettings // Access shared app settings
    @State private var showingDeleteAlert = false // Tracks whether the delete confirmation alert is shown
    @State private var labelToDelete: String? = nil // Stores the label to be deleted
    private let lessons = KnowledgeItem.kidFriendlyAILessons

    var body: some View {
        NavigationStack {
            ZStack {
                Color.backgroundLight
                    .ignoresSafeArea() // Set the background color

                VStack(spacing: 20) {
                    // Header for the knowledge base
                    Text("Knowledge Base")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .shadow(color: .gray, radius: 2, x: 0, y: 2)
                        .padding(.top, 30)

                    // Description of the knowledge base
                    Text("Discover and organize your collected images to train your bot.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)

                    // Display the lessons and knowledge data
                    ScrollView {
                        VStack(spacing: 16) {
                            KidFriendlyLessonsView(lessons: lessons)

                            // Display an empty state if no knowledge data exists
                            if knowledgeData.isEmpty {
                                EmptyStateView()
                            } else {
                                // Display a grid of knowledge cards
                                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())],
                                          spacing: 20) {
                                    ForEach(knowledgeData.keys.sorted(), id: \.self) { key in
                                        KnowledgeCard(
                                            label: key,
                                            images: knowledgeData[key] ?? [],
                                            onDeleteImage: { image in
                                                deleteImage(image, label: key)
                                            },
                                            onDeleteLabel: {
                                                labelToDelete = key
                                                showingDeleteAlert = true
                                            }
                                        )
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                        .padding(.bottom, 8)
                    }

                    Spacer()
                }
                .padding()
            }
            .alert("Delete Label", isPresented: $showingDeleteAlert, presenting: labelToDelete) { label in
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) {
                    deleteLabel(label)
                }
            } message: { label in
                Text("Are you sure you want to delete '\(label)' and all its images?")
            }
            .onAppear {
                loadKnowledgeData() // Load knowledge data when the view appears
            }
        }
    }
    
    // Loads knowledge data from the storage manager
    private func loadKnowledgeData() {
        knowledgeData = StorageManager.shared.loadImages()
    }
    
    // Deletes a specific image from the knowledge base
    private func deleteImage(_ image: UIImage, label: String) {
        let metadata = UserDefaults.standard.dictionary(forKey: "imageMetadata") as? [String: String] ?? [:]
        if let imageName = metadata.first(where: { $0.value == label })?.key {
            StorageManager.shared.deleteImage(imageName)
            
            if let index = knowledgeData[label]?.firstIndex(of: image) {
                knowledgeData[label]?.remove(at: index)
            }
        }
    }
    
    // Deletes an entire label and its associated images
    private func deleteLabel(_ label: String) {
        // Delete all images for this label
        let metadata = UserDefaults.standard.dictionary(forKey: "imageMetadata") as? [String: String] ?? [:]
        metadata.forEach { imageName, imageLabel in
            if imageLabel == label {
                StorageManager.shared.deleteImage(imageName)
            }
        }
        
        // Remove label from knowledgeData
        knowledgeData.removeValue(forKey: label)
    }
}

// A reusable card view for displaying a label and its associated images
struct KnowledgeCard: View {
    @Environment(\.colorScheme) var colorScheme // Access the current color scheme
    let label: String // The label for the knowledge card
    let images: [UIImage] // Images associated with the label
    let onDeleteImage: (UIImage) -> Void // Callback for deleting an image
    let onDeleteLabel: () -> Void // Callback for deleting the label
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(label)
                    .font(.headline)
                Spacer()
                Button(action: onDeleteLabel) {
                    Image(systemName: "trash")
                        .foregroundColor(.red)
                }
            }
            .padding([.top, .horizontal])
            
            // Horizontal scroll view for displaying images
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(images, id: \.self) { image in
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFill()
                            .frame(width: 80, height: 80)
                            .clipped()
                            .cornerRadius(10)
                            .overlay(
                                Button(action: { onDeleteImage(image) }) {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundColor(.red)
                                        .background(Color.white.clipShape(Circle()))
                                }
                                .offset(x: 30, y: -30),
                                alignment: .topTrailing
                            )
                    }
                }
                .padding(.horizontal)
            }
        }
        .padding(.vertical)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(colorScheme == .dark ? .systemGray5 : .white))
                .shadow(color: .gray.opacity(0.3), radius: 5, x: 0, y: 5)
        )
        .padding(.horizontal)
    }
}

// A view displayed when the knowledge base is empty
struct EmptyStateView: View {
    @Environment(\.colorScheme) var colorScheme // Access the current color scheme
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "doc.text.image")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text("No Knowledge Data")
                .font(.title2)
                .foregroundColor(.gray)
            
            Text("Start training your bot to build its knowledge base")
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
        }
        .padding()
        .foregroundColor(Color(.systemGray))
    }
}

// Card list for kid-friendly lesson content
struct KidFriendlyLessonsView: View {
    let lessons: [KnowledgeItem]

    private var featuredLessons: [KnowledgeItem] {
        Array(lessons.prefix(2))
    }

    private var remainingLessons: [KnowledgeItem] {
        Array(lessons.dropFirst(2))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("AI Lessons for Kids")
                .font(.title2)
                .fontWeight(.bold)
                .padding(.horizontal)

            Text("Tap a lesson to open it.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .padding(.horizontal)

            ForEach(featuredLessons) { lesson in
                NavigationLink(destination: LessonDetailView(lesson: lesson)) {
                    FeaturedLessonButton(title: lesson.title)
                }
                .buttonStyle(.plain)
                .padding(.horizontal)
            }

            ForEach(remainingLessons) { lesson in
                NavigationLink(destination: LessonDetailView(lesson: lesson)) {
                    LessonCard(lesson: lesson)
                }
                .buttonStyle(.plain)
            }
        }
    }
}

struct FeaturedLessonButton: View {
    let title: String

    var body: some View {
        HStack {
            Text(title)
                .font(.headline)
                .foregroundColor(.white)
            Spacer()
            Image(systemName: "arrow.right.circle.fill")
                .foregroundColor(.white)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(
                    LinearGradient(
                        colors: [Color.blue, Color.purple],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
        )
    }
}

struct LessonCard: View {
    @Environment(\.colorScheme) var colorScheme
    let lesson: KnowledgeItem

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(lesson.title)
                    .font(.headline)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(lesson.content)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .lineLimit(3)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(colorScheme == .dark ? .systemGray5 : .white))
                .shadow(color: .gray.opacity(0.2), radius: 4, x: 0, y: 3)
        )
        .padding(.horizontal)
    }
}

struct LessonDetailView: View {
    let lesson: KnowledgeItem

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(lesson.title)
                    .font(.largeTitle)
                    .fontWeight(.bold)

                Text(lesson.content)
                    .font(.body)
                    .fixedSize(horizontal: false, vertical: true)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Fun Example")
                        .font(.title3)
                        .fontWeight(.semibold)
                    Text(exampleText(for: lesson.title))
                        .font(.body)
                        .foregroundColor(.secondary)
                }
                .padding()
                .background(RoundedRectangle(cornerRadius: 14).fill(Color(.systemGray6)))

                VStack(alignment: .leading, spacing: 8) {
                    Text("Try It")
                        .font(.title3)
                        .fontWeight(.semibold)
                    Text(activityText(for: lesson.title))
                        .font(.body)
                        .foregroundColor(.secondary)
                }
                .padding()
                .background(RoundedRectangle(cornerRadius: 14).fill(Color(.systemGray6)))

                Text("Great job learning! Keep going, AI explorer.")
                    .font(.footnote)
                    .foregroundColor(.secondary)
                    .padding(.top, 8)
            }
            .padding()
        }
        .navigationTitle("Lesson")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func exampleText(for title: String) -> String {
        switch title.lowercased() {
        case "what is ai?":
            return "A music app learns songs you like and suggests new songs you might enjoy."
        case "how ai learns":
            return "If you show AI many apple photos and many orange photos, it learns what makes each fruit different."
        case "training data":
            return "If practice questions are clear and correct, students learn better. AI is similar."
        case "labels":
            return "A photo named 'cat' teaches AI that this image belongs to the cat group."
        case "patterns":
            return "AI notices that stop signs are usually red and shaped like octagons."
        case "prediction":
            return "After seeing many flower photos, AI guesses: 'This is probably a sunflower.'"
        case "confidence score":
            return "AI might say 'I am 90% sure this is a bike.'"
        case "ai can make mistakes":
            return "A blurry photo can confuse AI and cause a wrong guess."
        case "fairness in ai":
            return "If AI only sees one kind of handwriting, it may struggle with other handwriting styles."
        case "privacy":
            return "Never upload private photos without asking a trusted adult."
        default:
            return "AI learns from examples, then uses those examples to make smart guesses."
        }
    }

    private func activityText(for title: String) -> String {
        switch title.lowercased() {
        case "what is ai?":
            return "Find one app on your device that uses AI and explain what it helps you do."
        case "how ai learns":
            return "Draw two groups: cats and dogs. Write 3 features for each group."
        case "training data":
            return "Take 5 clear pictures of one object and 5 of a different object. Compare which set is clearer."
        case "labels":
            return "Make flashcards with pictures and write labels under each one."
        case "patterns":
            return "Look around your room and list 3 repeating patterns (shapes, colors, sizes)."
        case "prediction":
            return "Guess what object is in a covered photo before revealing it. That is like prediction."
        case "confidence score":
            return "For 5 guesses today, rate how sure you are from 1 to 10."
        case "ai can make mistakes":
            return "Try identifying an object in bright light and dim light. Which is easier?"
        case "fairness in ai":
            return "Collect examples from different colors, sizes, and angles to make your training set fair."
        case "privacy":
            return "Create a 'safe to share' checklist with a trusted adult."
        default:
            return "Teach a friend one new AI word you learned today."
        }
    }
}
