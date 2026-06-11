import Foundation
import SwiftUI

/// Central app store. Persists everything to UserDefaults (the device's local store).
@Observable
@MainActor
final class FitneoStore {

    // MARK: - Persisted state

    var user: AppUser {
        didSet { save(user, key: Keys.user) }
    }
    var settings: AppSettings {
        didSet { save(settings, key: Keys.settings) }
    }
    var subscription: Subscription {
        didSet { save(subscription, key: Keys.subscription) }
    }
    var workouts: [CompletedWorkout] {
        didSet { save(workouts, key: Keys.workouts) }
    }
    var foodEntries: [FoodEntry] {
        didSet { save(foodEntries, key: Keys.nutrition) }
    }
    var weightEntries: [WeightEntry] {
        didSet { save(weightEntries, key: Keys.weight) }
    }
    var earnedBadges: [EarnedBadge] {
        didSet { save(earnedBadges, key: Keys.badges) }
    }
    var xp: Int {
        didSet { save(xp, key: Keys.xp) }
    }
    var messages: [JarvisMessage] {
        didSet { save(messages, key: Keys.messages) }
    }
    var coachPersonality: String {
        didSet { UserDefaults.standard.set(coachPersonality, forKey: Keys.personality) }
    }
    var onboardingCompleted: Bool {
        didSet { UserDefaults.standard.set(onboardingCompleted, forKey: Keys.onboarding) }
    }
    var waterGlasses: Int {
        didSet { save(WaterLog(date: Self.dayKey(Date()), glasses: waterGlasses), key: Keys.water) }
    }

    // MARK: - Transient UI state

    var newlyUnlockedBadge: Badge?
    var didLevelUp: Bool = false
    var requestedTab: Int?            // for cross-screen navigation (Jarvis -> tab)
    var prefilledFoodSearch: String?
    var generatedPlan: GeneratedPlan? {
        didSet { save(generatedPlan, key: Keys.plan) }
    }
    var sportsSelection: SportSelection {
        didSet { save(sportsSelection, key: Keys.sportsSelection) }
    }
    var demoMode: Bool {
        didSet { UserDefaults.standard.set(demoMode, forKey: Keys.demoMode) }
    }

    // MARK: - Init

    init() {
        self.user = Self.load(AppUser.self, key: Keys.user) ?? .default
        self.settings = Self.load(AppSettings.self, key: Keys.settings) ?? AppSettings()
        self.subscription = Self.load(Subscription.self, key: Keys.subscription) ?? Subscription(status: .free, startDate: nil, expiryDate: nil)
        self.workouts = Self.load([CompletedWorkout].self, key: Keys.workouts) ?? []
        self.foodEntries = Self.load([FoodEntry].self, key: Keys.nutrition) ?? []
        self.weightEntries = Self.load([WeightEntry].self, key: Keys.weight) ?? []
        self.earnedBadges = Self.load([EarnedBadge].self, key: Keys.badges) ?? []
        self.xp = UserDefaults.standard.object(forKey: Keys.xp) as? Int ?? 0
        self.messages = Self.load([JarvisMessage].self, key: Keys.messages) ?? []
        self.generatedPlan = Self.load(GeneratedPlan.self, key: Keys.plan)
        self.sportsSelection = Self.load(SportSelection.self, key: Keys.sportsSelection) ?? SportSelection()
        self.coachPersonality = UserDefaults.standard.string(forKey: Keys.personality) ?? "motivational"
        self.onboardingCompleted = UserDefaults.standard.bool(forKey: Keys.onboarding)
        self.demoMode = UserDefaults.standard.bool(forKey: Keys.demoMode)

        let waterLog = Self.load(WaterLog.self, key: Keys.water)
        if let log = waterLog, log.date == Self.dayKey(Date()) {
            self.waterGlasses = log.glasses
        } else {
            self.waterGlasses = 0
        }

        if messages.isEmpty {
            messages = [JarvisMessage(id: UUID(), role: .coach,
                text: "I'm Jarvis, your AI coach. I track your training, nutrition and recovery. Ask me anything or say “train me” to start.",
                date: Date())]
        }
    }

    // MARK: - Derived: gamification

    var rank: FitnessRank { FitnessRank.rank(forXP: xp) }
    var level: Int { rank.rawValue }

    var xpIntoLevel: Int { xp - rank.threshold }
    var xpForNextLevel: Int? {
        guard let next = rank.next else { return nil }
        return next.threshold - rank.threshold
    }
    var levelProgress: Double {
        guard let span = xpForNextLevel, span > 0 else { return 1 }
        return min(1, Double(xpIntoLevel) / Double(span))
    }

