import Foundation

/// AI service abstraction layer. Uses Google Gemini for plan generation and nutrition analysis.
/// Falls back to local generation if the API is unavailable.
enum PlanGenerationService {

    private static let availableProgramIDs = [
        "full_body_beginner", "upper_lower", "push_pull_legs", "core_crusher",
        "hiit_burn", "athletic_conditioning", "elite_physique", "mobility_flex",
        "home_no_equipment", "dumbbell_only", "cardio_blast", "beginner_2day",
        "beginner_3day", "fat_loss_circuit", "abs_core_burn", "upper_body_strength",
        "lower_body_power", "morning_energy", "fat_burn_30", "bodyweight_beast",
        "power_conditioning", "cardio_blast_advanced", "athlete_cardio"
    ]

    // MARK: - Fitness plan

    static func generateFitnessPlan(onboarding: OnboardingData) async throws -> GeneratedPlan {
        let profile = buildProfileJSON(onboarding)
        let systemPrompt = fitnessSystemPrompt + "\n\nUser profile:\n\(profile)"
        let userMessage = "Generate a 4-week workout plan for this user based on their profile."

        let response = await GeminiService.shared.generateText(
            prompt: userMessage,
            systemPrompt: systemPrompt
        )

        if !response.isEmpty,
           let json = extractJSON(from: response),
           let plan = try? decodePlan(json, isSports: false) {
            return plan
        }

        // Fallback to local generation
        return generateLocalPlan(onboarding: onboarding)
    }

    // MARK: - Sports plan

    static func generateSportsPlan(onboarding: OnboardingData, sport: SportType, level: SportLevel, position: String?) async throws -> GeneratedPlan {
        let profile = buildProfileJSON(onboarding)
        let positionText = position.map { "Position: \($0)" } ?? "No specific position"
        let systemPrompt = sportsSystemPrompt(sport: sport.title, level: level.title, position: positionText) + "\n\nUser profile:\n\(profile)"
        let userMessage = "Generate a 4-week sport-specific training plan for this athlete."

        let response = await GeminiService.shared.generateText(
            prompt: userMessage,
            systemPrompt: systemPrompt
        )

        if !response.isEmpty,
           let json = extractJSON(from: response),
           let plan = try? decodePlan(json, isSports: true, sportName: sport.title, position: position) {
            return plan
        }

        return generateLocalSportsPlan(onboarding: onboarding, sport: sport, level: level, position: position)
    }

    // MARK: - Nutrition scan

    static func analyzeMeal(base64Image: String) async throws -> NutritionAnalysisResult {
        let prompt = """
        Identify the food in this image and estimate its nutritional values per serving.
        Respond ONLY in valid JSON with no markdown and no extra text.
        The JSON must have exactly these keys: foods as an array where each item has name, portion, calories, protein, carbs, fat, fiber, sugar.
        Also include totals with calories, protein, carbs, fat, fiber, sugar.
        Also include confidence as an integer from 0 to 100.
        Also include mealType as one of "breakfast", "lunch", "dinner", or "snacks".
        """

        let response = await GeminiService.shared.analyzeImage(
            base64ImageString: base64Image,
            prompt: prompt
        )

        if !response.isEmpty,
           let json = extractJSON(from: response) {
            return try decodeNutrition(json)
        }

        throw AIServiceError.invalidResponse
    }

    // MARK: - Workout generation from chat

