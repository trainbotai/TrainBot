import SwiftUI
import PhotosUI
import Vision
import CoreML

// Displays the training screen where users can upload and label images
struct TrainingView: View {
    @Binding var knowledgeData: [String: [UIImage]] // Knowledge base data
    @State private var selectedImages: [PhotosPickerItem] = [] // Selected images from the photo picker
    @State private var pendingImages: [UIImage] = [] // Images pending submission
    @State private var newLabel: String = "" // Label for the uploaded images
    @State private var autoClassification: String = "" // Auto-classification result
    @EnvironmentObject var settings: AppSettings // Access shared app settings
    
    var body: some View {
        ZStack {
            Color(.systemGray6)
                .ignoresSafeArea() // Set the background color
            
            VStack(spacing: 25) {
                // Header for the training screen
                Text("Train \(settings.botName)")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .shadow(color: .gray, radius: 2, x: 0, y: 2)
                    .padding(.top, 30)
                
                // Description of the training functionality
                Text("Train your bot by uploading and labeling images.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                // Display auto-classification results
                if !autoClassification.isEmpty {
                    Text("Detected: \(autoClassification)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .padding(.horizontal)
                }
                
                // Image preview grid
                ScrollView(.horizontal, showsIndicators: false) {
                    LazyHStack(spacing: 15) {
                        ForEach(pendingImages, id: \.self) { image in
                            VStack {
                                Image(uiImage: image)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 100, height: 100)
                                    .clipShape(RoundedRectangle(cornerRadius: 15))
                                    .shadow(radius: 5)
                                
                                Text(autoClassification.components(separatedBy: " (").first ?? "")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .frame(height: pendingImages.isEmpty ? 0 : 150)
                
                VStack(spacing: 20) {
                    // Photo picker for selecting images
                    PhotosPicker(selection: $selectedImages, matching: .images) {
                        HStack {
                            Image(systemName: "photo.on.rectangle.angled")
                            Text("Select Images")
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(height: 50)
                        .frame(maxWidth: .infinity)
                        .background(
                            LinearGradient(colors: [.blue, .purple],
                                         startPoint: .leading,
                                         endPoint: .trailing)
                        )
                        .cornerRadius(15)
                        .shadow(radius: 5)
                    }
                    
                    // Text field for entering a label
                    TextField("Enter a label (e.g., Cat)", text: $newLabel)
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(10)
                    
                    // Submit button for uploading images
                    Button {
                        submitTrainingImages()
                    } label: {
                        HStack {
                            Image(systemName: "arrow.up.circle.fill")
                            Text("Submit Images")
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(height: 50)
                        .frame(maxWidth: .infinity)
                        .background(
                            LinearGradient(colors: [.green, .blue],
                                         startPoint: .leading,
                                         endPoint: .trailing)
                        )
                        .cornerRadius(15)
                        .shadow(radius: 5)
                    }
                    .disabled(pendingImages.isEmpty || newLabel.isEmpty) // Disable button if no images or label
                }
                .padding(.horizontal)
                
                Spacer()
            }
            .padding()
        }
        .onChange(of: selectedImages) { _, newItems in
            processSelectedImages(newItems) // Process newly selected images
        }
    }
    
    // Processes selected images from the photo picker
    private func processSelectedImages(_ items: [PhotosPickerItem]) {
        Task {
            for item in items {
                if let data = try? await item.loadTransferable(type: Data.self),
                   let uiImage = UIImage(data: data) {
                    if (!pendingImages.contains(where: { $0.pngData() == uiImage.pngData() })) {
                        pendingImages.append(uiImage)
                        
                        // First try to predict from existing knowledge
                        if let prediction = await ImageClassifier.shared.predictFromKnowledge(uiImage, knowledgeData: knowledgeData) {
                            let confidence = Int(prediction.confidence * 100)
                            await MainActor.run {
                                autoClassification = "\(prediction.label) (\(confidence)% match)"
                                if newLabel.isEmpty {
                                    newLabel = prediction.label
                                }
                            }
                        } else {
                            // Fall back to ML classification if no knowledge match
                            let classification = await ImageClassifier.shared.classify(uiImage)
                            await MainActor.run {
                                autoClassification = classification
                                if newLabel.isEmpty {
                                    newLabel = classification.components(separatedBy: " (").first ?? ""
                                }
                            }
                        }
                    }
                }
            }
            selectedImages.removeAll() // Clear selected images
        }
    }
    
    // Submits the selected images with the provided label
    private func submitTrainingImages() {
        guard !newLabel.isEmpty, !pendingImages.isEmpty else { return }
        
        for image in pendingImages {
            _ = StorageManager.shared.saveImage(image, label: newLabel) // Save the image
        }
        
        if knowledgeData[newLabel] == nil {
            knowledgeData[newLabel] = []
        }
        knowledgeData[newLabel]?.append(contentsOf: pendingImages) // Update knowledge data
        
        Task {
            await ImageClassifier.shared.updateModel(with: pendingImages, label: newLabel) // Update the model
        }
        
        let totalImages = knowledgeData.values.reduce(0) { $0 + $1.count }
        if totalImages >= 5 {
            settings.achievementsManager.unlockAchievement(named: "Upload 5 Images") // Unlock achievement
        }
        
        pendingImages.removeAll() // Clear pending images
        newLabel = "" // Reset label
        autoClassification = "" // Reset auto-classification
    }
}