    // MARK: - Derived: streak

    var currentStreak: Int {
        let days = Set(workouts.map { Self.dayKey($0.completedAt) })
        guard !days.isEmpty else { return 0 }
        var streak = 0
        var cursor = Calendar.current.startOfDay(for: Date())
        // Allow streak to count if worked out today OR yesterday (grace).
        if !days.contains(Self.dayKey(cursor)) {
            cursor = Calendar.current.date(byAdding: .day, value: -1, to: cursor)!
            if !days.contains(Self.dayKey(cursor)) { return 0 }
        }
        while days.contains(Self.dayKey(cursor)) {
            streak += 1
            cursor = Calendar.current.date(byAdding: .day, value: -1, to: cursor)!
        }
        return streak
    }

    var longestStreak: Int {
        let days = workouts.map { Calendar.current.startOfDay(for: $0.completedAt) }
        let sorted = Set(days).sorted()
        guard !sorted.isEmpty else { return 0 }
        var best = 1, run = 1
        for i in 1..<max(1, sorted.count) {
            let prev = sorted[i - 1]
            let cur = sorted[i]
            if Calendar.current.date(byAdding: .day, value: 1, to: prev) == cur {
                run += 1
            } else {
                run = 1
            }
            best = max(best, run)
        }
        return max(best, currentStreak)
    }

    var workoutsThisWeek: Int {
        let cal = Calendar.current
        let weekStart = cal.dateInterval(of: .weekOfYear, for: Date())?.start ?? Date()
        return workouts.filter { $0.completedAt >= weekStart }.count
    }

    var totalCaloriesBurned: Int { workouts.reduce(0) { $0 + $1.caloriesBurned } }
    var caloriesBurnedToday: Int {
        workouts.filter { Self.dayKey($0.completedAt) == Self.dayKey(Date()) }
            .reduce(0) { $0 + $1.caloriesBurned }
    }
    var activeMinutesToday: Int {
        workouts.filter { Self.dayKey($0.completedAt) == Self.dayKey(Date()) }
            .reduce(0) { $0 + $1.durationSeconds } / 60
    }

    var consistencyScore: Int {
        // Last 4 weeks: how many of the targeted days were hit.
        let target = max(1, user.weeklyWorkoutGoal * 4)
        let cal = Calendar.current
        let fourWeeksAgo = cal.date(byAdding: .day, value: -28, to: Date())!
        let count = workouts.filter { $0.completedAt >= fourWeeksAgo }.count
        return min(100, Int(Double(count) / Double(target) * 100))
    }

    // MARK: - Nutrition derived

    func entries(for date: Date, meal: MealType) -> [FoodEntry] {
        foodEntries.filter { Self.dayKey($0.loggedAt) == Self.dayKey(date) && $0.mealType == meal }
    }
    func entries(for date: Date) -> [FoodEntry] {
        foodEntries.filter { Self.dayKey($0.loggedAt) == Self.dayKey(date) }
    }
    func caloriesConsumed(on date: Date) -> Int {
        entries(for: date).reduce(0) { $0 + $1.calories }
    }
    func macros(on date: Date) -> (protein: Double, carbs: Double, fat: Double) {
        let e = entries(for: date)
        return (e.reduce(0) { $0 + $1.protein }, e.reduce(0) { $0 + $1.carbs }, e.reduce(0) { $0 + $1.fat })
    }
    var avgDailyCalories: Int {
        let grouped = Dictionary(grouping: foodEntries) { Self.dayKey($0.loggedAt) }
        guard !grouped.isEmpty else { return 0 }
        let total = grouped.values.reduce(0) { $0 + $1.reduce(0) { $0 + $1.calories } }
        return total / grouped.count
    }

    // MARK: - Jarvis memory snapshot

    var jarvisMemory: JarvisMemory {
        JarvisMemory(
            lastWorkoutName: workouts.last?.name,
            lastWorkoutDate: workouts.last?.completedAt,
            totalWorkoutsAllTime: workouts.count,
            totalWorkoutsThisWeek: workoutsThisWeek,
            currentStreak: currentStreak,
            longestStreak: longestStreak,
            avgDailyCalories: avgDailyCalories,
            fatigueLevel: 0,
            consistencyScore: consistencyScore,
            chatCount: messages.filter { $0.role == .user }.count
        )
    }

    // MARK: - Actions

