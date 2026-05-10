import SwiftUI

@Observable
@MainActor
final class ProfileViewModel {
    var userProfile: UserProfile?
    var onboardingData: OnboardingData?
    var isLoading = false
    var errorMessage: String?
    var showEditSheet = false
    var showSubscriptionSheet = false

    private let service = SupabaseService.shared

    func loadProfile() async {
        isLoading = true
        errorMessage = nil

        guard let userId = service.userId else {
            errorMessage = "Not authenticated"
            isLoading = false
            return
        }

        do {
            userProfile = try await service.fetchProfile(userId: userId)
            onboardingData = try await service.fetchOnboarding(userId: userId)
        } catch {
            errorMessage = "Failed to load profile"
        }

        isLoading = false
    }

    func updateOnboarding(_ data: OnboardingData) async {
        guard let userId = service.userId else { return }
        isLoading = true

        do {
            try await service.saveOnboarding(data, userId: userId)
            onboardingData = data
            showEditSheet = false
        } catch {
            errorMessage = "Failed to update preferences"
        }

        isLoading = false
    }

    func upgradeToPremium() async {
        guard let userId = service.userId else { return }
        isLoading = true

        do {
            try await service.updateSubscription(userId: userId, status: .premium)
            userProfile?.subscriptionStatus = .premium
            showSubscriptionSheet = false
        } catch {
            errorMessage = "Failed to upgrade"
        }

        isLoading = false
    }

    func cancelSubscription() async {
        guard let userId = service.userId else { return }
        isLoading = true

        do {
            try await service.updateSubscription(userId: userId, status: .free)
            userProfile?.subscriptionStatus = .free
        } catch {
            errorMessage = "Failed to cancel subscription"
        }

        isLoading = false
    }
}
