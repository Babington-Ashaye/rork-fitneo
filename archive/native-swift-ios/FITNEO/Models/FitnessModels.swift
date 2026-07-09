import Foundation
import SwiftUI

// MARK: - Muscle groups & categories

enum MuscleGroup: String, Codable, CaseIterable, Sendable {
    case chest, back, shoulders, arms, legs, core, cardio, fullBody = "full_body"

    var title: String {
        switch self {
        case .chest: "Chest"
        case .back: "Back"
        case .shoulders: "Shoulders"
        case .arms: "Arms"
        case .legs: "Legs"
        case .core: "Core"
        case .cardio: "Cardio"
        case .fullBody: "Full Body"
        }
    }
}

enum WorkoutCategory: String, Codable, CaseIterable, Sendable {
    case strength, hiit, cardio, core, flexibility, elite

    var title: String {
        switch self {
        case .strength: "Strength"
        case .hiit: "HIIT"
        case .cardio: "Cardio"
        case .core: "Core"
        case .flexibility: "Flexibility"
        case .elite: "Elite Physique"
        }
    }

    var icon: String {
        switch self {
        case .strength: "dumbbell.fill"
        case .hiit: "bolt.fill"
        case .cardio: "figure.run"
        case .core: "figure.core.training"
        case .flexibility: "figure.yoga"
        case .elite: "crown.fill"
        }
    }

    var tint: Color {
        switch self {
        case .strength: Theme.accent
        case .hiit: Theme.coral
        case .cardio: Color(red: 0.0, green: 0.85, blue: 0.7)
        case .core: Color(red: 0.55, green: 0.4, blue: 1.0)
        case .flexibility: Color(red: 0.3, green: 0.8, blue: 0.95)
        case .elite: Color(red: 1.0, green: 0.78, blue: 0.2)
        }
    }
}

enum Difficulty: Int, Codable, CaseIterable, Sendable, Comparable {
    case beginner = 1, intermediate = 2, advanced = 3

    static func < (lhs: Difficulty, rhs: Difficulty) -> Bool { lhs.rawValue < rhs.rawValue }

    var title: String {
        switch self {
        case .beginner: "Beginner"
        case .intermediate: "Intermediate"
        case .advanced: "Advanced"
        }
    }
}

// MARK: - Exercise

struct Exercise: Identifiable, Codable, Sendable, Hashable {
    let id: String
    let name: String
    let muscleGroup: MuscleGroup
    let difficulty: Difficulty
    let sets: Int
    let reps: String        // "12" or "30s" or "8-12"
    let restSeconds: Int
    let instructions: String
    let tips: String
}

// MARK: - Workout program

struct WorkoutProgram: Identifiable, Codable, Sendable, Hashable {
    let id: String
    let name: String
    let category: WorkoutCategory
    let difficulty: Difficulty
    let durationMinutes: Int
    let description: String
    let muscleGroups: [MuscleGroup]
    let exerciseIDs: [String]
    let isPremium: Bool

    var estimatedCalories: Int { Int(Double(durationMinutes) * 8.5) }
}

// MARK: - Completed workout (history)

struct CompletedWorkout: Identifiable, Codable, Sendable {
    let id: UUID
    let programID: String
    let name: String
    let category: WorkoutCategory
    let completedAt: Date
    let durationSeconds: Int
    let xpEarned: Int
    let caloriesBurned: Int
    let setsCompleted: Int
    let muscleGroups: [MuscleGroup]
}

// MARK: - Nutrition

enum MealType: String, Codable, CaseIterable, Sendable, Identifiable {
    case breakfast, lunch, dinner, snacks

    var id: String { rawValue }
    var title: String { rawValue.capitalized }
    var icon: String {
        switch self {
        case .breakfast: "sunrise.fill"
        case .lunch: "sun.max.fill"
        case .dinner: "moon.stars.fill"
        case .snacks: "carrot.fill"
        }
    }
}

struct FoodItem: Identifiable, Codable, Sendable, Hashable {
    let id: String
    let name: String
    let category: String
    let calories: Int       // per serving
    let protein: Double
    let carbs: Double
    let fat: Double
    let serving: String
}

struct FoodEntry: Identifiable, Codable, Sendable {
    let id: UUID
    let foodID: String
    let name: String
    let mealType: MealType
    let portion: Double      // multiplier
    let calories: Int
    let protein: Double
    let carbs: Double
    let fat: Double
    let loggedAt: Date
}

// MARK: - Weight