    /// Generates a workout based on a natural-language request from the user.
    /// Returns a matching program ID if found, or a full custom workout spec.
    static func generateWorkoutFromChat(request: String, user: AppUser, store: FitneoStore, programIDs: [String]) async -> WorkoutProgram? {
        let systemPrompt = """
        You are FITNEO AI, a professional fitness coach. Generate a complete workout plan based on the user description and profile.
        Respond ONLY in valid JSON with no markdown and no extra text. The JSON must have these keys:
        name as a string, category as a string (one of: strength, hiit, cardio, core, flexibility, elite),
        estimatedMinutes as an Int, exercises as an array where each object has name as a string, sets as an Int, reps as an Int, restSeconds as an Int, and notes as a string.
        Use only exercises that correspond to the available program IDs: \(programIDs.joined(separator: ", ")).
        If an existing program already matches the user's request, return instead a JSON object with matchFound as true and programID as the matching program ID.
        """

        let userPrompt = "User fitness level: \(user.fitnessLevel.title). Equipment: \(user.equipment.joined(separator: ", ")). Goals: \(user.goals.joined(separator: ", ")). Request: \(request)"

        let response = await GeminiService.shared.generateText(
            prompt: userPrompt,
            systemPrompt: systemPrompt
        )

        // Parse AI-generated workout
        guard !response.isEmpty,
              let json = extractJSON(from: response),
              let data = json.data(using: .utf8) else {
            return nil
        }

        // Check if it's a match recommendation
        if let matchObj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let matchFound = matchObj["matchFound"] as? Bool, matchFound,
           let programID = matchObj["programID"] as? String {
            return store.allPrograms.first { $0.id == programID }
        }

        // Try to decode as a custom workout
        if let aiWorkout = try? JSONDecoder().decode(AIGeneratedWorkout.self, from: data) {
            let category = WorkoutCategory(rawValue: aiWorkout.category) ?? .strength
            // Map exercise names to existing exercise IDs
            let allExercises = ExerciseLibrary.exercises
            var exerciseIDs: [String] = []
            for ex in aiWorkout.exercises {
                if let match = allExercises.first(where: {
                    $0.name.lowercased().contains(ex.name.lowercased()) ||
                    ex.name.lowercased().contains($0.name.lowercased())
                }) {
                    exerciseIDs.append(match.id)
                }
            }
            guard !exerciseIDs.isEmpty else { return nil }

            let program = WorkoutProgram(
                id: "ai_gen_\(UUID().uuidString.prefix(8))",
                name: aiWorkout.name,
                category: category,
                difficulty: user.fitnessLevel,
                durationMinutes: aiWorkout.estimatedMinutes,
                description: aiWorkout.notes,
                muscleGroups: category == .hiit ? [.cardio, .fullBody] :
                              category == .core ? [.core] : [.fullBody],
                exerciseIDs: exerciseIDs,
                isPremium: false
            )
            store.addCustomProgram(program)
            return program
        }

        return nil
    }

    // MARK: - Gemini helpers

    private static func extractJSON(from content: String) -> String? {
        guard let start = content.firstIndex(of: "{"),
              let end = content.lastIndex(of: "}") else {
            return nil
        }
        return String(content[start...end])
    }

    private static func decodePlan(_ json: String, isSports: Bool, sportName: String? = nil, position: String? = nil) throws -> GeneratedPlan {
        guard let data = json.data(using: .utf8) else { throw AIServiceError.invalidResponse }
        let dto = try JSONDecoder().decode(PlanJSONResponse.self, from: data)

        let weeks = dto.weeklyStructure.map { week in
            PlanWeek(
                weekNumber: week.weekNumber,
                theme: week.theme,
                days: week.days.map { day in
                    PlanDay(
                        dayNumber: day.dayNumber,
                        focus: day.focus,
                        programID: day.programID,
                        notes: day.notes
                    )
                }
            )
        }

        return GeneratedPlan(
            planName: dto.planName,
            coachMessage: dto.coachMessage,
            weeklyStructure: weeks,
            isSportsPlan: isSports,
            sportName: sportName,
            position: position,
            sportFocus: dto.sportFocus
        )
    }

    private static func decodeNutrition(_ json: String) throws -> NutritionAnalysisResult {
        guard let data = json.data(using: .utf8) else { throw AIServiceError.invalidResponse }
        return try JSONDecoder().decode(NutritionAnalysisResult.self, from: data)
    }

    // MARK: - Local fallback plans (unchanged)

