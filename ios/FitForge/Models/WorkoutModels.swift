import Foundation

struct Exercise: Identifiable, Codable, Hashable, Sendable {
    let id: UUID
    let name: String
    let category: ExerciseCategory
    let targetArea: OnboardingData.TargetArea
    let equipment: EquipmentType
    let sets: Int
    let reps: Int?
    let duration: Int? // seconds, for timed exercises
    let restSeconds: Int
    let instructions: String
    let isPremium: Bool
    let difficulty: OnboardingData.FitnessLevel
    let imageURL: String?

    enum ExerciseCategory: String, Codable, CaseIterable, Sendable {
        case strength = "strength"
        case cardio = "cardio"
        case flexibility = "flexibility"
        case hiit = "hiit"
        case yoga = "yoga"
    }

    enum EquipmentType: String, Codable, CaseIterable, Sendable {
        case none = "none"
        case dumbbell = "dumbbell"
        case barbell = "barbell"
        case machine = "machine"
        case bodyweight = "bodyweight"
        case mat = "mat"
        case resistanceBand = "resistance_band"

        var displayName: String {
            switch self {
            case .none: return "No Equipment"
            case .dumbbell: return "Dumbbells"
            case .barbell: return "Barbell"
            case .machine: return "Machine"
            case .bodyweight: return "Bodyweight"
            case .mat: return "Yoga Mat"
            case .resistanceBand: return "Resistance Band"
            }
        }
    }

    var displaySetsReps: String {
        if let reps = reps {
            return "\(sets) sets x \(reps) reps"
        } else if let duration = duration {
            return "\(sets) sets x \(duration)s"
        }
        return "\(sets) sets"
    }
}

struct WorkoutPlan: Identifiable, Codable, Sendable {
    let id: UUID
    let userId: UUID
    let date: Date
    let title: String
    let subtitle: String
    let exercises: [Exercise]
    let totalDuration: Int // minutes
    let difficulty: OnboardingData.FitnessLevel
    let category: WorkoutCategory
    let isPremium: Bool
    var isCompleted: Bool
    var completedAt: Date?

    enum WorkoutCategory: String, Codable, CaseIterable, Sendable {
        case home = "home"
        case gym = "gym"
        case yoga = "yoga"
        case hiit = "hiit"
        case strength = "strength"
        case cardio = "cardio"

        var displayName: String {
            switch self {
            case .home: return "Home"
            case .gym: return "Gym"
            case .yoga: return "Yoga"
            case .hiit: return "HIIT"
            case .strength: return "Strength"
            case .cardio: return "Cardio"
            }
        }
    }

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case date
        case title
        case subtitle
        case exercises
        case totalDuration = "total_duration"
        case difficulty
        case category
        case isPremium = "is_premium"
        case isCompleted = "is_completed"
        case completedAt = "completed_at"
    }
}

struct WorkoutHistory: Identifiable, Codable, Sendable {
    let id: UUID
    let userId: UUID
    let workoutId: UUID
    let workoutTitle: String
    let completedAt: Date
    let durationMinutes: Int
    let exercisesCompleted: Int
    let totalExercises: Int

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case workoutId = "workout_id"
        case workoutTitle = "workout_title"
        case completedAt = "completed_at"
        case durationMinutes = "duration_minutes"
        case exercisesCompleted = "exercises_completed"
        case totalExercises = "total_exercises"
    }
}

struct WorkoutStats: Codable, Sendable {
    let totalWorkouts: Int
    let currentStreak: Int
    let longestStreak: Int
    let totalMinutes: Int
    let thisWeekWorkouts: Int
    let thisWeekMinutes: Int

    enum CodingKeys: String, CodingKey {
        case totalWorkouts = "total_workouts"
        case currentStreak = "current_streak"
        case longestStreak = "longest_streak"
        case totalMinutes = "total_minutes"
        case thisWeekWorkouts = "this_week_workouts"
        case thisWeekMinutes = "this_week_minutes"
    }
}