struct WeightEntry: Identifiable, Codable, Sendable {
    let id: UUID
    let weight: Double
    let date: Date
}

// MARK: - Gamification

struct Badge: Identifiable, Codable, Sendable, Hashable {
    let id: String
    let name: String
    let description: String
    let icon: String
}

struct EarnedBadge: Identifiable, Codable, Sendable {
    let id: String
    let earnedAt: Date
}

enum FitnessRank: Int, CaseIterable, Sendable {
    case rookie = 1, contender, athlete, beast, elite, legend, fitneoAITier

    var title: String {
        switch self {
        case .rookie: "Rookie"
        case .contender: "Contender"
        case .athlete: "Athlete"
        case .beast: "Beast"
        case .elite: "Elite"
        case .legend: "Legend"
        case .fitneoAITier: "FITNEO AI Tier"
        }
    }

    var threshold: Int {
        switch self {
        case .rookie: 0
        case .contender: 500
        case .athlete: 1200
        case .beast: 2500
        case .elite: 5000
        case .legend: 10000
        case .fitneoAITier: 20000
        }
    }

    static func rank(forXP xp: Int) -> FitnessRank {
        var result: FitnessRank = .rookie
        for rank in FitnessRank.allCases where xp >= rank.threshold {
            result = rank
        }
        return result
    }

    var next: FitnessRank? {
        FitnessRank(rawValue: rawValue + 1)
    }
}

// MARK: - Subscription

enum SubscriptionStatus: String, Codable, Sendable {
    case free, trial, active
}

struct Subscription: Codable, Sendable {
    var status: SubscriptionStatus
    var startDate: Date?
    var expiryDate: Date?

    var isPremium: Bool { status == .trial || status == .active }

    var daysRemaining: Int? {
        guard let expiry = expiryDate else { return nil }
        let days = Calendar.current.dateComponents([.day], from: Date(), to: expiry).day ?? 0
        return max(0, days)
    }
}

// MARK: - FITNEO AI

enum FitneoAIRole: String, Codable, Sendable { case user, coach }

struct FitneoAIMessage: Identifiable, Codable, Sendable {
    let id: UUID
    let role: FitneoAIRole
    let text: String
    let date: Date
}

struct FitneoAIMemory: Codable, Sendable {
    var lastWorkoutName: String?
    var lastWorkoutDate: Date?
    var totalWorkoutsAllTime: Int = 0
    var totalWorkoutsThisWeek: Int = 0
    var currentStreak: Int = 0
    var longestStreak: Int = 0
    var avgDailyCalories: Int = 0
    var fatigueLevel: Int = 0       // 0-10
    var consistencyScore: Int = 0   // 0-100
    var chatCount: Int = 0
}

// MARK: - User profile (local)

struct AppUser: Codable, Sendable {
    var name: String
    var age: Int
    var weight: Double
    var weightUnit: String      // "kg" / "lbs"
    var height: Double
    var heightUnit: String      // "cm" / "ft"
    var fitnessLevel: Difficulty
    var goals: [String]
    var equipment: [String]
    var avatarColorHex: String
    var calorieGoal: Int
    var weeklyWorkoutGoal: Int

    static let goalOptions = ["Lose Weight", "Build Muscle", "Improve Endurance", "Stay Active", "Athletic Performance", "Flexibility"]
    static let equipmentOptions = ["No Equipment", "Dumbbells", "Barbell", "Pull-up Bar", "Resistance Bands", "Full Gym", "Cables", "Machines"]
    static let avatarColors = ["#00f5a0", "#0A84FF", "#FF6B35", "#7c3aed", "#f59e0b", "#ef4444", "#22d3ee", "#ec4899"]

    static let `default` = AppUser(
        name: "Athlete",
        age: 25,
        weight: 70,
        weightUnit: "kg",
        height: 175,
        heightUnit: "cm",
        fitnessLevel: .beginner,
        goals: ["Build Muscle"],
        equipment: ["No Equipment"],
        avatarColorHex: "#00f5a0",
        calorieGoal: 2200,
        weeklyWorkoutGoal: 4
    )
}

// MARK: - Settings

struct AppSettings: Codable, Sendable {
    var workoutReminders: Bool = true
    var streakAlerts: Bool = true
    var fitneoAICheckIn: Bool = true
    var challengeNotifications: Bool = true
    var leaderboardUpdates: Bool = false
    var voiceMode: Bool = false
    var fitneoAIAutoSpeak: Bool = false
}

// MARK: - Color hex helper

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
