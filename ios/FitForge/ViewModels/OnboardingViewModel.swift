import SwiftUI

@Observable
@MainActor
final class OnboardingViewModel {
    var onboardingData = OnboardingData(
        age: 25,
        gender: nil,
        fitnessGoal: .buildMuscle,
        fitnessLevel: .beginner,
        workoutPreference: .noEquipment,
        workoutDuration: .thirty,
        daysPerWeek: 3,
        targetAreas: [.fullBody]
    )

    var currentStep = 0
    var isSaving = false
    var isComplete = false
    var errorMessage: String?

    let totalSteps = 6

    private let service = SupabaseService.shared

    var canProceed: Bool {
        switch currentStep {
        case 0: return onboardingData.age >= 13 && onboardingData.age <= 100
        case 1: return true // gender optional
        case 2: return true // fitness goal always selected
        case 3: return true // fitness level always selected
        case 4: return true // workout preference always selected
        case 5: return !onboardingData.targetAreas.isEmpty
        default: return false
        }
    }

    func nextStep() {
        if currentStep < totalSteps - 1 {
            currentStep += 1
        }
    }

    func previousStep() {
        if currentStep > 0 {
            currentStep -= 1
        }
    }

    func saveOnboarding() async {
        isSaving = true
        errorMessage = nil

        guard let userId = service.userId else {
            errorMessage = "Not authenticated"
            isSaving = false
            return
        }

        do {
            try await service.saveOnboarding(onboardingData, userId: userId)

            // Update profile to mark onboarding complete
            var profile = try await service.fetchProfile(userId: userId)
            profile.onboardingCompleted = true
            try await service.updateProfile(profile)

            isComplete = true
        } catch {
            errorMessage = "Failed to save preferences. Please try again."
        }

        isSaving = false
    }
}
