import Foundation

struct UserProfile: Identifiable, Codable, Sendable {
    let id: UUID
    var email: String
    var displayName: String?
    var onboardingCompleted: Bool
    var createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case email
        case displayName = "display_name"
        case onboardingCompleted = "onboarding_completed"
        case createdAt = "created_at"
    }
}

// MARK: - Onboarding answers

struct OnboardingData: Codable, Sendable, Equatable {
    var goal: Goal?
    var fitnessLevel: FitnessLevel?
    var equipment: Equipment?
    var focusAreas: [FocusArea] = []
    var sessionLength: SessionLength?
    var weight: Double = 70
    var weightUnit: WeightUnit = .kg
    var height: Double = 175
    var heightUnit: HeightUnit = .cm
    var dietType: DietType?
    var coachPersonality: CoachPersonality?
    var workoutTime: WorkoutTime?
    var sleepQuality: SleepQuality?
    var activityLevel: ActivityLevel?
    var targetPhysique: TargetPhysique?
    var motivationStyles: [MotivationStyle] = []
    var language: AppLanguage = .english
    var theme: AppTheme = .dark
    // New onboarding additions
    var workoutDuration: WorkoutDuration?
    var trainingDaysPerWeek: Int?
    var trainingStyles: [TrainingStyle] = []
    var movementExperience: MovementExperience = MovementExperience()
    var recoveryQuality: RecoveryQuality?
    // Extended onboarding additions
    var biggestChallenge: BiggestChallenge?
    var trainingExperience: [TrainingProgramExperience] = []
    var injuries: [InjuryType] = []
    var bodyMeasurements: BodyMeasurements?
    var pastObstacles: [StoppingObstacle] = []

    enum Goal: String, Codable, CaseIterable, Sendable {
        case loseFat = "lose_fat"
        case buildMuscle = "build_muscle"
        case athleticPerformance = "athletic_performance"
        case maintainTone = "maintain_tone"

        var title: String {
            switch self {
            case .loseFat: "Lose Fat"
            case .buildMuscle: "Build Muscle"
            case .athleticPerformance: "Athletic Performance"
            case .maintainTone: "Maintain & Tone"
            }
        }
        var icon: String {
            switch self {
            case .loseFat: "flame.fill"
            case .buildMuscle: "figure.strengthtraining.traditional"
            case .athleticPerformance: "bolt.fill"
            case .maintainTone: "heart.fill"
            }
        }
    }

    enum FitnessLevel: String, Codable, CaseIterable, Sendable {
        case beginner, someExperience = "some_experience", intermediate, advanced, elite
        var title: String {
            switch self {
            case .beginner: "Complete Beginner"
            case .someExperience: "Some Experience"
            case .intermediate: "Intermediate"
            case .advanced: "Advanced"
            case .elite: "Elite"
            }
        }
        var subtitle: String {
            switch self {
            case .beginner: "Just getting started"
            case .someExperience: "I've worked out before"
            case .intermediate: "Consistent for 6+ months"
            case .advanced: "Several years of training"
            case .elite: "Competitive athlete"
            }
        }
    }

    enum Equipment: String, Codable, CaseIterable, Sendable {
        case none = "no_equipment"
        case dumbbells = "dumbbells_home"
        case fullGym = "full_gym"
        case yoga = "yoga_stretching"
        var title: String {
            switch self {
            case .none: "No Equipment"
            case .dumbbells: "Dumbbells at Home"
            case .fullGym: "Full Gym"
            case .yoga: "Yoga & Stretching"
            }
        }
        var icon: String {
            switch self {
            case .none: "figure.run"
            case .dumbbells: "dumbbell.fill"
            case .fullGym: "figure.strengthtraining.traditional"
            case .yoga: "figure.yoga"
            }
        }
    }

    enum FocusArea: String, Codable, CaseIterable, Sendable {
        case absCore = "abs_core", chest, back, arms, legs, fullBody = "full_body"
        var title: String {
            switch self {
            case .absCore: "Abs & Core"
            case .chest: "Chest"
            case .back: "Back"
            case .arms: "Arms"
            case .legs: "Legs"
            case .fullBody: "Full Body"
            }
        }
        var icon: String {
            switch self {
            case .absCore: "figure.core.training"
            case .chest: "figure.arms.open"
            case .back: "figure.walk"
            case .arms: "dumbbell"
            case .legs: "figure.run"
            case .fullBody: "figure.mixed.cardio"
            }
        }
    }

