import SwiftUI

struct ProgressDashboardView: View {
    @Environment(FitneoStore.self) private var store
    @State private var showWeightSheet = false

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                ScreenTitle(title: "Progress", subtitle: "Your data, decoded")
                streakCard
                weightCard
                weeklyChart
                statsGrid
                bodyMetrics
                muscleBreakdown
                Color.clear.frame(height: 90)
            }
            .padding(.horizontal, 20)
            .padding(.top, 8)
        }
        .scrollIndicators(.hidden)
        .background(Theme.pageGradient.ignoresSafeArea())
        .sheet(isPresented: $showWeightSheet) { LogWeightSheet().presentationDetents([.height(300)]) }
    }

    private var streakCard: some View {
        HStack(spacing: 18) {
            StreakFlame(streak: store.currentStreak)
            VStack(alignment: .leading, spacing: 2) {
                Text("\(store.currentStreak) day streak").font(.system(size: 20, weight: .bold)).foregroundStyle(.white)
                Text("Longest: \(store.longestStreak) days").font(.system(size: 13)).foregroundStyle(Theme.textTertiary)
            }
            Spacer()
            VStack(spacing: 2) {
                Text("\(store.consistencyScore)%").font(.system(size: 22, weight: .bold)).foregroundStyle(Theme.accent)
                Text("consistency").font(.system(size: 11)).foregroundStyle(Theme.textTertiary)
            }
        }
        .padding(18)
        .glassCard(cornerRadius: 22)
    }

    // MARK: - Weight

    private var weightCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("WEIGHT").font(.system(size: 11, weight: .bold)).tracking(1.5).foregroundStyle(Theme.textTertiary)
                Spacer()
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    showWeightSheet = true
                } label: {
                    Label("Log", systemImage: "plus").font(.system(size: 13, weight: .bold)).foregroundStyle(Theme.accent)
                }
                .buttonStyle(.plain)
            }
            if store.weightEntries.count >= 2 {
                LineChart(values: store.weightEntries.map { $0.weight })
                    .frame(height: 120)
                let weights = store.weightEntries.map { $0.weight }
                HStack {
                    weightStat("Min", weights.min() ?? 0)
                    weightStat("Avg", weights.reduce(0, +) / Double(weights.count))
                    weightStat("Max", weights.max() ?? 0)
                    Spacer()
                    trendBadge
                }
            } else {
                Text("Log your weight twice to see the trend chart.")
                    .font(.system(size: 14)).foregroundStyle(Theme.textTertiary)
                    .frame(maxWidth: .infinity, alignment: .leading).padding(.vertical, 16)
            }
        }
        .padding(18)
        .glassCard(cornerRadius: 22)
    }

    private func weightStat(_ label: String, _ value: Double) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(String(format: "%.1f", value)).font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
            Text(label).font(.system(size: 10)).foregroundStyle(Theme.textTertiary)
        }
        .padding(.trailing, 8)
    }

    @ViewBuilder private var trendBadge: some View {
        if let first = store.weightEntries.first?.weight, let last = store.weightEntries.last?.weight {
            let diff = last - first
            let up = diff > 0.1, down = diff < -0.1
            HStack(spacing: 4) {
                Image(systemName: up ? "arrow.up.right" : down ? "arrow.down.right" : "arrow.right")
                Text(String(format: "%+.1f", diff))
            }
            .font(.system(size: 13, weight: .bold))
            .foregroundStyle(down ? Theme.accent : up ? Theme.coral : Theme.textSecondary)
        }
    }

    // MARK: - Weekly bar chart

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("WORKOUTS / WEEK").font(.system(size: 11, weight: .bold)).tracking(1.5).foregroundStyle(Theme.textTertiary)
            let data = weeklyData()
            let maxV = max(1, data.map { $0.count }.max() ?? 1)
            HStack(alignment: .bottom, spacing: 8) {
                ForEach(data, id: \.label) { d in
                    VStack(spacing: 6) {
                        Text("\(d.count)").font(.system(size: 11, weight: .bold)).foregroundStyle(Theme.textSecondary).opacity(d.count > 0 ? 1 : 0.3)
                        RoundedRectangle(cornerRadius: 6)
                            .fill(LinearGradient(colors: [Theme.accent, Theme.accent.opacity(0.4)], startPoint: .top, endPoint: .bottom))
                            .frame(height: max(6, CGFloat(d.count) / CGFloat(maxV) * 90))
                        Text(d.label).font(.system(size: 9)).foregroundStyle(Theme.textTertiary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 130)
        }
        .padding(18)
        .glassCard(cornerRadius: 22)
    }

    private func weeklyData() -> [(label: String, count: Int)] {
        let cal = Calendar.current
        var result: [(String, Int)] = []
        for i in stride(from: 7, through: 0, by: -1) {
            guard let weekStart = cal.date(byAdding: .weekOfYear, value: -i, to: Date()),
                  let interval = cal.dateInterval(of: .weekOfYear, for: weekStart) else { continue }
            let count = store.workouts.filter { interval.contains($0.completedAt) }.count
            result.append(("W\(8 - i)", count))
        }
        return result
    }

    // MARK: - Stats grid

    private var statsGrid: some View {
        let totalSets = store.workouts.reduce(0) { $0 + $1.setsCompleted }
        return LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            StatCard(icon: "dumbbell.fill", value: "\(store.workouts.count)", label: "Total workouts")
            StatCard(icon: "square.stack.3d.up.fill", value: "\(totalSets)", label: "Total sets", tint: Theme.coral)
            StatCard(icon: "flame.fill", value: "\(store.totalCaloriesBurned)", label: "Calories burned", tint: .orange)
            StatCard(icon: "bolt.fill", value: "\(store.xp)", label: "Total XP", tint: Color(red: 0, green: 0.85, blue: 0.7))
        }
    }

    // MARK: - Body metrics

    private var bodyMetrics: some View {
        let heightM = store.user.heightUnit == "cm" ? store.user.height / 100 : store.user.height * 0.3048
        let weightKg = store.user.weightUnit == "kg" ? store.user.weight : store.user.weight * 0.4536
        let bmi = heightM > 0 ? weightKg / (heightM * heightM) : 0
        let bmiCat: String = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy" : bmi < 30 ? "Overweight" : "Obese"
        return VStack(alignment: .leading, spacing: 12) {
            Text("BODY METRICS").font(.system(size: 11, weight: .bold)).tracking(1.5).foregroundStyle(Theme.textTertiary)
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(String(format: "%.1f", bmi)).font(.system(size: 28, weight: .bold)).foregroundStyle(.white)
                    Text("BMI · \(bmiCat)").font(.system(size: 13)).foregroundStyle(Theme.textSecondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text(goalEstimate).font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.accent)
                    Text("est. goal pace").font(.system(size: 11)).foregroundStyle(Theme.textTertiary)
                }
            }
        }
        .padding(18)
        .glassCard(cornerRadius: 22)
    }

    private var goalEstimate: String {
        let perWeek = max(1, store.workoutsThisWeek)
        let weeks = max(4, 16 - perWeek * 2)
        return "~\(weeks) weeks"
    }

    // MARK: - Muscle breakdown

    private var muscleBreakdown: some View {
        let counts = Dictionary(grouping: store.workouts.flatMap { $0.muscleGroups }) { $0 }
            .mapValues { $0.count }
            .sorted { $0.value > $1.value }
        let total = max(1, counts.reduce(0) { $0 + $1.value })
        return VStack(alignment: .leading, spacing: 12) {
            Text("FAVORITE MUSCLE GROUPS").font(.system(size: 11, weight: .bold)).tracking(1.5).foregroundStyle(Theme.textTertiary)
            if counts.isEmpty {
                Text("Complete workouts to see your training split.")
                    .font(.system(size: 14)).foregroundStyle(Theme.textTertiary).padding(.vertical, 8)
            } else {
                ForEach(counts.prefix(5), id: \.key) { item in
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(item.key.title).font(.system(size: 13, weight: .medium)).foregroundStyle(.white)
                            Spacer()
                            Text("\(item.value)").font(.system(size: 12, weight: .bold)).foregroundStyle(Theme.textTertiary)
                        }
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule().fill(Color.white.opacity(0.08))
                                Capsule().fill(Theme.accent)
                                    .frame(width: max(6, geo.size.width * Double(item.value) / Double(total)))
                            }
                        }
                        .frame(height: 7)
                    }
                }
            }
        }
        .padding(18)
        .glassCard(cornerRadius: 22)
    }
}

