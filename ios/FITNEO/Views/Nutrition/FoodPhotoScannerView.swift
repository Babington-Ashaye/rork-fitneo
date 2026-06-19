import SwiftUI
import PhotosUI
import AVFoundation

struct FoodPhotoScannerView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(FitneoStore.self) private var store

    @State private var cameraPermissionDenied = false
    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var capturedImage: UIImage?
    @State private var isAnalyzing = false
    @State private var scanResponse: MealScanResponse?
    @State private var errorMessage: String?
    @State private var showPhotoPicker = false
    @State private var showCamera = false

    var onFoodLogged: (([FoodComponent], NutritionTotalsData) -> Void)?

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()

            if cameraPermissionDenied {
                cameraDeniedView
            } else if isAnalyzing {
                analyzingView
            } else if let response = scanResponse {
                resultView(response)
            } else {
                capturePromptView
            }
        }
        .toolbarVisibility(.hidden, for: .navigationBar)
        .preferredColorScheme(.dark)
        .task { await checkCameraPermission() }
        .photosPicker(isPresented: $showPhotoPicker, selection: $selectedPhotoItem, matching: .images)
        .onChange(of: selectedPhotoItem) { _, item in
            guard let item else { return }
            Task { await loadAndAnalyzePhoto(item) }
        }
        .fullScreenCover(isPresented: $showCamera) {
            CameraCaptureView(image: $capturedImage)
        }
        .onChange(of: capturedImage) { _, img in
            guard let img else { return }
            Task { await analyzeImage(img) }
        }
        .alert("Analysis Failed", isPresented: .init(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })) {
            Button("OK") { errorMessage = nil }
        } message: { Text(errorMessage ?? "Unknown error") }
    }

    // MARK: - Permission check

    private func checkCameraPermission() async {
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        switch status {
        case .notDetermined:
            let granted = await AVCaptureDevice.requestAccess(for: .video)
            cameraPermissionDenied = !granted
        case .denied, .restricted:
            cameraPermissionDenied = true
        default:
            cameraPermissionDenied = false
        }
    }

    // MARK: - Camera denied

    private var cameraDeniedView: some View {
        VStack(spacing: 24) {
            Spacer()
            Image(systemName: "camera.fill")
                .font(.system(size: 60))
                .foregroundStyle(Theme.textTertiary)
            Text("Camera access is required to scan barcodes and analyze meals with AI.")
                .font(.system(size: 16))
                .foregroundStyle(Theme.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            Button {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            } label: {
                Text("Open System Settings")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 24).padding(.vertical, 14)
                    .background(RoundedRectangle(cornerRadius: 14).fill(Theme.accent))
            }
            .buttonStyle(.plain)
            Button("Cancel") { dismiss() }
                .font(.system(size: 15))
                .foregroundStyle(Theme.textTertiary)
            Spacer()
        }
    }

    // MARK: - Capture prompt (choose photo or take one)

    private var capturePromptView: some View {
        VStack(spacing: 32) {
            Spacer()
            Image(systemName: "camera.metering.matrix")
                .font(.system(size: 72))
                .foregroundStyle(Theme.accent)
                .shadow(color: Theme.accent.opacity(0.3), radius: 20)

            Text("Analyze Your Cooked Meal")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(.white)

            Text("FITNEO AI identifies each food component — rice, chicken, stew, vegetables — and estimates calories and macros from a photo.")
                .font(.system(size: 14))
                .foregroundStyle(Theme.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 20)

            VStack(spacing: 14) {
                Button {
                    showPhotoPicker = true
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "photo.on.rectangle")
                            .font(.system(size: 18))
                        Text("Choose from Library")
                            .font(.system(size: 16, weight: .semibold))
                        Spacer()
                    }
                    .foregroundStyle(.white)
                    .padding(16)
                    .frame(maxWidth: .infinity)
                    .glassCard(cornerRadius: 16)
                }
                .buttonStyle(.plain)

                Button {
                    showCamera = true
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "camera.fill")
                            .font(.system(size: 18))
                        Text("Take Photo")
                            .font(.system(size: 16, weight: .semibold))
                        Spacer()
                    }
                    .foregroundStyle(.white)
                    .padding(16)
                    .frame(maxWidth: .infinity)
                    .glassCard(cornerRadius: 16)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 20)

            Button("Cancel") { dismiss() }
                .foregroundStyle(Theme.textTertiary)

            Spacer()
        }
    }

    // MARK: - Analyzing

    private var analyzingView: some View {
        VStack(spacing: 20) {
            Spacer()
            ProgressView()
                .tint(Theme.accent)
                .scaleEffect(1.8)
            Text("FITNEO AI is analyzing your meal...")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(.white)
            Text("Identifying components and estimating nutrition")
                .font(.system(size: 13))
                .foregroundStyle(Theme.textTertiary)
            Spacer()
        }
    }

    // MARK: - Result view

    private func resultView(_ response: MealScanResponse) -> some View {
        ScrollView {
            VStack(spacing: 18) {
                Color.clear.frame(height: 1)

                Text("AI Meal Analysis")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.top, 8)

                // Components
                ForEach(response.components) { component in
                    HStack {
                        VStack(alignment: .leading, spacing: 3) {
                            Text(component.name)
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(.white)
                            Text("~\(Int(component.weightGrams))g")
                                .font(.system(size: 12))
                                .foregroundStyle(Theme.textTertiary)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 3) {
                            Text("\(Int(component.calories)) kcal")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(Theme.accent)
                            Text("P\(Int(component.protein)) C\(Int(component.carbs)) F\(Int(component.fat))")
                                .font(.system(size: 10))
                                .foregroundStyle(Theme.textTertiary)
                        }
                    }
                    .padding(14)
                    .glassCard(cornerRadius: 14)
                }

                // Totals
                VStack(spacing: 12) {
                    Text("Total Nutrition")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    HStack(spacing: 16) {
                        totalItem("Calories", "\(Int(response.totals.calories))", "kcal")
                        totalItem("Protein", "\(Int(response.totals.protein))", "g")
                        totalItem("Carbs", "\(Int(response.totals.carbs))", "g")
                        totalItem("Fat", "\(Int(response.totals.fat))", "g")
                    }
                }
                .padding(16)
                .glassCard(cornerRadius: 16)

                // Save button
                Button {
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    onFoodLogged?(response.components, response.totals)
                    dismiss()
                } label: {
                    Text("Save to Diary")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(RoundedRectangle(cornerRadius: 14).fill(Theme.accent))
                }
                .buttonStyle(.plain)

                Button("Retake") {
                    scanResponse = nil
                    capturedImage = nil
                }
                .foregroundStyle(Theme.textSecondary)

                Color.clear.frame(height: 30)
            }
            .padding(.horizontal, 20)
        }
        .scrollIndicators(.hidden)
    }

    private func totalItem(_ label: String, _ value: String, _ unit: String) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
            Text(unit).font(.system(size: 10)).foregroundStyle(Theme.textTertiary)
            Text(label).font(.system(size: 10)).foregroundStyle(Theme.textSecondary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Photo loading & analysis

    private func loadAndAnalyzePhoto(_ item: PhotosPickerItem) async {
        guard let data = try? await item.loadTransferable(type: Data.self),
              let image = UIImage(data: data) else {
            errorMessage = "Could not load the selected image."
            return
        }
        await analyzeImage(image)
    }

    private func analyzeImage(_ image: UIImage) async {
        isAnalyzing = true
        defer { isAnalyzing = false }

        guard let jpegData = image.jpegData(compressionQuality: 0.7) else {
            errorMessage = "Could not process the image."
            return
        }

        let base64 = jpegData.base64EncodedString()

        if let response = await FoodAPIService.shared.analyzeMealPhoto(base64Image: base64) {
            withAnimation(.spring(response: 0.4)) {
                scanResponse = response
            }
        } else {
            errorMessage = "FITNEO AI could not analyze this image. Try again with better lighting and a clear shot of your meal."
        }
    }
}