    enum SessionLength: String, Codable, CaseIterable, Sendable {
        case fifteen = "15", thirty = "30", fortyFive = "45", sixtyPlus = "60+"
        var title: String { "\(rawValue) min" }
    }

    enum WeightUnit: String, Codable, CaseIterable, Sendable { case kg, lbs }
    enum HeightUnit: String, Codable, CaseIterable, Sendable { case cm, ft }

    enum DietType: String, Codable, CaseIterable, Sendable {
        case standard, vegetarian, vegan, keto, highProtein = "high_protein", mediterranean
        var title: String {
            switch self {
            case .standard: "Standard"
            case .vegetarian: "Vegetarian"
            case .vegan: "Vegan"
            case .keto: "Keto"
            case .highProtein: "High Protein"
            case .mediterranean: "Mediterranean"
            }
        }
        var icon: String {
            switch self {
            case .standard: "fork.knife"
            case .vegetarian: "leaf.fill"
            case .vegan: "leaf.circle.fill"
            case .keto: "flame.fill"
            case .highProtein: "fish.fill"
            case .mediterranean: "sun.max.fill"
            }
        }
    }

    enum CoachPersonality: String, Codable, CaseIterable, Sendable {
        case supportive, motivational, drillSergeant = "drill_sergeant"
        var title: String {
            switch self {
            case .supportive: "Supportive"
            case .motivational: "Motivational"
            case .drillSergeant: "Drill Sergeant"
            }
        }
        var subtitle: String {
            switch self {
            case .supportive: "Encouragement and positivity"
            case .motivational: "High energy, push harder"
            case .drillSergeant: "Tough love, no excuses"
            }
        }
    }

    enum WorkoutTime: String, Codable, CaseIterable, Sendable {
        case earlyMorning = "early_morning", morning, afternoon, evening, flexible
        var title: String {
            switch self {
            case .earlyMorning: "Early Morning"
            case .morning: "Morning"
            case .afternoon: "Afternoon"
            case .evening: "Evening"
            case .flexible: "Flexible"
            }
        }
        var subtitle: String {
            switch self {
            case .earlyMorning: "5 – 8 am"
            case .morning: "8 – 11 am"
            case .afternoon: "12 – 4 pm"
            case .evening: "5 – 9 pm"
            case .flexible: "Anytime"
            }
        }
    }

    enum SleepQuality: String, Codable, CaseIterable, Sendable {
        case excellent, good, average, poor
        var title: String {
            switch self {
            case .excellent: "Excellent"
            case .good: "Good"
            case .average: "Average"
            case .poor: "Poor"
            }
        }
        var subtitle: String {
            switch self {
            case .excellent: "7 – 9 hours"
            case .good: "6 – 7 hours"
            case .average: "5 – 6 hours"
            case .poor: "Under 5 hours"
            }
        }
    }

    enum ActivityLevel: String, Codable, CaseIterable, Sendable {
        case sedentary, lightlyActive = "lightly_active", moderatelyActive = "moderately_active", veryActive = "very_active", athlete
        var title: String {
            switch self {
            case .sedentary: "Sedentary"
            case .lightlyActive: "Lightly Active"
            case .moderatelyActive: "Moderately Active"
            case .veryActive: "Very Active"
            case .athlete: "Athlete"
            }
        }
        var subtitle: String {
            switch self {
            case .sedentary: "Desk job, little movement"
            case .lightlyActive: "Walks, light hobbies"
            case .moderatelyActive: "On feet most of the day"
            case .veryActive: "Manual labor or sport"
            case .athlete: "Daily intense training"
            }
        }
    }

    enum TargetPhysique: String, Codable, CaseIterable, Sendable {
        case leanToned = "lean_toned", athleticStrong = "athletic_strong", bulkedMuscular = "bulked_muscular", healthyBalanced = "healthy_balanced"
        var title: String {
            switch self {
            case .leanToned: "Lean & Toned"
            case .athleticStrong: "Athletic & Strong"
            case .bulkedMuscular: "Bulked & Muscular"
            case .healthyBalanced: "Healthy & Balanced"
            }
        }
    }

