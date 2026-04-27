import SwiftUI
import PhotosUI

struct TrainingView: View {
    @State private var selectedImages: [PhotosPickerItem] = [] // Selected images from the photo picker
    @State private var pendingImages: [UIImage] = [] // Images pending submission
    @State private var newLabel: String = "" // Label for the uploaded images
    @State private var autoClassification: String = "" // Auto-classification result
    @Binding var knowledgeData: [String: [UIImage]] // Knowledge base data (bound to parent storage)

    var body: some View {
        VStack(spacing: 20) {
            Text("Train Your Model")
                .font(.largeTitle)
                .fontWeight(.bold)

            PhotosPicker(selection: $selectedImages, matching: .images) {
                Text("Select Images")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.blue)
                    .cornerRadius(10)
            }

            TextField("Enter a label (e.g., Cat)", text: $newLabel)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding()

            Button("Submit Images") {
                submitTrainingImages()
            }
            .disabled(pendingImages.isEmpty || newLabel.isEmpty)
            .padding()
            .background(Color.green)
            .foregroundColor(.white)
            .cornerRadius(10)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack {
                    ForEach(pendingImages, id: \.self) { image in
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFit()
                            .frame(width: 100, height: 100)
                            .cornerRadius(10)
                    }
                }
            }
        }
        .padding()
        .onChange(of: selectedImages) { _, newItems in
            processSelectedImages(newItems)
        }
    }

    private func processSelectedImages(_ items: [PhotosPickerItem]) {
        Task {
            for item in items {
                if let data = try? await item.loadTransferable(type: Data.self),
                   let uiImage = UIImage(data: data) {
                    pendingImages.append(uiImage)
                }
            }
            selectedImages.removeAll()
        }
    }

    private func submitTrainingImages() {
        for image in pendingImages {
            _ = StorageManager.shared.saveImage(image, label: newLabel)
        }

        if knowledgeData[newLabel] == nil {
            knowledgeData[newLabel] = []
        }
        knowledgeData[newLabel]?.append(contentsOf: pendingImages)

        // MLModelTemplate is not defined in this project.
        // Data is persisted and used by TestingView/ImageClassifier.
        pendingImages.removeAll()
        newLabel = ""
    }
}
