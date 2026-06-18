import SwiftUI
import PhotosUI

struct NutritionView: View {
    @Environment(FitneoStore.self) private var store
    @State private var searchMeal: MealType?
    @State private var showScanner = false
    @State private var scannerMeal: MealType?
    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var showCamera = false
    @State private var capturedImage: UIImage?
    @State private var isAnalyzing = false
    @State private var analysisResult: NutritionAnalysisResult?
    @State private var showConfirmation = false
    @State private var scanError: String?
    @State private var aiMessages: [UUID: String] = [:]

    private var consumed: Int { store.caloriesConsumed(on: Date()) }
    private var remaining: Int { store.user.calorieGoal - consumed }
    private var macros: (protein: Double, carbs: Double, fat: Double) { store.macros(on: Date()) }

    private var statusColor: Color {
        let ratio = Double(consumed) / Double(max(1, store.user.calorieGoal))
        if ratio > 1.05 { return Theme.danger }
        if ratio > 0.85 { return Color(red: 1, green: 0.78, blue: 0.2) }
        return Theme.accent
    }

    var body: some View {
        ZStack {
            ScrollView {
                VStack(spacing: 18) {
                    ScreenTitle(title: "Nutrition", subtitle: Date().formatted(.dateTime.weekday(.wide).month().day()))
                    summaryCard

                    // Scan meal button
                    Button {
                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                        scannerMeal = nil
                        showScanner = true
                    } label: {
                        HStack(spacing: 14) {
                            Image(systemName: "camera.fill")
                                .font(.system(size: 22))
                                .foregroundStyle(Theme.accent)
                                .frame(width: 48, height: 48)
                                .background(Circle().fill(Theme.accent.opacity(0.15)))
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Scan Meal").font(.system(size: 17, weight: .bold)).foregroundStyle(.white)
                                Text("FITNEO AI analyses your food instantly")
                                    .font(.system(size: 12)).foregroundStyle(Theme.textTertiary)
                            }
                            Spacer()
                            Image(systemName: "chevron.right").foregroundStyle(Theme.textTertiary)
                        }
                        .padding(18)
                        .glassCard(cornerRadius: 22)
                    }
                    .buttonStyle(.plain)

                    ForEach(MealType.allCases, id: \.self) { meal in
                        mealSection(meal)
                    }
                    Color.clear.frame(height: 90)
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
            }
            .scrollIndicators(.hidden)
            .background(Theme.pageGradient.ignoresSafeArea())

            // Analysis overlay
            if isAnalyzing {
                Color.black.opacity(0.7).ignoresSafeArea()
                VStack(spacing: 16) {
                    ProgressView()
                        .tint(Theme.accent)
                        .scaleEffect(1.5)
                    Text("Analyzing your food...")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(.white)
                }
            }
        }
        .sheet(item: $searchMeal) { meal in
            FoodSearchSheet(meal: meal, onFoodLogged: { entry in
                generateAIMessage(for: entry)
                // Sync to Supabase
                if let uid = SupabaseService.shared.userId {
                    Task { await SupabaseService.shared.saveFoodLog(entry: entry, userId: uid) }
                }
            })
        }
        .confirmationDialog("Scan Meal", isPresented: $showScanner, titleVisibility: .visible) {
            Button("AI Photo Scan") {
                selectedPhotoItem = nil
                showCamera = false
                // Will trigger PhotosPicker via state
            }
            Button("Take Photo") {
                showCamera = true
            }
            if let meal = scannerMeal {
                Button("Add to \(meal.title)") { }
            }
            Button("Cancel", role: .cancel) {}
        }
        .photosPicker(isPresented: .init(
            get: { selectedPhotoItem != nil || (!showScanner && !showCamera && selectedPhotoItem == nil && analysisResult == nil) },
            set: { newValue in
                // This will be set by the action sheet choice
            }
        ), selection: $selectedPhotoItem, matching: .images)
        .onChange(of: selectedPhotoItem) { _, item in
            guard let item else { return }
            Task { await processPhotoItem(item) }
        }
        .fullScreenCover(isPresented: $showCamera) {
            CameraCaptureView(image: $capturedImage)
        }
        .onChange(of: capturedImage) { _, img in
            guard let img else { return }
            Task { await analyzeImage(img) }
        }
        .sheet(isPresented: $showConfirmation) {
            if let result = analysisResult { let meal = scannerMeal ?? .lunch
                FoodConfirmationView(
                    result: result,
                    mealType: meal,
                    onSave: { foods in
                        for food in foods {
                            let entry = FoodEntry(
                                id: UUID(),
                                foodID: "scan_\(UUID().uuidString.prefix(6))",
                                name: food.name,
                                mealType: meal,
                                portion: 1,
                                calories: food.calories,
                                protein: food.protein,
                                carbs: food.carbs,
                                fat: food.fat,
                                loggedAt: Date()
                            )
                            store.foodEntries.append(entry)
                            generateAIMessage(for: entry)
                            if let uid = SupabaseService.shared.userId {
                                Task { await SupabaseService.shared.saveFoodLog(entry: entry, userId: uid) }
                            }
                        }
                        analysisResult = nil
                        showConfirmation = false
                    },
                    onDiscard: {
                        analysisResult = nil
                        showConfirmation = false
                    }
                )
                .presentationDetents([.large])
            }
        }
        .alert("Scan Failed", isPresented: .init(
            get: { scanError != nil },
            set: { if !$0 { scanError = nil } }
        )) {
            Button("Retry") {
                scanError = nil
            }
            Button("OK") { scanError = nil }
        } message: {
            Text(scanError ?? "Unknown error")
        }
        .onAppear {
            if let prefill = store.prefilledFoodSearch {
                store.prefilledFoodSearch = nil
                searchMeal = .lunch
            }
        }
    }