    enum MotivationStyle: String, Codable, CaseIterable, Sendable {
        case trackingProgress = "tracking_progress", competition, accountability, lookingGood = "looking_good", feelingStrong = "feeling_strong", healthGoals = "health_goals"
        var title: String {
            switch self {
            case .trackingProgress: "Tracking Progress"
            case .competition: "Competition"
            case .accountability: "Accountability"
            case .lookingGood: "Looking Good"
            case .feelingStrong: "Feeling Strong"
            case .healthGoals: "Health Goals"
            }
        }
        var icon: String {
            switch self {
            case .trackingProgress: "chart.line.uptrend.xyaxis"
            case .competition: "trophy.fill"
            case .accountability: "person.2.fill"
            case .lookingGood: "sparkles"
            case .feelingStrong: "bolt.heart.fill"
            case .healthGoals: "heart.text.square.fill"
            }
        }
    }

    enum AppLanguage: String, Codable, CaseIterable, Sendable {
        case english, spanish, french, portuguese, arabic, hindi, chinese, japanese, german, russian
        var title: String { rawValue.capitalized }
        var flag: String {
            switch self {
            case .english: "🇬🇧"
            case .spanish: "🇪🇸"
            case .french: "🇫🇷"
            case .portuguese: "🇵🇹"
            case .arabic: "🇸🇦"
            case .hindi: "🇮🇳"
            case .chinese: "🇨🇳"
            case .japanese: "🇯🇵"
            case .german: "🇩🇪"
            case .russian: "🇷🇺"
            }
        }
    }

    enum AppTheme: String, Codable, CaseIterable, Sendable {
        case dark, light, system
        var title: String {
            switch self {
            case .dark: "Dark Mode"
            case .light: "Light Mode"
            case .system: "System Default"
            }
        }
        var subtitle: String {
            switch self {
            case .dark: "Recommended"
            case .light: "Bright and clean"
            case .system: "Match your phone"
            }
        }
        var icon: String {
            switch self {
            case .dark: "moon.fill"
            case .light: "sun.max.fill"
            case .system: "circle.lefthalf.filled"
            }
        }
    }

    // MARK: - New onboarding enums

    enum WorkoutDuration: String, Codable, CaseIterable, Sendable {
        case fifteenToTwenty = "15-20"
        case twentyToThirty = "20-30"
        case thirtyToFortyFive = "30-45"
        case fortyFiveToSixty = "45-60"
        case sixtyPlus = "60+"
        var title: String {
            switch self {
            case .fifteenToTwenty: "15 to 20 minutes"
            case .twentyToThirty: "20 to 30 minutes"
            case .thirtyToFortyFive: "30 to 45 minutes"
            case .fortyFiveToSixty: "45 to 60 minutes"
            case .sixtyPlus: "60 minutes or more"
            }
        }
    }

    enum TrainingStyle: String, Codable, CaseIterable, Sendable {
        case strength = "strength_training"
        case hiit
        case cardio
        case coreAbs = "core_abs"
        case flexibility = "flexibility_mobility"
        case mixed = "mixed_balanced"
        var title: String {
            switch self {
            case .strength: "Strength Training"
            case .hiit: "HIIT"
            case .cardio: "Cardio"
            case .coreAbs: "Core and Abs"
            case .flexibility: "Flexibility and Mobility"
            case .mixed: "Mixed and Balanced"
            }
        }
        var icon: String {
            switch self {
            case .strength: "dumbbell.fill"
            case .hiit: "bolt.fill"
            case .cardio: "figure.run"
            case .coreAbs: "figure.core.training"
            case .flexibility: "figure.yoga"
            case .mixed: "figure.mixed.cardio"
            }
        }
    }

    struct MovementExperience: Codable, Sendable, Equatable {
        var barbellDeadlift: Bool = false
        var pullUps: Bool = false
        var overheadPress: Bool = false
        var bulgarianSplitSquat: Bool = false
        var boxJumps: Bool = false

        static let movements: [(key: WritableKeyPath<MovementExperience, Bool>, name: String, icon: String)] = [
            (\.barbellDeadlift, "Barbell Deadlift", "figure.strengthtraining.traditional"),
            (\.pullUps, "Pull-ups", "figure.pullup"),
            (\.overheadPress, "Overhead Press", "figure.strengthtraining.traditional"),
            (\.bulgarianSplitSquat, "Bulgarian Split Squat", "figure.cross.training"),
            (\.boxJumps, "Box Jumps", "figure.jump.rope")
        ]
    }