    static func generateLocalPlan(onboarding: OnboardingData) -> GeneratedPlan {
        let level = onboarding.fitnessLevel ?? .someExperience
        let goal = onboarding.goal ?? .buildMuscle
        let daysPerWeek = onboarding.trainingDaysPerWeek ?? 3

        let programIDs: [String?]
        let themes: [String]
        let planName: String

        switch (level, goal, daysPerWeek) {
        case (.beginner, _, _):
            planName = "Foundation Builder"
            themes = ["Foundation", "Getting Comfortable", "Building Consistency", "First Milestone"]
            programIDs = beginnerPlan(days: daysPerWeek)
        case (_, .loseFat, _):
            planName = "Fat Loss Accelerator"
            themes = ["Metabolic Ignition", "Calorie Burn Surge", "Fat Adaptation", "Lean Definition"]
            programIDs = fatLossPlan(days: daysPerWeek)
        case (_, .buildMuscle, _):
            planName = "Muscle Builder Pro"
            themes = ["Hypertrophy Foundation", "Volume Increase", "Strength Peak", "Muscle Definition"]
            programIDs = musclePlan(days: daysPerWeek)
        case (_, .athleticPerformance, _):
            planName = "Athletic Power"
            themes = ["Base Conditioning", "Power Development", "Speed & Agility", "Peak Performance"]
            programIDs = athletePlan(days: daysPerWeek)
        default:
            planName = "Balanced Fitness"
            themes = ["Foundation", "Progressive Overload", "Peak Phase", "Consolidation"]
            programIDs = balancedPlan(days: daysPerWeek)
        }

        let weeks = buildWeeks(themes: themes, programIDs: programIDs, daysPerWeek: daysPerWeek)
        return GeneratedPlan(
            planName: planName,
            coachMessage: "Welcome, \(onboarding.goal?.title.lowercased() ?? "athlete")! Your \(daysPerWeek)-day plan is ready. Stay consistent and trust the process.",
            weeklyStructure: weeks
        )
    }

    static func generateLocalSportsPlan(onboarding: OnboardingData, sport: SportType, level: SportLevel, position: String?) -> GeneratedPlan {
        let daysPerWeek = onboarding.trainingDaysPerWeek ?? 4
        let themes = ["Sport Foundation", "Position-Specific Power", "Competition Readiness", "Peak Performance"]
        let programIDs = sportsProgramIDs(sport: sport, days: daysPerWeek)

        let weeks = buildWeeks(themes: themes, programIDs: programIDs, daysPerWeek: daysPerWeek)
        return GeneratedPlan(
            planName: "\(sport.title) Training Plan",
            coachMessage: "Your \(sport.title)-specific plan builds explosive power, sport-specific endurance, and injury resilience. Let's dominate.",
            weeklyStructure: weeks,
            isSportsPlan: true,
            sportName: sport.title,
            position: position,
            sportFocus: "Power, agility and sport-specific conditioning for \(position ?? sport.title)"
        )
    }

    // MARK: - Plan builders

    private static func buildWeeks(themes: [String], programIDs: [String?], daysPerWeek: Int) -> [PlanWeek] {
        var weeks: [PlanWeek] = []
        var dayCounter = 1

        for (wi, theme) in themes.enumerated() {
            var days: [PlanDay] = []
            for di in 0..<7 {
                let isTrainingDay = di < daysPerWeek
                let progIdx = (wi * daysPerWeek + di) % programIDs.count
                let programID = isTrainingDay ? programIDs[progIdx] : nil

                days.append(PlanDay(
                    dayNumber: dayCounter,
                    focus: isTrainingDay ? focusForProgram(programID) : "Rest",
                    programID: programID,
                    notes: isTrainingDay ? notesForDay(dayCounter) : "Recovery is essential for growth"
                ))
                dayCounter += 1
            }
            weeks.append(PlanWeek(weekNumber: wi + 1, theme: theme, days: days))
        }
        return weeks
    }

    private static func focusForProgram(_ id: String?) -> String {
        guard let id else { return "Rest" }
        switch id {
        case "full_body_beginner", "beginner_2day", "beginner_3day": return "Full Body"
        case "upper_lower", "upper_body_strength": return "Upper Body"
        case "lower_body_power": return "Lower Body"
        case "push_pull_legs": return "Push/Pull"
        case "core_crusher", "abs_core_burn": return "Core"
        case "hiit_burn", "fat_loss_circuit": return "HIIT & Cardio"
        case "athletic_conditioning", "athlete_cardio": return "Athletic"
        case "cardio_blast", "cardio_blast_advanced", "fat_burn_30": return "Cardio"
        case "mobility_flex", "morning_energy": return "Mobility"
        case "dumbbell_only": return "Strength"
        case "elite_physique", "power_conditioning", "bodyweight_beast": return "Elite"
        default: return "Training"
        }
    }