    func completeWorkout(program: WorkoutProgram, durationSeconds: Int, setsCompleted: Int) {
        let intensityXP = program.difficulty.rawValue * 50
        let durationXP = min(150, durationSeconds / 60 * 5)
        let earned = 100 + intensityXP + durationXP
        let calories = max(50, Int(Double(durationSeconds) / 60.0 * 8.5))

        let completed = CompletedWorkout(
            id: UUID(),
            programID: program.id,
            name: program.name,
            category: program.category,
            completedAt: Date(),
            durationSeconds: durationSeconds,
            xpEarned: earned,
            caloriesBurned: calories,
            setsCompleted: setsCompleted,
            muscleGroups: program.muscleGroups
        )
        workouts.append(completed)
        addXP(earned)
        checkBadges()
    }

    func logFood(_ item: FoodItem, meal: MealType, portion: Double) {
        let entry = FoodEntry(
            id: UUID(),
            foodID: item.id,
            name: item.name,
            mealType: meal,
            portion: portion,
            calories: Int(Double(item.calories) * portion),
            protein: item.protein * portion,
            carbs: item.carbs * portion,
            fat: item.fat * portion,
            loggedAt: Date()
        )
        foodEntries.append(entry)
        // 50 XP if all meals logged today
        let mealsToday = Set(entries(for: Date()).map { $0.mealType })
        if mealsToday.count >= 4 { addXP(50) }
        checkBadges()
    }

    func deleteFood(_ entry: FoodEntry) {
        foodEntries.removeAll { $0.id == entry.id }
    }

    func logWeight(_ weight: Double, date: Date = Date()) {
        weightEntries.append(WeightEntry(id: UUID(), weight: weight, date: date))
        weightEntries.sort { $0.date < $1.date }
        user.weight = weight
        addXP(20)
        checkBadges()
    }

    func addWater() {
        waterGlasses = min(12, waterGlasses + 1)
    }
    func removeWater() {
        waterGlasses = max(0, waterGlasses - 1)
    }

    func addXP(_ amount: Int) {
        let before = level
        xp += amount
        if level > before {
            didLevelUp = true
        }
    }

    func startTrial() {
        let now = Date()
        subscription = Subscription(
            status: .trial,
            startDate: now,
            expiryDate: Calendar.current.date(byAdding: .day, value: 30, to: now)
        )
    }

    // MARK: - Badges

    func hasBadge(_ id: String) -> Bool { earnedBadges.contains { $0.id == id } }

    private func unlock(_ id: String) {
        guard !hasBadge(id) else { return }
        earnedBadges.append(EarnedBadge(id: id, earnedAt: Date()))
        if let badge = BadgeCatalog.badge(id: id) {
            newlyUnlockedBadge = badge
        }
    }

    func checkBadges() {
        if workouts.count >= 1 { unlock("first_rep") }
        if currentStreak >= 7 { unlock("week_warrior") }
        if currentStreak >= 30 { unlock("month_beast") }
        if workouts.count >= 50 { unlock("iron_will") }
        if totalCaloriesBurned >= 5000 { unlock("calorie_crusher") }
        if workouts.contains(where: { $0.programID == "elite_physique" }) { unlock("elite_unlocked") }
        if workouts.filter({ $0.category == .cardio }).count >= 20 { unlock("cardio_king") }
        if workouts.filter({ $0.category == .strength }).count >= 20 { unlock("strength_surge") }
        if workouts.filter({ $0.category == .hiit }).count >= 10 { unlock("speed_demon") }
        if consistencyScore >= 90 { unlock("consistency_king") }
        if jarvisMemory.chatCount >= 30 { unlock("jarvis_favorite") }
        if level >= 6 { unlock("legend_status") }

        // weight drop 5kg
        if let first = weightEntries.first?.weight, let last = weightEntries.last?.weight, first - last >= 5 {
            unlock("scale_slayer")
        }
        // nutrition 14-day streak
        let loggedDays = Set(foodEntries.map { Self.dayKey($0.loggedAt) })
        if loggedDays.count >= 14 { unlock("nutrition_master") }
    }

