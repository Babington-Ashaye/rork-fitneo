import SwiftUI

@Observable
@MainActor
final class OnboardingViewModel {
    var data = OnboardingData()
    var currentStep: Int = 0
    var isComplete = false
    var errorMessage: String?

    /// Step map (20 total, indices 0..19):
    /// 0 Welcome • 1 Goal • 2 Level • 3 Calib1 • 4 Equipment • 5 Focus • 6 Duration
    /// 7 Stats • 8 Calib2 • 9 Diet • 10 Coach • 11 Time • 12 Sleep • 13 Calib3
    /// 14 Activity • 15 Physique • 16 Motivation • 17 Language • 18 Theme • 19 Completion
    let totalSteps = 20

    private let service = SupabaseService.shared

    var progress: Double {
        guard totalSteps > 1 else { return 0 }
        return Double(currentStep) / Double(totalSteps - 1)
    }

    var canProceed: Bool {
        switch currentStep {
        case 1: return data.goal != nil
        case 2: return data.fitnessLevel != nil
        case 4: return data.equipment != nil
        case 5: return !data.focusAreas.isEmpty
        case 6: return data.sessionLength != nil
        case 7: return data.weight > 0 && data.height > 0
        case 9: return data.dietType != nil
        case 10: return data.coachPersonality != nil
        case 11: return data.workoutTime != nil
        case 12: return data.sleepQuality != nil
        case 14: return data.activityLevel != nil
        case 15: return data.targetPhysique != nil
        case 16: return !data.motivationStyles.isEmpty
        case 17: return true
        case 18: return true
        default: return true
        }
    }

    /// True when the screen advances itself (no Continue button).
    var isAutoStep: Bool {
        currentStep == 0 || currentStep == 3 || currentStep == 8 || currentStep == 13 || currentStep == 19
    }

    /// The Theme step (18) is the last user-input screen → tapping its CTA finishes onboarding.
    var isFinishStep: Bool { currentStep == 18 }

    func next() {
        guard currentStep < totalSteps - 1 else { return }
        withAnimation(.easeInOut(duration: 0.4)) { currentStep += 1 }
        persistProgress()
    }

    func back() {
        guard currentStep > 0 else { return }
        withAnimation(.easeInOut(duration: 0.4)) { currentStep -= 1 }
    }

    func goTo(_ step: Int) {
        guard step >= 0 && step < totalSteps else { return }
        withAnimation(.easeInOut(duration: 0.4)) { currentStep = step }
    }

    private func persistProgress() {
        guard let userId = service.userId else { return }
        let snapshot = data
        Task.detached { [snapshot] in
            await SupabaseService.shared.saveOnboardingProgress(snapshot, userId: userId)
        }
    }

    /// Save all answers, mark profile complete, start trial subscription. Then advance to completion screen.
    func finish() async {
        guard let userId = service.userId else {
            errorMessage = "You must be signed in."
            return
        }
        await service.saveOnboardingProgress(data, userId: userId)
        do {
            try await service.setOnboardingCompleted(true, userId: userId)
            await service.startTrialSubscription(userId: userId)
            isComplete = true
            withAnimation(.easeInOut(duration: 0.5)) { currentStep = 19 }
        } catch {
            errorMessage = "Failed to save your profile. Please try again."
        }
    }
}