    enum RecoveryQuality: String, Codable, CaseIterable, Sendable {
        case excellent = "excellent_recovery"
        case average = "average_recovery"
        case tired = "often_tired"
        case injured = "recovering_injury"
        var title: String {
            switch self {
            case .excellent: "I sleep well and recover fast"
            case .average: "Average sleep and recovery"
            case .tired: "I often feel tired or sore"
            case .injured: "I am recovering from an injury"
            }
        }
        var subtitle: String {
            switch self {
            case .excellent: "7+ hours, feel fresh daily"
            case .average: "6-7 hours, moderate energy"
            case .tired: "Under 6 hours or frequent fatigue"
            case .injured: "Working through or rehabbing"
            }
        }
    }

    enum BiggestChallenge: String, Codable, CaseIterable, Sendable {
        case consistency = "staying_consistent"
        case dontKnowHow = "dont_know_how"
        case lackOfTime = "lack_of_time"
        case lowEnergy = "low_energy"
        case diet = "diet_nutrition"
        case recovery = "recovering_properly"
        case injury = "previous_injury"
        var title: String {
            switch self {
            case .consistency: "Staying consistent and not skipping sessions"
            case .dontKnowHow: "Not knowing what to do or how to train"
            case .lackOfTime: "Lack of time"
            case .lowEnergy: "Low energy or motivation"
            case .diet: "Diet and nutrition"
            case .recovery: "Recovering properly between sessions"
            case .injury: "Previous injury or physical limitation"
            }
        }
    }

    enum TrainingProgramExperience: String, Codable, CaseIterable, Sendable {
        case pushPullLegs = "push_pull_legs"
        case upperLower = "upper_lower_split"
        case fullBody = "full_body_training"
        case hiit = "hiit_programs"
        case strength = "strength_powerlifting"
        case bodybuilding = "bodybuilding_hypertrophy"
        case none = "none_of_above"
        var title: String {
            switch self {
            case .pushPullLegs: "Push Pull Legs"
            case .upperLower: "Upper Lower Split"
            case .fullBody: "Full Body Training"
            case .hiit: "HIIT Programs"
            case .strength: "Strength and Powerlifting Focus"
            case .bodybuilding: "Bodybuilding and Hypertrophy Focus"
            case .none: "None of the above"
            }
        }
        var icon: String {
            switch self {
            case .pushPullLegs: "arrow.triangle.branch"
            case .upperLower: "arrow.up.arrow.down"
            case .fullBody: "figure.mixed.cardio"
            case .hiit: "bolt.fill"
            case .strength: "figure.strengthtraining.traditional"
            case .bodybuilding: "figure.arms.open"
            case .none: "circle.slash"
            }
        }
    }

    enum InjuryType: String, Codable, CaseIterable, Sendable {
        case none = "no_injuries"
        case lowerBack = "lower_back"
        case knees = "knee_pain"
        case shoulders = "shoulder_pain"
        case hips = "hip_pain"
        case wrists = "wrist_pain"
        case surgery = "recent_surgery"
        case other = "other_describe"
        var title: String {
            switch self {
            case .none: "No injuries or limitations"
            case .lowerBack: "Lower back pain or sensitivity"
            case .knees: "Knee pain or injury"
            case .shoulders: "Shoulder pain or injury"
            case .hips: "Hip pain or tightness"
            case .wrists: "Wrist pain or injury"
            case .surgery: "Recent surgery or rehabilitation"
            case .other: "Other — I will describe it to FITNEO AI in chat"
            }
        }
    }

    struct BodyMeasurements: Codable, Sendable, Equatable {
        var chest: Double?
        var waist: Double?
        var hips: Double?
        var arms: Double?
        var thighs: Double?
        var unit: MeasurementUnit = .cm

        enum MeasurementUnit: String, Codable, CaseIterable, Sendable {
            case cm, inches
            var title: String { rawValue.capitalized }
        }
    }

    enum StoppingObstacle: String, Codable, CaseIterable, Sendable {
        case firstAttempt = "first_attempt"
        case consistency = "lack_consistency"
        case noPlan = "no_clear_plan"
        case injuries = "injuries_setbacks"
        case nutrition = "poor_nutrition"
        case time = "lack_of_time"
        case motivation = "low_motivation"
        case wrongLevel = "too_hard_or_easy"
        var title: String {
            switch self {
            case .firstAttempt: "Nothing — this is my first serious attempt"
            case .consistency: "Lack of consistency"
            case .noPlan: "No clear plan or direction"
            case .injuries: "Injuries or physical setbacks"
            case .nutrition: "Poor nutrition habits"
            case .time: "Lack of time"
            case .motivation: "Low motivation or mental barriers"
            case .wrongLevel: "Previous programs were too hard or too easy"
            }
        }
    }
}
