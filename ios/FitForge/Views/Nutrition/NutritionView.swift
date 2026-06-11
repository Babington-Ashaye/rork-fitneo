import SwiftUI
import PhotosUI

struct NutritionView: View {
    @Environment(FitneoStore.self) private var store
    @State private var searchMeal: MealType?
    @State private var showScanner = false
    @State private var scannerImage: UIImage?
    @State private var showAnalysis = false

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
        ScrollView {
            VStack(spacing: 18) {
                ScreenTitle(title: "Nutrition", subtitle: Date().formatted(.dateTime.weekday(.wide).month().day()))

                summaryCard

                // Scan meal button
                Button {
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    if store.subscription.isPremium {
                        showScanner = true
                    }
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
        .sheet(item: $searchMeal) { meal in
            FoodSearchSheet(meal: meal)
        }
        .confirmationDialog("Scan Meal", isPresented: $showScanner, titleVisibility: .visible) {
            Button("Take Photo") { /* camera */ }
            Button("Choose from Gallery") { /* photo picker */ }
            Button("Cancel", role: .cancel) {}
        }
        .onAppear {
            if let prefill = store.prefilledFoodSearch {
                store.prefilledFoodSearch = nil
                searchMeal = .lunch
                _ = prefill
            }
        }
    }

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
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(entry.name).font(.system(size: 14, weight: .semibold)).foregroundStyle(.white)
                        Text("P\(Int(entry.protein)) · C\(Int(entry.carbs)) · F\(Int(entry.fat))")
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
                .padding(.vertical, 4)
            }
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
        }
        .padding(16)
        .glassCard(cornerRadius: 20)
    }
}

// MARK: - Food search & portion sheets

struct FoodSearchSheet: View {
    @Environment(FitneoStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let meal: MealType
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
                    TextField("Search foods…", text: $query)
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
                                        Text("\(item.category) · \(item.serving)").font(.system(size: 12)).foregroundStyle(Theme.textTertiary)
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
                Text("\(Int(Double(item.calories) * portion)) kcal · \(item.serving)")
                    .font(.system(size: 14)).foregroundStyle(Theme.textSecondary)
                HStack(spacing: 10) {
                    ForEach(options, id: \.self) { o in
                        Button {
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            portion = o
                        } label: {
                            Text("\(o == 1 ? "1" : String(format: "%g", o))×")
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
