import Foundation

final class WorkoutGenerator {
    static let shared = WorkoutGenerator()

    private init() {}

    // MARK: - Exercise Database

    private let exerciseDatabase: [Exercise] = [
        // No Equipment - Beginner
        Exercise(id: UUID(), name: "Push-ups", category: .strength, targetArea: .chest, equipment: .bodyweight, sets: 3, reps: 10, duration: nil, restSeconds: 60, instructions: "Start in plank position. Lower chest to floor, push back up. Keep core tight.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Bodyweight Squats", category: .strength, targetArea: .legs, equipment: .bodyweight, sets: 3, reps: 15, duration: nil, restSeconds: 60, instructions: "Feet shoulder-width apart. Lower hips back and down. Keep chest up.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Plank", category: .strength, targetArea: .abs, equipment: .none, sets: 3, reps: nil, duration: 30, restSeconds: 45, instructions: "Hold plank position on forearms. Keep body straight from head to heels.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Lunges", category: .strength, targetArea: .legs, equipment: .bodyweight, sets: 3, reps: 12, duration: nil, restSeconds: 60, instructions: "Step forward, lower back knee toward floor. Push back to starting position.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Mountain Climbers", category: .cardio, targetArea: .fullBody, equipment: .none, sets: 3, reps: nil, duration: 30, restSeconds: 30, instructions: "In plank position, alternate bringing knees to chest rapidly.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Glute Bridges", category: .strength, targetArea: .legs, equipment: .bodyweight, sets: 3, reps: 15, duration: nil, restSeconds: 45, instructions: "Lie on back, knees bent. Lift hips off floor, squeeze glutes at top.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Bird Dog", category: .strength, targetArea: .back, equipment: .none, sets: 3, reps: 10, duration: nil, restSeconds: 45, instructions: "On hands and knees, extend opposite arm and leg. Hold, then switch.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Wall Sit", category: .strength, targetArea: .legs, equipment: .none, sets: 3, reps: nil, duration: 30, restSeconds: 30, instructions: "Slide back down wall until thighs are parallel to floor. Hold position.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Arm Circles", category: .strength, targetArea: .arms, equipment: .none, sets: 2, reps: nil, duration: 30, restSeconds: 15, instructions: "Extend arms to sides. Make small circles forward, then backward.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Calf Raises", category: .strength, targetArea: .legs, equipment: .bodyweight, sets: 3, reps: 20, duration: nil, restSeconds: 30, instructions: "Stand on balls of feet. Rise up on toes, lower slowly.", isPremium: false, difficulty: .beginner, imageURL: nil),

        // No Equipment - Intermediate
        Exercise(id: UUID(), name: "Diamond Push-ups", category: .strength, targetArea: .chest, equipment: .bodyweight, sets: 3, reps: 12, duration: nil, restSeconds: 60, instructions: "Hands form diamond shape. Lower chest to hands, push back up.", isPremium: false, difficulty: .intermediate, imageURL: nil),
        Exercise(id: UUID(), name: "Jump Squats", category: .strength, targetArea: .legs, equipment: .bodyweight, sets: 3, reps: 15, duration: nil, restSeconds: 60, instructions: "Squat down, then explode up into a jump. Land softly.", isPremium: false, difficulty: .intermediate, imageURL: nil),
        Exercise(id: UUID(), name: "Side Plank", category: .strength, targetArea: .abs, equipment: .none, sets: 3, reps: nil, duration: 30, restSeconds: 45, instructions: "Lie on side, prop up on forearm. Lift hips off floor, hold.", isPremium: false, difficulty: .intermediate, imageURL: nil),
        Exercise(id: UUID(), name: "Burpees", category: .hiit, targetArea: .fullBody, equipment: .none, sets: 3, reps: 10, duration: nil, restSeconds: 60, instructions: "Squat, kick feet back to plank, push-up, jump feet in, jump up.", isPremium: false, difficulty: .intermediate, imageURL: nil),
        Exercise(id: UUID(), name: "Pike Push-ups", category: .strength, targetArea: .shoulders, equipment: .bodyweight, sets: 3, reps: 10, duration: nil, restSeconds: 60, instructions: "Hips high in downward dog position. Lower head toward floor, push up.", isPremium: false, difficulty: .intermediate, imageURL: nil),
        Exercise(id: UUID(), name: "Single Leg Glute Bridge", category: .strength, targetArea: .legs, equipment: .bodyweight, sets: 3, reps: 12, duration: nil, restSeconds: 45, instructions: "One leg extended. Lift hips using single leg. Switch sides.", isPremium: false, difficulty: .intermediate, imageURL: nil),
        Exercise(id: UUID(), name: "Tricep Dips", category: .strength, targetArea: .arms, equipment: .bodyweight, sets: 3, reps: 15, duration: nil, restSeconds: 45, instructions: "Use chair or bench. Lower body by bending elbows, push back up.", isPremium: false, difficulty: .intermediate, imageURL: nil),
        Exercise(id: UUID(), name: "High Knees", category: .cardio, targetArea: .cardio, equipment: .none, sets: 3, reps: nil, duration: 45, restSeconds: 30, instructions: "Run in place bringing knees up to waist level.", isPremium: false, difficulty: .intermediate, imageURL: nil),

        // No Equipment - Advanced
        Exercise(id: UUID(), name: "Archer Push-ups", category: .strength, targetArea: .chest, equipment: .bodyweight, sets: 3, reps: 8, duration: nil, restSeconds: 60, instructions: "Extend one arm to side while lowering. Alternate arms each rep.", isPremium: true, difficulty: .advanced, imageURL: nil),
        Exercise(id: UUID(), name: "Pistol Squats", category: .strength, targetArea: .legs, equipment: .bodyweight, sets: 3, reps: 6, duration: nil, restSeconds: 60, instructions: "Single leg squat. Lower on one leg, push back up. Switch sides.", isPremium: true, difficulty: .advanced, imageURL: nil),
        Exercise(id: UUID(), name: "L-sit", category: .strength, targetArea: .abs, equipment: .none, sets: 3, reps: nil, duration: 20, restSeconds: 45, instructions: "Sit on floor, press hands down, lift legs straight out. Hold.", isPremium: true, difficulty: .advanced, imageURL: nil),
        Exercise(id: UUID(), name: "Muscle-ups", category: .strength, targetArea: .fullBody, equipment: .bodyweight, sets: 3, reps: 5, duration: nil, restSeconds: 90, instructions: "Explosive pull-up transitioning into dip. Requires bar.", isPremium: true, difficulty: .advanced, imageURL: nil),

        // Gym Equipment - Beginner
        Exercise(id: UUID(), name: "Dumbbell Bench Press", category: .strength, targetArea: .chest, equipment: .dumbbell, sets: 3, reps: 12, duration: nil, restSeconds: 60, instructions: "Lie on bench. Press dumbbells up, lower with control.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Dumbbell Rows", category: .strength, targetArea: .back, equipment: .dumbbell, sets: 3, reps: 12, duration: nil, restSeconds: 60, instructions: "Hinge at hips, pull dumbbell to hip. Keep back flat.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Goblet Squats", category: .strength, targetArea: .legs, equipment: .dumbbell, sets: 3, reps: 12, duration: nil, restSeconds: 60, instructions: "Hold dumbbell at chest. Squat down, keep chest up.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Dumbbell Shoulder Press", category: .strength, targetArea: .shoulders, equipment: .dumbbell, sets: 3, reps: 12, duration: nil, restSeconds: 60, instructions: "Press dumbbells overhead, lower with control.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Dumbbell Curls", category: .strength, targetArea: .arms, equipment: .dumbbell, sets: 3, reps: 12, duration: nil, restSeconds: 45, instructions: "Curl dumbbells up, squeeze biceps at top. Lower slowly.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Lat Pulldown", category: .strength, targetArea: .back, equipment: .machine, sets: 3, reps: 12, duration: nil, restSeconds: 60, instructions: "Pull bar down to upper chest. Squeeze shoulder blades.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Leg Press", category: .strength, targetArea: .legs, equipment: .machine, sets: 3, reps: 15, duration: nil, restSeconds: 60, instructions: "Place feet shoulder-width on platform. Lower weight, push back up.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Cable Tricep Pushdown", category: .strength, targetArea: .arms, equipment: .machine, sets: 3, reps: 15, duration: nil, restSeconds: 45, instructions: "Push cable down until arms are fully extended. Control return.", isPremium: false, difficulty: .beginner, imageURL: nil),

        // Gym Equipment - Intermediate
        Exercise(id: UUID(), name: "Barbell Squats", category: .strength, targetArea: .legs, equipment: .barbell, sets: 4, reps: 8, duration: nil, restSeconds: 90, instructions: "Bar on upper back. Squat down, drive through heels to stand.", isPremium: false, difficulty: .intermediate, imageURL: nil),
        Exercise(id: UUID(), name: "Barbell Deadlifts", category: .strength, targetArea: .back, equipment: .barbell, sets: 3, reps: 8, duration: nil, restSeconds: 90, instructions: "Hinge at hips, grip bar. Stand up straight, hips forward.", isPremium: false, difficulty: .intermediate, imageURL: nil),
        Exercise(id: UUID(), name: "Barbell Bench Press", category: .strength, targetArea: .chest, equipment: .barbell, sets: 4, reps: 8, duration: nil, restSeconds: 90, instructions: "Lower bar to chest, press up explosively.", isPremium: false, difficulty: .intermediate, imageURL: nil),
        Exercise(id: UUID(), name: "Pull-ups", category: .strength, targetArea: .back, equipment: .bodyweight, sets: 3, reps: 8, duration: nil, restSeconds: 90, instructions: "Hang from bar, pull chin over bar. Lower with control.", isPremium: false, difficulty: .intermediate, imageURL: nil),
        Exercise(id: UUID(), name: "Overhead Press", category: .strength, targetArea: .shoulders, equipment: .barbell, sets: 3, reps: 10, duration: nil, restSeconds: 60, instructions: "Press bar from shoulders to overhead. Keep core tight.", isPremium: false, difficulty: .intermediate, imageURL: nil),
        Exercise(id: UUID(), name: "Romanian Deadlifts", category: .strength, targetArea: .legs, equipment: .barbell, sets: 3, reps: 10, duration: nil, restSeconds: 60, instructions: "Hinge at hips, lower bar along legs. Feel hamstring stretch.", isPremium: false, difficulty: .intermediate, imageURL: nil),
        Exercise(id: UUID(), name: "Incline Dumbbell Press", category: .strength, targetArea: .chest, equipment: .dumbbell, sets: 3, reps: 10, duration: nil, restSeconds: 60, instructions: "On incline bench, press dumbbells up. Targets upper chest.", isPremium: false, difficulty: .intermediate, imageURL: nil),
        Exercise(id: UUID(), name: "Cable Rows", category: .strength, targetArea: .back, equipment: .machine, sets: 3, reps: 12, duration: nil, restSeconds: 60, instructions: "Pull handles to torso, squeeze shoulder blades together.", isPremium: false, difficulty: .intermediate, imageURL: nil),

        // Gym Equipment - Advanced
        Exercise(id: UUID(), name: "Clean and Press", category: .strength, targetArea: .fullBody, equipment: .barbell, sets: 4, reps: 6, duration: nil, restSeconds: 120, instructions: "Explosively pull bar to shoulders, then press overhead.", isPremium: true, difficulty: .advanced, imageURL: nil),
        Exercise(id: UUID(), name: "Front Squats", category: .strength, targetArea: .legs, equipment: .barbell, sets: 4, reps: 6, duration: nil, restSeconds: 120, instructions: "Bar across front delts. Squat keeping torso upright.", isPremium: true, difficulty: .advanced, imageURL: nil),
        Exercise(id: UUID(), name: "Weighted Pull-ups", category: .strength, targetArea: .back, equipment: .bodyweight, sets: 3, reps: 6, duration: nil, restSeconds: 90, instructions: "Add weight belt or dumbbell. Pull chin over bar.", isPremium: true, difficulty: .advanced, imageURL: nil),
        Exercise(id: UUID(), name: "Snatch", category: .strength, targetArea: .fullBody, equipment: .barbell, sets: 3, reps: 5, duration: nil, restSeconds: 120, instructions: "Explosively lift bar from ground to overhead in one motion.", isPremium: true, difficulty: .advanced, imageURL: nil),

        // Yoga
        Exercise(id: UUID(), name: "Sun Salutation A", category: .yoga, targetArea: .fullBody, equipment: .mat, sets: 3, reps: nil, duration: 60, restSeconds: 15, instructions: "Flow through mountain, forward fold, plank, chaturanga, up dog, down dog.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Downward Dog", category: .yoga, targetArea: .fullBody, equipment: .mat, sets: 3, reps: nil, duration: 45, restSeconds: 15, instructions: "Hips high, heels reaching toward floor. Press through hands.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Warrior I", category: .yoga, targetArea: .legs, equipment: .mat, sets: 2, reps: nil, duration: 45, restSeconds: 15, instructions: "Front knee bent 90 degrees, back leg straight. Arms overhead.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Warrior II", category: .yoga, targetArea: .legs, equipment: .mat, sets: 2, reps: nil, duration: 45, restSeconds: 15, instructions: "Open hips to side, arms extended. Gaze over front hand.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Tree Pose", category: .yoga, targetArea: .legs, equipment: .mat, sets: 2, reps: nil, duration: 30, restSeconds: 15, instructions: "Balance on one leg. Foot on inner thigh or calf. Hands at heart or overhead.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Child's Pose", category: .yoga, targetArea: .back, equipment: .mat, sets: 2, reps: nil, duration: 45, restSeconds: 10, instructions: "Knees wide, hips back to heels. Arms extended forward, forehead on mat.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Cobra Pose", category: .yoga, targetArea: .back, equipment: .mat, sets: 3, reps: nil, duration: 30, restSeconds: 15, instructions: "Lie on stomach, press hands to lift chest. Squeeze glutes.", isPremium: false, difficulty: .beginner, imageURL: nil),
        Exercise(id: UUID(), name: "Boat Pose", category: .yoga, targetArea: .abs, equipment: .mat, sets: 3, reps: nil, duration: 30, restSeconds: 15, instructions: "Balance on sit bones, legs lifted. Arms parallel to floor.", isPremium: false, difficulty: .intermediate, imageURL: nil),
        Exercise(id: UUID(), name: "Crow Pose", category: .yoga, targetArea: .fullBody, equipment: .mat, sets: 3, reps: nil, duration: 20, restSeconds: 30, instructions: "Balance knees on triceps. Lean forward, lift feet off floor.", isPremium: true, difficulty: .advanced, imageURL: nil),
        Exercise(id: UUID(), name: "Headstand", category: .yoga, targetArea: .fullBody, equipment: .mat, sets: 3, reps: nil, duration: 30, restSeconds: 45, instructions: "Interlace fingers, place crown on floor. Lift legs straight up.", isPremium: true, difficulty: .advanced, imageURL: nil),
    ]