    // MARK: - Summary

    private var summaryCard: some View {
        HStack(spacing: 18) {
            MacroRing(protein: macros.protein, carbs: macros.carbs, fat: macros.fat, size: 120)
            VStack(alignment: .leading, spacing: 10) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(max(0, remaining))").font(.system(size: 30, weight: .bold)).foregroundStyle(statusColor)
                        .contentTransition(.numericText())
                    Text(remaining >= 0 ? "kcal remaining" : "kcal over").font(.system(size: 12)).foregroundStyle(Theme.textTertiary)
                }
                macroLegend("Protein", macros.protein, Theme.accent)
                macroLegend("Carbs", macros.carbs, Theme.coral)
                macroLegend("Fat", macros.fat, Color(red: 1, green: 0.78, blue: 0.2))
            }
            Spacer()
        }
        .padding(18)
        .glassCard(cornerRadius: 24)
    }

    private func macroLegend(_ name: String, _ grams: Double, _ color: Color) -> some View {
        HStack(spacing: 6) {
            Circle().fill(color).frame(width: 7, height: 7)
            Text(name).font(.system(size: 12, weight: .medium)).foregroundStyle(Theme.textSecondary)
            Text("\(Int(grams))g").font(.system(size: 12, weight: .bold)).foregroundStyle(.white)
        }
    }

    // MARK: - Meal sections

    private func mealSection(_ meal: MealType) -> some View {
        let entries = store.entries(for: Date(), meal: meal)
        return VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label(meal.title, systemImage: meal.icon)
                    .font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                Spacer()
                Text("\(entries.reduce(0) { $0 + $1.calories }) kcal")
                    .font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.textTertiary)
            }
            ForEach(entries) { entry in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(entry.name).font(.system(size: 14, weight: .semibold)).foregroundStyle(.white)
                            Text("P\(Int(entry.protein)) \u{00b7} C\(Int(entry.carbs)) \u{00b7} F\(Int(entry.fat))")
                                .font(.system(size: 11)).foregroundStyle(Theme.textTertiary)
                        }
                        Spacer()
                        Text("\(entry.calories)").font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.textSecondary)
                        Button {
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            store.deleteFood(entry)
                        } label: {
                            Image(systemName: "minus.circle.fill").foregroundStyle(Theme.danger.opacity(0.8))
                        }
                        .buttonStyle(.plain)
                    }
                    if let aiMsg = aiMessages[entry.id] {
                        HStack(spacing: 8) {
                            Circle()
                                .fill(Theme.accent)
                                .frame(width: 6, height: 6)
                            Text(aiMsg)
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(Theme.accent)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .padding(10)
                        .background(RoundedRectangle(cornerRadius: 10).fill(Theme.accent.opacity(0.08)))
                    }
                }
                .padding(.vertical, 4)
            }
            HStack(spacing: 8) {
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    searchMeal = meal
                } label: {
                    HStack {
                        Image(systemName: "plus.circle.fill").foregroundStyle(Theme.accent)
                        Text("Add food").font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.accent)
                        Spacer()
                    }
                }
                .buttonStyle(.plain)

                Button {
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    scannerMeal = meal
                    showScanner = true
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "camera.fill").font(.system(size: 12))
                        Text("Scan").font(.system(size: 13, weight: .semibold))
                    }
                    .foregroundStyle(Theme.accent)
                    .padding(.horizontal, 12).padding(.vertical, 8)
                    .background(Capsule().fill(Theme.accent.opacity(0.12)))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(16)
        .glassCard(cornerRadius: 20)
    }

    // MARK: - Photo scanning

    private func processPhotoItem(_ item: PhotosPickerItem) async {
        guard let data = try? await item.loadTransferable(type: Data.self),
              let image = UIImage(data: data) else {
            scanError = "Could not load the selected image."
            return
        }
        await analyzeImage(image)
    }

    private func analyzeImage(_ image: UIImage) async {
        isAnalyzing = true
        defer { isAnalyzing = false }

        guard let jpegData = image.jpegData(compressionQuality: 0.7) else {
            scanError = "Could not process the image."
            return
        }

        let base64 = jpegData.base64EncodedString()
        let meal = scannerMeal ?? .lunch

        do {
            let result = try await PlanGenerationService.analyzeMeal(base64Image: base64)
            analysisResult = result
            scannerMeal = meal
            showConfirmation = true
        } catch {
            scanError = "FITNEO AI could not analyze this image. Try again with better lighting."
        }
    }

    // MARK: - AI messaging

    private func generateAIMessage(for entry: FoodEntry) {
        let name = entry.name.lowercased()
        let goal = store.user.goals.first ?? "your goal"
        let remaining = store.user.calorieGoal - store.caloriesConsumed(on: Date())
        let message: String

        if name.contains("chicken") || name.contains("salmon") || name.contains("tuna") || name.contains("egg") || name.contains("turkey") || name.contains("shrimp") || name.contains("steak") {
            message = "Great protein choice. This supports your \(goal) goal perfectly."
        } else if name.contains("chocolate") || name.contains("pizza") || name.contains("burger") || name.contains("cake") || name.contains("ice cream") {
            message = "Noted. You have \(remaining) kcal remaining today. Balance with a high-protein meal next."
        } else if name.contains("oat") || name.contains("rice") || name.contains("pasta") || name.contains("bread") || name.contains("sweet potato") {
            message = "Excellent complex carbs to fuel your training. Well done."
        } else if name.contains("protein") || name.contains("shake") || name.contains("whey") {
            message = "Smart choice. Your muscles will thank you for this post-workout fuel."
        } else if name.contains("salad") || name.contains("broccoli") || name.contains("spinach") || name.contains("kale") {
            message = "Loaded with micronutrients. Great for recovery and overall health."
        } else if name.contains("avocado") || name.contains("almond") || name.contains("peanut butter") || name.contains("olive oil") {
            message = "Quality healthy fats. Moderation keeps these working in your favor."
        } else {
            let calPct = Double(entry.calories) / Double(max(1, store.user.calorieGoal)) * 100
            if calPct > 25 {
                message = "This is a substantial meal. You have \(remaining) kcal left for the day."
            } else {
                message = "Logged. Keep building quality habits — you're doing great."
            }
        }

        aiMessages[entry.id] = message
    }
}