    private static func notesForDay(_ day: Int) -> String {
        let notes = [
            "Focus on form over weight",
            "Push through the last set",
            "Control the negatives",
            "Full range of motion",
            "Stay hydrated throughout",
            "Breathe through each rep",
            "Quality over quantity today"
        ]
        return notes[day % notes.count]
    }

    private static func beginnerPlan(days: Int) -> [String?] {
        days <= 2 ? ["full_body_beginner", "mobility_flex"] :
        days <= 3 ? ["full_body_beginner", "cardio_blast", "mobility_flex"] :
        ["full_body_beginner", "upper_body_strength", "lower_body_power", "core_crusher"]
    }

    private static func fatLossPlan(days: Int) -> [String?] {
        days <= 3 ? ["hiit_burn", "fat_burn_30", "mobility_flex"] :
        ["hiit_burn", "upper_body_strength", "lower_body_power", "fat_burn_30", "cardio_blast"]
    }

    private static func musclePlan(days: Int) -> [String?] {
        days <= 3 ? ["full_body_beginner", "upper_body_strength", "lower_body_power"] :
        ["push_pull_legs", "upper_body_strength", "lower_body_power", "core_crusher", "dumbbell_only"]
    }

    private static func athletePlan(days: Int) -> [String?] {
        days <= 3 ? ["athletic_conditioning", "hiit_burn", "mobility_flex"] :
        ["athletic_conditioning", "upper_body_strength", "lower_body_power", "athlete_cardio", "core_crusher"]
    }

    private static func balancedPlan(days: Int) -> [String?] {
        days <= 3 ? ["full_body_beginner", "cardio_blast", "mobility_flex"] :
        ["upper_lower", "cardio_blast", "core_crusher", "mobility_flex"]
    }

    private static func sportsProgramIDs(sport: SportType, days: Int) -> [String?] {
        let base: [String?] = switch sport {
        case .soccer, .rugby, .americanFootball:
            ["athletic_conditioning", "lower_body_power", "hiit_burn", "athlete_cardio", "core_crusher"]
        case .basketball, .tennis:
            ["athletic_conditioning", "upper_body_strength", "hiit_burn", "athlete_cardio", "mobility_flex"]
        case .boxing, .mma:
            ["hiit_burn", "upper_body_strength", "athlete_cardio", "core_crusher", "power_conditioning"]
        case .swimming:
            ["athletic_conditioning", "upper_body_strength", "cardio_blast", "mobility_flex", "core_crusher"]
        case .athletics:
            ["athletic_conditioning", "lower_body_power", "hiit_burn", "athlete_cardio", "power_conditioning"]
        case .cycling:
            ["athlete_cardio", "lower_body_power", "hiit_burn", "mobility_flex", "core_crusher"]
        }
        return Array(base.prefix(days))
    }

    // MARK: - Prompt builders

    private static var fitnessSystemPrompt: String {
        """
        You are FITNEO AI, an elite personal trainer. Based on the user profile below generate a structured 4 week workout plan.
        Return a JSON object only with no markdown. The object must contain:
        - planName as a string
        - weeklyStructure as an array of 4 week objects each containing weekNumber, theme (such as "Foundation" or "Progressive Overload"), and days as an array of day objects each containing dayNumber, focus (such as "Upper Body" or "Rest"), programID (from the available list below, or null if rest), and notes as a short coaching note under 20 words.
        - coachMessage as a string under 50 words welcoming the user and explaining the plan.
        Take into account the user's biggest challenge, past obstacles, training experience, injuries, and body measurements when tailoring the plan.

        Available program IDs: \(availableProgramIDs.joined(separator: ", "))
        """
    }

    private static func sportsSystemPrompt(sport: String, level: String, position: String) -> String {
        """
        You are FITNEO AI, an elite sports performance coach. Generate a 4 week sport specific training plan for this athlete based on their sport, position, and level.
        Sport: \(sport)
        Level: \(level)
        \(position)

        Return a JSON object only with no markdown. The object must contain:
        - planName as a string
        - sportFocus as a string describing the key physical demands of this position in under 20 words
        - weeklyStructure as an array of 4 week objects each containing weekNumber, theme, and days as an array of day objects each containing dayNumber, focus, programID from the available list or null for rest, and notes explaining in under 15 words why this session benefits their specific position.
        - coachMessage as a string under 60 words explaining what physical qualities this plan will develop.
        Avoid exercises that aggravate any injuries listed in the user profile.

        Available program IDs: \(availableProgramIDs.joined(separator: ", "))
        """
    }

