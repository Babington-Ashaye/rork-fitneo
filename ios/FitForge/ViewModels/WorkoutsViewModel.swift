import SwiftUI

@Observable
@MainActor
final class WorkoutsViewModel {
    var allWorkouts: [WorkoutPlan] = []
    var filteredWorkouts: [WorkoutPlan] = []
    var selectedCategory: WorkoutPlan.WorkoutCategory? = nil
    var isLoading = false
    var errorMessage: String?
    var isPremium = false
    var showPremiumPrompt = false
    var selectedWorkout: WorkoutPlan?

    private let service = SupabaseService.shared
    private let generator = WorkoutGenerator.shared

    var categories: [WorkoutPlan.WorkoutCategory] {
        Array(Set(allWorkouts.map { $0.category })).sorted { $0.displayName < $1.displayName }
    }

    func loadWorkouts() async {
        isLoading = true
        errorMessage = nil

        guard let userId = service.userId else {
            errorMessage = "Not authenticated"
            isLoading = false
            return
        }

        do {
            let onboarding = try await service.fetchOnboarding(userId: userId)
            let subscription = try await service.fetchSubscriptionStatus(userId: userId)
            isPremium = subscription != .free

            if let onboarding = onboarding {
                allWorkouts = generator.generateWorkoutLibrary(
                    for: onboarding,
                    userId: userId,
                    isPremium: isPremium
                )
                filterWorkouts()
            }
        } catch {
            errorMessage = "Failed to load workouts"
        }

        isLoading = false
    }

    func selectCategory(_ category: WorkoutPlan.WorkoutCategory?) {
        selectedCategory = category
        filterWorkouts()
    }

    private func filterWorkouts() {
        if let category = selectedCategory {
            filteredWorkouts = allWorkouts.filter { $0.category == category }
        } else {
            filteredWorkouts = allWorkouts
        }
    }

    func canAccessWorkout(_ workout: WorkoutPlan) -> Bool {
        return !workout.isPremium || isPremium
    }

    func selectWorkout(_ workout: WorkoutPlan) {
        if canAccessWorkout(workout) {
            selectedWorkout = workout
        } else {
            showPremiumPrompt = true
        }
    }
}