// MARK: - Camera capture

struct CameraCaptureView: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: CameraCaptureView
        init(parent: CameraCaptureView) { self.parent = parent }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let img = info[.originalImage] as? UIImage {
                parent.image = img
            }
            parent.dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}

// MARK: - Food confirmation

struct FoodConfirmationView: View {
    let result: NutritionAnalysisResult
    let mealType: MealType
    let onSave: ([AnalyzedFood]) -> Void
    let onDiscard: () -> Void

    @Environment(\.dismiss) private var dismiss

    private var confidenceColor: Color {
        result.confidence >= 80 ? Theme.success :
        result.confidence >= 60 ? Color(red: 1, green: 0.78, blue: 0.2) : Theme.danger
    }

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            VStack(spacing: 0) {
                // Header
                HStack {
                    Text("Scan Results").font(.system(size: 20, weight: .bold)).foregroundStyle(.white)
                    Spacer()
                    Text("\(result.confidence)%").font(.system(size: 13, weight: .bold))
                        .foregroundStyle(confidenceColor)
                        .padding(.horizontal, 10).padding(.vertical, 4)
                        .background(Capsule().fill(confidenceColor.opacity(0.15)))
                }
                .padding(.horizontal, 20).padding(.top, 16)
                Text("Detected: \(mealType.title)").font(.system(size: 13)).foregroundStyle(Theme.textTertiary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 20).padding(.bottom, 12)

                ScrollView {
                    VStack(spacing: 10) {
                        ForEach(result.foods) { food in
                            HStack {
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(food.name).font(.system(size: 15, weight: .semibold)).foregroundStyle(.white)
                                    Text(food.portion).font(.system(size: 12)).foregroundStyle(Theme.textTertiary)
                                }
                                Spacer()
                                VStack(alignment: .trailing, spacing: 3) {
                                    Text("\(food.calories) kcal").font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.accent)
                                    Text("P\(Int(food.protein)) C\(Int(food.carbs)) F\(Int(food.fat))")
                                        .font(.system(size: 10)).foregroundStyle(Theme.textTertiary)
                                }
                            }
                            .padding(14)
                            .glassCard(cornerRadius: 14)
                        }

                        // Totals
                        VStack(spacing: 12) {
                            Text("Totals").font(.system(size: 14, weight: .bold)).foregroundStyle(.white)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            HStack(spacing: 16) {
                                totalItem("Calories", "\(result.totals.calories)", "kcal")
                                totalItem("Protein", "\(Int(result.totals.protein))", "g")
                                totalItem("Carbs", "\(Int(result.totals.carbs))", "g")
                                totalItem("Fat", "\(Int(result.totals.fat))", "g")
                            }
                        }
                        .padding(16)
                        .glassCard(cornerRadius: 16)
                    }
                    .padding(.horizontal, 20)
                }
                .scrollIndicators(.hidden)

                // Buttons
                VStack(spacing: 10) {
                    Button {
                        onSave(result.foods)
                        dismiss()
                    } label: {
                        Text("Save to \(mealType.title)")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(RoundedRectangle(cornerRadius: 16).fill(Theme.accent))
                    }
                    .buttonStyle(.plain)

                    Button {
                        onDiscard()
                        dismiss()
                    } label: {
                        Text("Discard")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(Theme.textSecondary)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 20).padding(.vertical, 16)
            }
        }
    }

    private func totalItem(_ label: String, _ value: String, _ unit: String) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
            Text(unit).font(.system(size: 10)).foregroundStyle(Theme.textTertiary)
            Text(label).font(.system(size: 10)).foregroundStyle(Theme.textSecondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Food search & portion sheets

struct FoodSearchSheet: View {
    @Environment(FitneoStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let meal: MealType
    var onFoodLogged: ((FoodEntry) -> Void)?
    @State private var query = ""
    @State private var portionFor: FoodItem?

    private var results: [FoodItem] { FoodLibrary.search(query) }

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            VStack(spacing: 14) {
                Text("Add to \(meal.title)").font(.system(size: 20, weight: .bold)).foregroundStyle(.white).padding(.top, 12)
                HStack {
                    Image(systemName: "magnifyingglass").foregroundStyle(Theme.textTertiary)
                    TextField("Search foods\u{2026}", text: $query)
                        .foregroundStyle(.white).tint(Theme.accent)
                }
                .padding(14)
                .glassCard(cornerRadius: 14)
                .padding(.horizontal, 20)

                ScrollView {
                    LazyVStack(spacing: 10) {
                        ForEach(results) { item in
                            Button {
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                portionFor = item
                            } label: {
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(item.name).font(.system(size: 15, weight: .semibold)).foregroundStyle(.white)
                                        Text("\(item.category) \u{00b7} \(item.serving)").font(.system(size: 12)).foregroundStyle(Theme.textTertiary)
                                    }
                                    Spacer()
                                    Text("\(item.calories) kcal").font(.system(size: 13, weight: .bold)).foregroundStyle(Theme.accent)
                                }
                                .padding(14)
                                .glassCard(cornerRadius: 14)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 20)
                }
                .scrollIndicators(.hidden)
            }
        }
        .presentationDragIndicator(.visible)
        .sheet(item: $portionFor) { item in
            PortionSheet(item: item) { portion in
                store.logFood(item, meal: meal, portion: portion)
                if let last = store.foodEntries.last {
                    onFoodLogged?(last)
                }
                portionFor = nil
                dismiss()
            }
            .presentationDetents([.height(280)])
        }
    }
}