    private static func buildProfileJSON(_ data: OnboardingData) -> String {
        var dict: [String: Any] = [:]
        dict["goal"] = data.goal?.rawValue ?? "unknown"
        dict["fitnessLevel"] = data.fitnessLevel?.rawValue ?? "beginner"
        dict["equipment"] = data.equipment?.rawValue ?? "no_equipment"
        dict["sessionLength"] = data.sessionLength?.rawValue ?? "30"
        dict["focusAreas"] = data.focusAreas.map { $0.rawValue }
        dict["dietType"] = data.dietType?.rawValue ?? "standard"
        dict["coachPersonality"] = data.coachPersonality?.rawValue ?? "motivational"
        dict["sleepQuality"] = data.sleepQuality?.rawValue ?? "average"
        dict["activityLevel"] = data.activityLevel?.rawValue ?? "moderately_active"
        dict["targetPhysique"] = data.targetPhysique?.rawValue ?? "athletic_strong"
        dict["trainingDaysPerWeek"] = data.trainingDaysPerWeek ?? 4
        dict["workoutDuration"] = data.workoutDuration?.rawValue ?? "30-45"
        dict["recoveryQuality"] = data.recoveryQuality?.rawValue ?? "average_recovery"
        dict["trainingStyles"] = data.trainingStyles.map { $0.rawValue }
        dict["trainingExperience"] = data.trainingExperience.map { $0.rawValue }
        dict["biggestChallenge"] = data.biggestChallenge?.rawValue ?? "staying_consistent"
        dict["injuries"] = data.injuries.map { $0.rawValue }
        dict["pastObstacles"] = data.pastObstacles.map { $0.rawValue }
        if let bm = data.bodyMeasurements {
            var bmDict: [String: Any] = ["unit": bm.unit.rawValue]
            if let chest = bm.chest { bmDict["chest"] = chest }
            if let waist = bm.waist { bmDict["waist"] = waist }
            if let hips = bm.hips { bmDict["hips"] = hips }
            if let arms = bm.arms { bmDict["arms"] = arms }
            if let thighs = bm.thighs { bmDict["thighs"] = thighs }
            dict["bodyMeasurements"] = bmDict
        }

        guard let jsonData = try? JSONSerialization.data(withJSONObject: dict),
              let jsonStr = String(data: jsonData, encoding: .utf8) else {
            return "{}"
        }
        return jsonStr
    }
}

// MARK: - AI-generated workout model

struct AIGeneratedWorkout: Codable, Sendable {
    let name: String
    let category: String
    let estimatedMinutes: Int
    let exercises: [AIExercise]
    let notes: String
}

struct AIExercise: Codable, Sendable {
    let name: String
    let sets: Int
    let reps: Int
    let restSeconds: Int
}

// MARK: - Nutrition analysis result

struct NutritionAnalysisResult: Codable, Sendable {
    let foods: [AnalyzedFood]
    let totals: NutritionTotals
    let confidence: Int
    let mealType: String

    enum CodingKeys: String, CodingKey {
        case foods, totals, confidence, mealType
    }

    var resolvedMealType: MealType {
        switch mealType.lowercased() {
        case "breakfast": .breakfast
        case "lunch": .lunch
        case "dinner": .dinner
        default: .snacks
        }
    }
}

struct AnalyzedFood: Codable, Sendable, Identifiable {
    var id: String { name }
    var name: String
    var portion: String
    var calories: Int
    var protein: Double
    var carbs: Double
    var fat: Double
    var fiber: Double
    var sugar: Double
}

struct NutritionTotals: Codable, Sendable {
    let calories: Int
    let protein: Double
    let carbs: Double
    let fat: Double
    let fiber: Double
    let sugar: Double
}

enum AIServiceError: Error, LocalizedError {
    case invalidResponse
    case networkError(String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse: "Could not generate a plan. Please try again."
        case .networkError(let msg): "Network error: \(msg)"
        }
    }
}