    // MARK: - Generation Logic

    func generateDailyWorkout(for onboarding: OnboardingData, userId: UUID, isPremium: Bool) -> WorkoutPlan {
        let targetAreas = onboarding.targetAreas.isEmpty ? [.fullBody] : onboarding.targetAreas
        let equipmentFilter: [Exercise.EquipmentType]

        switch onboarding.workoutPreference {
        case .noEquipment:
            equipmentFilter = [.none, .bodyweight]
        case .gym:
            equipmentFilter = [.dumbbell, .barbell, .machine, .resistanceBand]
        case .yoga:
            equipmentFilter = [.mat]
        case .mixed:
            equipmentFilter = [.none, .bodyweight, .dumbbell, .mat]
        }

        // Filter exercises by preference, level, and equipment
        var candidates = exerciseDatabase.filter { exercise in
            let levelMatch = exercise.difficulty == onboarding.fitnessLevel ||
                (onboarding.fitnessLevel == .intermediate && exercise.difficulty == .beginner) ||
                (onboarding.fitnessLevel == .advanced)

            let equipmentMatch = equipmentFilter.contains(exercise.equipment)
            let premiumMatch = !exercise.isPremium || isPremium

            return levelMatch && equipmentMatch && premiumMatch
        }

        // Prioritize target areas
        var selectedExercises: [Exercise] = []
        let exercisesPerArea = max(2, min(4, Int(onboarding.workoutDuration.minutes) / 5 / targetAreas.count))

        for area in targetAreas {
            let areaExercises = candidates.filter { $0.targetArea == area }.shuffled().prefix(exercisesPerArea)
            selectedExercises.append(contentsOf: areaExercises)
            candidates.removeAll { exercise in areaExercises.contains(where: { $0.id == exercise.id }) }
        }

        // Fill remaining slots
        let totalExercisesNeeded = max(4, onboarding.workoutDuration.minutes / 4)
        while selectedExercises.count < totalExercisesNeeded && !candidates.isEmpty {
            if let exercise = candidates.randomElement() {
                selectedExercises.append(exercise)
                candidates.removeAll { $0.id == exercise.id }
            }
        }

        // Generate workout title based on preferences
        let title: String
        let subtitle: String
        switch onboarding.workoutPreference {
        case .noEquipment:
            title = "Bodyweight Blast"
            subtitle = "No equipment needed"
        case .gym:
            title = "Gym Strength"
            subtitle = "Equipment-based training"
        case .yoga:
            title = "Yoga Flow"
            subtitle = "Mind-body connection"
        case .mixed:
            title = "Mixed Training"
            subtitle = "Varied workout styles"
        }

        let category: WorkoutPlan.WorkoutCategory = switch onboarding.workoutPreference {
        case .noEquipment: .home
        case .gym: .gym
        case .yoga: .yoga
        case .mixed: .strength
        }

        let totalDuration = selectedExercises.reduce(0) { total, exercise in
            let exerciseTime = (exercise.duration ?? exercise.reps ?? 10) * exercise.sets
            return total + exerciseTime + exercise.restSeconds
        } / 60

        return WorkoutPlan(
            id: UUID(),
            userId: userId,
            date: Date(),
            title: title,
            subtitle: subtitle,
            exercises: selectedExercises,
            totalDuration: max(totalDuration, onboarding.workoutDuration.minutes / 2),
            difficulty: onboarding.fitnessLevel,
            category: category,
            isPremium: false,
            isCompleted: false,
            completedAt: nil
        )
    }