struct PortionSheet: View {
    let item: FoodItem
    var onAdd: (Double) -> Void
    @State private var portion: Double = 1.0
    private let options: [Double] = [0.5, 1, 1.5, 2]

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            VStack(spacing: 18) {
                Text(item.name).font(.system(size: 20, weight: .bold)).foregroundStyle(.white).padding(.top, 18)
                Text("\(Int(Double(item.calories) * portion)) kcal \u{00b7} \(item.serving)")
                    .font(.system(size: 14)).foregroundStyle(Theme.textSecondary)
                HStack(spacing: 10) {
                    ForEach(options, id: \.self) { o in
                        Button {
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            portion = o
                        } label: {
                            Text("\(o == 1 ? "1" : String(format: "%g", o))\u{00d7}")
                                .font(.system(size: 15, weight: .bold))
                                .foregroundStyle(portion == o ? .white : Theme.textSecondary)
                                .frame(maxWidth: .infinity).padding(.vertical, 14)
                                .background(RoundedRectangle(cornerRadius: 14).fill(portion == o ? Theme.accent : Color.white.opacity(0.05)))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 20)
                PillButton(title: "Add Food", icon: "plus") { onAdd(portion) }
                    .padding(.horizontal, 20)
                Spacer()
            }
        }
        .presentationDragIndicator(.visible)
    }
}
