import Foundation

// Represents an item in the app's knowledge base
struct KnowledgeItem: Identifiable, Codable {
    let id: UUID // Unique identifier for the knowledge item
    let title: String // Title of the knowledge item (e.g., "Cat")
    let content: String // Content or description of the knowledge item

    // Initializes a new knowledge item with a unique ID, title, and content
    init(id: UUID = UUID(), title: String, content: String) {
        self.id = id // Assign a unique identifier
        self.title = title // Set the title of the knowledge item
        self.content = content // Set the content or description
    }
}

extension KnowledgeItem {
    // Kid-friendly starter lessons for the Knowledge screen
    static let kidFriendlyAILessons: [KnowledgeItem] = [
        KnowledgeItem(
            title: "What Is AI?",
            content: """
            AI means Artificial Intelligence.
            It is when a computer learns to do smart tasks, like recognizing pictures, understanding words, or making choices.

            Think of AI like a robot brain that learns from examples.
            """
        ),
        KnowledgeItem(
            title: "How AI Learns",
            content: """
            AI learns from data.
            Data is information, like photos, sounds, or text.

            If we show many cat photos and dog photos, AI can learn to tell cats and dogs apart.
            """
        ),
        KnowledgeItem(
            title: "Training Data",
            content: """
            Training data is the practice material for AI.
            Good training data should be:
            - Clear
            - Correct
            - Mixed and fair

            Better practice data helps AI make better guesses.
            """
        ),
        KnowledgeItem(
            title: "Labels",
            content: """
            A label is the name we give data.
            Example:
            - Photo of a banana -> label: \"banana\"
            - Photo of a train -> label: \"train\"

            Labels help AI connect what it sees with the right name.
            """
        ),
        KnowledgeItem(
            title: "Patterns",
            content: """
            AI is great at finding patterns.
            A pattern is something that repeats.

            Example:
            If many pictures labeled \"soccer ball\" are round and black-and-white, AI notices that pattern.
            """
        ),
        KnowledgeItem(
            title: "Prediction",
            content: """
            After learning patterns, AI makes a prediction.
            A prediction is AI's best guess.

            Example:
            \"I think this photo is a cat.\"
            """
        ),
        KnowledgeItem(
            title: "Confidence Score",
            content: """
            Confidence means how sure AI feels about its guess.

            Example:
            - 95% confidence = very sure
            - 55% confidence = not very sure

            AI can still be wrong, even with high confidence.
            """
        ),
        KnowledgeItem(
            title: "AI Can Make Mistakes",
            content: """
            AI is smart, but not perfect.
            It can be wrong if:
            - Pictures are blurry
            - Training data is too small
            - Examples are unfair or confusing

            Mistakes help us improve AI.
            """
        ),
        KnowledgeItem(
            title: "Fairness in AI",
            content: """
            Fair AI treats people and things equally.
            If training data only shows one type of example, AI can become unfair.

            We should teach AI with many different examples.
            """
        ),
        KnowledgeItem(
            title: "Privacy",
            content: """
            Privacy means keeping personal info safe.
            Personal info includes your name, address, school, and photos.

            Always ask a trusted adult before sharing personal data with apps.
            """
        )
    ]
}