    func generateWorkoutLibrary(for onboarding: OnboardingData, userId: UUID, isPremium: Bool) -> [WorkoutPlan] {
        let categories: [WorkoutPlan.WorkoutCategory] = [.home, .gym, .yoga, .hiit, .strength, .cardio]
        var plans: [WorkoutPlan] = []

        for category in categories {
            let plan = generateWorkoutForCategory(category, onboarding: onboarding, userId: userId, isPremium: isPremium)
            plans.append(plan)
        }

        // Add premium workouts if subscribed
        if isPremium {
            for category in categories {
                let plan = generatePremiumWorkoutForCategory(category, onboarding: onboarding, userId: userId)
                plans.append(plan)
            }
        }

        return plans
    }

    private func generateWorkoutForCategory(_ category: WorkoutPlan.WorkoutCategory, onboarding: OnboardingData, userId: UUID, isPremium: Bool) -> WorkoutPlan {
        let equipmentFilter: [Exercise.EquipmentType]
        let title: String
        let subtitle: String

        switch category {
        case .home:
            equipmentFilter = [.none, .bodyweight]
            title = "Home Workout"
            subtitle = "No equipment needed"
        case .gym:
            equipmentFilter = [.dumbbell, .barbell, .machine]
            title = "Gym Session"
            subtitle = "Equipment-based training"
        case .yoga:
            equipmentFilter = [.mat]
            title = "Yoga Flow"
            subtitle = "Stretch and strengthen"
        case .hiit:
            equipmentFilter = [.none, .bodyweight]
            title = "HIIT Blast"
            subtitle = "High intensity interval training"
        case .strength:
            equipmentFilter = [.dumbbell, .barbell, .bodyweight]
            title = "Strength Builder"
            subtitle = "Build muscle and power"
        case .cardio:
            equipmentFilter = [.none, .bodyweight]
            title = "Cardio Burn"
            subtitle = "Heart-pumping workout"
        }

        var candidates = exerciseDatabase.filter { exercise in
            let levelMatch = exercise.difficulty == onboarding.fitnessLevel ||
                (onboarding.fitnessLevel == .intermediate && exercise.difficulty == .beginner) ||
                (onboarding.fitnessLevel == .advanced)
            let equipmentMatch = equipmentFilter.contains(exercise.equipment)
            let premiumMatch = !exercise.isPremium || isPremium
            let categoryMatch = exercise.category == .strength || exercise.category == .cardio ||
                (category == .yoga && exercise.category == .yoga) ||
                (category == .hiit && (exercise.category == .hiit || exercise.category == .cardio))
            return levelMatch && equipmentMatch && premiumMatch && categoryMatch
        }

        let totalExercises = max(4, onboarding.workoutDuration.minutes / 4)
        let selected = candidates.shuffled().prefix(totalExercises)

        let totalDuration = selected.reduce(0) { total, exercise in
            let exerciseTime = (exercise.duration ?? exercise.reps ?? 10) * exercise.sets
            return total + exerciseTime + exercise.restSeconds
        } / 60

        return WorkoutPlan(
            id: UUID(),
            userId: userId,
            date: Date(),
            title: title,
            subtitle: subtitle,
            exercises: Array(selected),
            totalDuration: max(totalDuration, 15),
            difficulty: onboarding.fitnessLevel,
            category: category,
            isPremium: false,
            isCompleted: false,
            completedAt: nil
        )
    }

    private func generatePremiumWorkoutForCategory(_ category: WorkoutPlan.WorkoutCategory, onboarding: OnboardingData, userId: UUID) -> WorkoutPlan {
        let plan = generateWorkoutForCategory(category, onboarding: onboarding, userId: userId, isPremium: true)
        return WorkoutPlan(
            id: UUID(),
            userId: userId,
            date: Date(),
            title: "\(plan.title) Pro",
            subtitle: "Advanced \(plan.subtitle.lowercased())",
            exercises: plan.exercises,
            totalDuration: plan.totalDuration + 10,
            difficulty: onboarding.fitnessLevel == .advanced ? .advanced : .intermediate,
            category: category,
            isPremium: true,
            isCompleted: false,
            completedAt: nil
        )
    }
}