    func loadDemoData() {
        // Pre-fill 7 workouts over past 2 weeks
        let now = Date()
        let cal = Calendar.current
        let demoNames = ["Full Body Beginner", "Cardio Blast", "Core Crusher", "Upper Body Strength", "HIIT Burn", "Home No-Equipment", "Morning Energy Boost"]
        let demoIDs = ["full_body_beginner", "cardio_blast", "core_crusher", "upper_body_strength", "hiit_burn", "home_no_equipment", "morning_energy"]
        let demoCats: [WorkoutCategory] = [.strength, .cardio, .core, .strength, .hiit, .strength, .flexibility]

        for i in 0..<7 {
            let daysAgo = (6 - i) * 2
            guard let date = cal.date(byAdding: .day, value: -daysAgo, to: now) else { continue }
            let completed = CompletedWorkout(
                id: UUID(), programID: demoIDs[i], name: demoNames[i],
                category: demoCats[i], completedAt: date, durationSeconds: 1800 + i * 120,
                xpEarned: 120 + i * 20, caloriesBurned: 200 + i * 30,
                setsCompleted: 12 + i, muscleGroups: [.fullBody]
            )
            workouts.append(completed)
        }

        // 3 days of sample nutrition
        let sampleFoods: [(String, MealType, Int)] = [
            ("Oatmeal", .breakfast, 350), ("Chicken Rice Bowl", .lunch, 650),
            ("Protein Shake", .snacks, 200), ("Scrambled Eggs Toast", .breakfast, 400),
            ("Grilled Salmon Salad", .lunch, 550), ("Greek Yogurt Parfait", .snacks, 180),
            ("Tuna Sandwich", .lunch, 450)
        ]
        for (j, (name, meal, cals)) in sampleFoods.enumerated() {
            guard let date = cal.date(byAdding: .day, value: -(j % 3 + 1), to: now) else { continue }
            foodEntries.append(FoodEntry(id: UUID(), foodID: "sample", name: name,
                mealType: meal, portion: 1, calories: cals, protein: Double(cals) * 0.08,
                carbs: Double(cals) * 0.12, fat: Double(cals) * 0.04, loggedAt: date))
        }

        // Sample weight trend
        for i in 0..<6 {
            guard let date = cal.date(byAdding: .day, value: -(i * 5), to: now) else { continue }
            weightEntries.append(WeightEntry(id: UUID(), weight: 75.0 - Double(i) * 0.4, date: date))
        }
        weightEntries.sort { $0.date < $1.date }

        addXP(800)
    }

    func resetAllData() {
        for key in Keys.all { UserDefaults.standard.removeObject(forKey: key) }
        user = .default
        settings = AppSettings()
        subscription = Subscription(status: .free, startDate: nil, expiryDate: nil)
        workouts = []
        foodEntries = []
        weightEntries = []
        earnedBadges = []
        xp = 0
        waterGlasses = 0
        coachPersonality = "motivational"
        onboardingCompleted = false
        demoMode = false
        generatedPlan = nil
        sportsSelection = SportSelection()
        messages = [JarvisMessage(id: UUID(), role: .coach,
            text: "Fresh start. I'm Jarvis — let's build your fitness story from scratch.", date: Date())]
    }

    func exportJSON() -> String {
        var dict: [String: Any] = [:]
        dict["user"] = encodeToObject(user)
        dict["workouts"] = workouts.map(encodeToObject)
        dict["nutrition"] = foodEntries.map(encodeToObject)
        dict["weight"] = weightEntries.map(encodeToObject)
        dict["xp"] = xp
        dict["badges"] = earnedBadges.map { $0.id }
        guard let data = try? JSONSerialization.data(withJSONObject: dict, options: [.prettyPrinted]),
              let str = String(data: data, encoding: .utf8) else { return "{}" }
        return str
    }

    // MARK: - Persistence helpers

    enum Keys {
        static let user = "fitneo_user"
        static let settings = "fitneo_settings"
        static let subscription = "fitneo_subscription"
        static let workouts = "fitneo_workouts"
        static let nutrition = "fitneo_nutrition"
        static let weight = "fitneo_weight"
        static let badges = "fitneo_badges"
        static let xp = "fitneo_xp"
        static let messages = "fitneo_messages"
        static let personality = "fitneo_personality"
        static let onboarding = "fitneo_onboarding"
        static let plan = "fitneo_plan"
        static let sportsSelection = "fitneo_sports"
        static let water = "fitneo_water"
        static let demoMode = "fitneo_demo"
        static let all = [user, settings, subscription, workouts, nutrition, weight, badges, xp, messages, personality, onboarding, plan, sportsSelection, water, demoMode]
    }

    private struct WaterLog: Codable, Sendable {
        let date: String
        let glasses: Int
    }

    private func save<T: Encodable>(_ value: T, key: String) {
        if let data = try? JSONEncoder().encode(value) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    private static func load<T: Decodable>(_ type: T.Type, key: String) -> T? {
        guard let data = UserDefaults.standard.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(type, from: data)
    }

    private func encodeToObject<T: Encodable>(_ value: T) -> Any {
        guard let data = try? JSONEncoder().encode(value),
              let obj = try? JSONSerialization.jsonObject(with: data) else { return [:] }
        return obj
    }

    static func dayKey(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }
}
