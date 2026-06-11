import Foundation

/// Selects a personalized workout based on the user's history, level, equipment and goals.
@MainActor
enum FitneoAIAutopilot {

    static func selectWorkout(store: FitneoStore) -> WorkoutProgram {
        let programs = store.allPrograms.filter { p in
            !p.isPremium || store.subscription.isPremium
        }

        let level = store.user.fitnessLevel
        let lastMuscles = Set(store.workouts.last?.muscleGroups ?? [])
        let goals = store.user.goals

        func score(_ p: WorkoutProgram) -> Int {
            var s = 0
            s -= abs(p.difficulty.rawValue - level.rawValue) * 3
            let overlap = Set(p.muscleGroups).intersection(lastMuscles).count
            s -= overlap * 2
            if goals.contains("Lose Weight") && (p.category == .hiit || p.category == .cardio) { s += 4 }
            if goals.contains("Build Muscle") && p.category == .strength { s += 4 }
            if goals.contains("Athletic Performance") && (p.category == .hiit || p.category == .elite) { s += 3 }
            if goals.contains("Flexibility") && p.category == .flexibility { s += 4 }
            if store.user.equipment == ["No Equipment"] && (p.id == "home_no_equipment" || p.category == .core || p.category == .cardio) { s += 3 }
            return s
        }

        let best = programs.max { score($0) < score($1) }
        return best ?? store.allPrograms.first { !$0.isPremium }!
    }

    static func announcement(for program: WorkoutProgram) -> String {
        "Based on your history, I'm starting a \(program.durationMinutes)-minute \(program.name) session. Let's go."
    }
}