// MARK: - Line chart

struct LineChart: View {
    let values: [Double]

    var body: some View {
        GeometryReader { geo in
            let minV = values.min() ?? 0
            let maxV = values.max() ?? 1
            let range = max(0.1, maxV - minV)
            let stepX = values.count > 1 ? geo.size.width / CGFloat(values.count - 1) : 0
            let points: [CGPoint] = values.enumerated().map { i, v in
                CGPoint(x: CGFloat(i) * stepX,
                        y: geo.size.height - (CGFloat((v - minV) / range) * (geo.size.height - 16)) - 8)
            }
            ZStack {
                Path { p in
                    guard let first = points.first else { return }
                    p.move(to: CGPoint(x: first.x, y: geo.size.height))
                    for pt in points { p.addLine(to: pt) }
                    p.addLine(to: CGPoint(x: points.last!.x, y: geo.size.height))
                    p.closeSubpath()
                }
                .fill(LinearGradient(colors: [Theme.accent.opacity(0.3), .clear], startPoint: .top, endPoint: .bottom))
                Path { p in
                    guard let first = points.first else { return }
                    p.move(to: first)
                    for pt in points.dropFirst() { p.addLine(to: pt) }
                }
                .stroke(Theme.accent, style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round))
                ForEach(Array(points.enumerated()), id: \.offset) { _, pt in
                    Circle().fill(Theme.accent).frame(width: 6, height: 6).position(pt)
                }
            }
        }
    }
}

struct LogWeightSheet: View {
    @Environment(FitneoStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var weight: Double = 70

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            VStack(spacing: 18) {
                Text("Log Weight").font(.system(size: 20, weight: .bold)).foregroundStyle(.white).padding(.top, 18)
                Text(String(format: "%.1f %@", weight, store.user.weightUnit))
                    .font(.system(size: 40, weight: .bold)).foregroundStyle(Theme.accent)
                Slider(value: $weight, in: 30...200, step: 0.5).tint(Theme.accent).padding(.horizontal, 20)
                PillButton(title: "Save", icon: "checkmark") {
                    store.logWeight(weight)
                    dismiss()
                }
                .padding(.horizontal, 20)
                Spacer()
            }
            .onAppear { weight = store.user.weight }
        }
        .presentationDragIndicator(.visible)
    }
}
