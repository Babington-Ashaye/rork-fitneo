import SwiftUI
import AVFoundation

struct BarcodeScannerView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var permissionDenied = false
    @State private var scannedBarcode: String?
    @State private var nutritionResult: NutritionResult?
    @State private var isLoading = false
    @State private var errorMessage: String?

    var onFoodLogged: ((NutritionResult) -> Void)?

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()

            if permissionDenied {
                cameraDeniedView
            } else if let result = nutritionResult {
                resultCard(result)
            } else {
                cameraPreview
            }

            if isLoading {
                Color.black.opacity(0.6).ignoresSafeArea()
                ProgressView().tint(Theme.accent).scaleEffect(1.5)
            }
        }
        .toolbarVisibility(.hidden, for: .navigationBar)
        .preferredColorScheme(.dark)
        .task { await checkCameraPermission() }
        .alert("Scan Failed", isPresented: .init(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })) {
            Button("OK") { errorMessage = nil }
        } message: { Text(errorMessage ?? "Unknown error") }
    }

    // MARK: - Permission check

    private func checkCameraPermission() async {
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        switch status {
        case .notDetermined:
            let granted = await AVCaptureDevice.requestAccess(for: .video)
            permissionDenied = !granted
        case .denied, .restricted:
            permissionDenied = true
        default:
            permissionDenied = false
        }
    }

    // MARK: - Camera denied fallback

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

    // MARK: - Camera preview

    private var cameraPreview: some View {
        ZStack {
            BarcodeCameraView { barcode in
                guard scannedBarcode == nil else { return }
                scannedBarcode = barcode
                UINotificationFeedbackGenerator().notificationOccurred(.success)
                Task { await lookupBarcode(barcode) }
            }
            .ignoresSafeArea()

            VStack {
                HStack {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 30))
                            .foregroundStyle(.white)
                            .shadow(radius: 4)
                    }
                    .padding(.leading, 20).padding(.top, 16)
                    Spacer()
                }
                Spacer()
                Text("Point your camera at a barcode")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(.white.opacity(0.8))
                    .padding(16)
                    .background(Capsule().fill(Color.black.opacity(0.5)))
                    .padding(.bottom, 60)
            }
        }
    }

    // MARK: - Lookup

    private func lookupBarcode(_ barcode: String) async {
        isLoading = true
        defer { isLoading = false }
        if let result = await FoodAPIService.shared.fetchByBarcode(barcode) {
            withAnimation(.spring(response: 0.4)) {
                nutritionResult = result
            }
        } else {
            errorMessage = "Could not find nutrition data for this barcode. Try scanning a packaged food item."
            scannedBarcode = nil
        }
    }

    // MARK: - Result card

    private func resultCard(_ result: NutritionResult) -> some View {
        VStack(spacing: 20) {
            Spacer()
            VStack(spacing: 16) {
                Image(systemName: "barcode.viewfinder")
                    .font(.system(size: 48))
                    .foregroundStyle(Theme.accent)
                Text(result.foodName)
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)

                VStack(spacing: 12) {
                    macroRow("Calories", "\(Int(result.totalCalories))", "kcal", Theme.accent)
                    macroRow("Protein", "\(Int(result.totalProtein))", "g", Theme.accent)
                    macroRow("Carbs", "\(Int(result.totalCarbs))", "g", Theme.coral)
                    macroRow("Fat", "\(Int(result.totalFat))", "g", Color(red: 1, green: 0.78, blue: 0.2))
                }
                .padding(16)
                .glassCard(cornerRadius: 16)

                Button {
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    onFoodLogged?(result)
                    dismiss()
                } label: {
                    Text("Log to Diary")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(RoundedRectangle(cornerRadius: 14).fill(Theme.accent))
                }
                .buttonStyle(.plain)

                Button("Scan Again") {
                    scannedBarcode = nil
                    nutritionResult = nil
                }
                .font(.system(size: 15))
                .foregroundStyle(Theme.textSecondary)
            }
            .padding(24)
            .frame(maxWidth: min(UIScreen.main.bounds.width - 40, 400))
            .glassCard(cornerRadius: 24)
            Spacer()
        }
        .padding(.horizontal, 20)
    }

    private func macroRow(_ label: String, _ value: String, _ unit: String, _ color: Color) -> some View {
        HStack {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label).font(.system(size: 15)).foregroundStyle(Theme.textSecondary)
            Spacer()
            Text(value).font(.system(size: 17, weight: .bold)).foregroundStyle(.white)
            Text(unit).font(.system(size: 13)).foregroundStyle(Theme.textTertiary)
        }
    }
}

// MARK: - Barcode camera (UIViewRepresentable)

private struct BarcodeCameraView: UIViewControllerRepresentable {
    let onScan: (String) -> Void

    func makeUIViewController(context: Context) -> BarcodeCameraController {
        let controller = BarcodeCameraController()
        controller.onScan = onScan
        return controller
    }

    func updateUIViewController(_ uiViewController: BarcodeCameraController, context: Context) {}
}

private final class BarcodeCameraController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    var onScan: ((String) -> Void)?
    private let session = AVCaptureSession()
    private var previewLayer: AVCaptureVideoPreviewLayer?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black

        guard let device = AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device) else { return }

        session.addInput(input)
        let output = AVCaptureMetadataOutput()
        session.addOutput(output)
        output.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
        output.metadataObjectTypes = [.ean13, .ean8, .upce, .code39, .code128]

        let preview = AVCaptureVideoPreviewLayer(session: session)
        preview.videoGravity = .resizeAspectFill
        preview.frame = view.bounds
        view.layer.addSublayer(preview)
        previewLayer = preview

        DispatchQueue.global(qos: .userInitiated).async {
            self.session.startRunning()
        }
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        previewLayer?.frame = view.bounds
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        DispatchQueue.global(qos: .userInitiated).async {
            self.session.stopRunning()
        }
    }

    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        guard let object = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let barcode = object.stringValue else { return }
        DispatchQueue.global(qos: .userInitiated).async { self.session.stopRunning() }
        onScan?(barcode)
    }
}
