import Foundation

struct UserProfile: Identifiable, Codable, Sendable {
    let id: UUID
    var email: String
    var displayName: String?
    var onboardingCompleted: Bool
    var createdAt: Date
    var subscriptionStatus: SubscriptionStatus

    enum SubscriptionStatus: String, Codable, Sendable {
        case free = "free"
        case premium = "premium"
        case premiumMonthly = "premium_monthly"
        case premiumYearly = "premium_yearly"
    }

    enum CodingKeys: String, CodingKey {
        case id
        case email
        case displayName = "display_name"
        case onboardingCompleted = "onboarding_completed"
        case createdAt = "created_at"
        case subscriptionStatus = "subscription_status"
    }
}

struct OnboardingData: Codable, Sendable {
    var age: Int
    var gender: String?
    var fitnessGoal: FitnessGoal
    var fitnessLevel: FitnessLevel
    var workoutPreference: WorkoutPreference
    var workoutDuration: WorkoutDuration
    var daysPerWeek: Int
    var targetAreas: [TargetArea]

    enum FitnessGoal: String, Codable, CaseIterable, Sendable {
        case loseWeight = "lose_weight"
        case buildMuscle = "build_muscle"
        case maintainFitness = "maintain_fitness"
        case improveEndurance = "improve_endurance"

        var displayName: String {
            switch self {
            case .loseWeight: return "Lose Weight"
            case .buildMuscle: return "Build Muscle"
            case .maintainFitness: return "Maintain Fitness"
            case .improveEndurance: return "Improve Endurance"
            }
        }
    }

    enum FitnessLevel: String, Codable, CaseIterable, Sendable {
        case beginner = "beginner"
        case intermediate = "intermediate"
        case advanced = "advanced"

        var displayName: String {
            switch self {
            case .beginner: return "Beginner"
            case .intermediate: return "Intermediate"
            case .advanced: return "Advanced"
            }
        }
    }

    enum WorkoutPreference: String, Codable, CaseIterable, Sendable {
        case noEquipment = "no_equipment"
        case gym = "gym"
        case yoga = "yoga"
        case mixed = "mixed"

        var displayName: String {
            switch self {
            case .noEquipment: return "No Equipment"
            case .gym: return "Gym Equipment"
            case .yoga: return "Yoga"
            case .mixed: return "Mixed"
            }
        }
    }

    enum WorkoutDuration: String, Codable, CaseIterable, Sendable {
        case fifteen = "15"
        case thirty = "30"
        case fortyFive = "45"
        case sixtyPlus = "60"

        var displayName: String {
            switch self {
            case .fifteen: return "15 min"
            case .thirty: return "30 min"
            case .fortyFive: return "45 min"
            case .sixtyPlus: return "60+ min"
            }
        }

        var minutes: Int {
            switch self {
            case .fifteen: return 15
            case .thirty: return 30
            case .fortyFive: return 45
            case .sixtyPlus: return 60
            }
        }
    }

    enum TargetArea: String, Codable, CaseIterable, Sendable {
        case abs = "abs"
        case arms = "arms"
        case legs = "legs"
        case back = "back"
        case chest = "chest"
        case shoulders = "shoulders"
        case fullBody = "full_body"
        case cardio = "cardio"

        var displayName: String {
            switch self {
            case .abs: return "Abs"
            case .arms: return "Arms"
            case .legs: return "Legs"
            case .back: return "Back"
            case .chest: return "Chest"
            case .shoulders: return "Shoulders"
            case .fullBody: return "Full Body"
            case .cardio: return "Cardio"
            }
        }
    }

    enum CodingKeys: String, CodingKey {
        case age
        case gender
        case fitnessGoal = "fitness_goal"
        case fitnessLevel = "fitness_level"
        case workoutPreference = "workout_preference"
        case workoutDuration = "workout_duration"
        case daysPerWeek = "days_per_week"
        case targetAreas = "target_areas"
    }
}
