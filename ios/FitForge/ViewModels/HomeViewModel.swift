import SwiftUI

@Observable
@MainActor
final class HomeViewModel {
    var todaysWorkout: WorkoutPlan?
    var isLoading = false
    var errorMessage: String?
    var stats: WorkoutStats?
    var motivationalQuote: String = ""

    private let service = SupabaseService.shared
    private let generator = WorkoutGenerator.shared

    private let quotes = [
        "The only bad workout is the one that didn't happen.",
        "Your body can stand almost anything. It's your mind that you have to convince.",
        "Fitness is not about being better than someone else. It's about being better than you used to be.",
        "Don't stop when you're tired. Stop when you're done.",
        "The pain you feel today will be the strength you feel tomorrow.",
        "Sweat is just fat crying.",
        "A one-hour workout is 4% of your day. No excuses.",
        "The hardest lift of all is lifting your butt off the couch.",
        "Success starts with self-discipline.",
        "Your future is created by what you do today, not tomorrow."
    ]

    func loadTodaysWorkout() async {
        isLoading = true
        errorMessage = nil

        guard let userId = service.userId else {
            errorMessage = "Not authenticated"
            isLoading = false
            return
        }

        do {
            let onboarding = try await service.fetchOnboarding(userId: userId)
            let history = try await service.fetchWorkoutHistory(userId: userId)
            let subscription = try await service.fetchSubscriptionStatus(userId: userId)
            let isPremium = subscription != .free

            if let onboarding = onboarding {
                todaysWorkout = generator.generateDailyWorkout(
                    for: onboarding,
                    userId: userId,
                    isPremium: isPremium
                )
            }

            calculateStats(from: history)
            motivationalQuote = quotes.randomElement() ?? quotes[0]
        } catch {
            errorMessage = "Failed to load workout"
        }

        isLoading = false
    }

    func markWorkoutCompleted() async {
        guard var workout = todaysWorkout else { return }

        do {
            workout.isCompleted = true
            workout.completedAt = Date()
            try await service.saveWorkoutPlan(workout)

            let history = WorkoutHistory(
                id: UUID(),
                userId: workout.userId,
                workoutId: workout.id,
                workoutTitle: workout.title,
                completedAt: Date(),
                durationMinutes: workout.totalDuration,
                exercisesCompleted: workout.exercises.count,
                totalExercises: workout.exercises.count
            )
            try await service.saveWorkoutHistory(history)

            todaysWorkout?.isCompleted = true
            todaysWorkout?.completedAt = Date()

            // Refresh stats
            if let userId = service.userId {
                let allHistory = try await service.fetchWorkoutHistory(userId: userId)
                calculateStats(from: allHistory)
            }
        } catch {
            errorMessage = "Failed to save progress"
        }
    }

    private func calculateStats(from history: [WorkoutHistory]) {
        let totalWorkouts = history.count
        let totalMinutes = history.reduce(0) { $0 + $1.durationMinutes }

        // Calculate streak
        var currentStreak = 0
        var longestStreak = 0
        var tempStreak = 0

        let calendar = Calendar.current
        let sortedDates = history.map { $0.completedAt }.sorted(by: >)

        // Check if worked out today or yesterday to maintain streak
        if let lastWorkout = sortedDates.first {
            let daysSinceLastWorkout = calendar.dateComponents([.day], from: calendar.startOfDay(for: lastWorkout), to: calendar.startOfDay(for: Date())).day ?? 0
            if daysSinceLastWorkout <= 1 {
                currentStreak = 1
                for i in 1..<sortedDates.count {
                    let dayDiff = calendar.dateComponents([.day], from: calendar.startOfDay(for: sortedDates[i]), to: calendar.startOfDay(for: sortedDates[i-1])).day ?? 0
                    if dayDiff == 1 {
                        currentStreak += 1
                    } else {
                        break
                    }
                }
            }
        }

        // Calculate longest streak
        tempStreak = 1
        for i in 1..<sortedDates.count {
            let dayDiff = calendar.dateComponents([.day], from: calendar.startOfDay(for: sortedDates[i]), to: calendar.startOfDay(for: sortedDates[i-1])).day ?? 0
            if dayDiff == 1 {
                tempStreak += 1
            } else {
                longestStreak = max(longestStreak, tempStreak)
                tempStreak = 1
            }
        }
        longestStreak = max(longestStreak, tempStreak)

        // This week
        let weekStart = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: Date())) ?? Date()
        let thisWeekHistory = history.filter { $0.completedAt >= weekStart }
        let thisWeekWorkouts = thisWeekHistory.count
        let thisWeekMinutes = thisWeekHistory.reduce(0) { $0 + $1.durationMinutes }

        stats = WorkoutStats(
            totalWorkouts: totalWorkouts,
            currentStreak: currentStreak,
            longestStreak: longestStreak,
            totalMinutes: totalMinutes,
            thisWeekWorkouts: thisWeekWorkouts,
            thisWeekMinutes: thisWeekMinutes
        )
    }
}
