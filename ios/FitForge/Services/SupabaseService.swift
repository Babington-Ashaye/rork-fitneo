import Foundation
import Supabase
import AuthenticationServices

enum AuthError: Error, LocalizedError {
    case invalidCredentials
    case emailAlreadyExists
    case networkError
    case unknown
    case notAuthenticated
    case googleSignInFailed
    case profileCreationFailed

    var errorDescription: String? {
        switch self {
        case .invalidCredentials: "Invalid email or password."
        case .emailAlreadyExists: "An account with this email already exists."
        case .networkError: "Network error. Please check your connection."
        case .unknown: "Something went wrong. Please try again."
        case .notAuthenticated: "Please sign in to continue."
        case .googleSignInFailed: "Google sign-in failed. Please try again."
        case .profileCreationFailed: "Failed to create your profile."
        }
    }
}

@Observable
@MainActor
final class SupabaseService {
    static let shared = SupabaseService()

    private let supabaseURL = URL(string: "https://sokjybielakrristebam.supabase.co")!
    private let supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNva2p5YmllbGFrcnJpc3RlYmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNjc0NjQsImV4cCI6MjA5MzY0MzQ2NH0.qjWolwo-MXw4YSET1iZZxu6RpS8AcfUViqWxdYDds08"

    let client: SupabaseClient

    var isAuthenticated: Bool { client.auth.currentSession != nil }
    var userId: UUID? { client.auth.currentSession?.user.id }
    var currentUserEmail: String? { client.auth.currentSession?.user.email }

    private init() {
        self.client = SupabaseClient(supabaseURL: supabaseURL, supabaseKey: supabaseKey)
    }

    // MARK: - Session

    func restoreSession() async throws -> UserProfile? {
        _ = try await client.auth.session
        return try await ensureProfileExists()
    }

    // MARK: - Auth

    func signUp(email: String, password: String) async throws -> UserProfile {
        do {
            _ = try await client.auth.signUp(email: email, password: password)
            return try await ensureProfileExists()
        } catch {
            throw mapAuthError(error)
        }
    }

    func signIn(email: String, password: String) async throws -> UserProfile {
        do {
            _ = try await client.auth.signIn(email: email, password: password)
            return try await ensureProfileExists()
        } catch {
            throw mapAuthError(error)
        }
    }

    func signInWithGoogle() async throws -> UserProfile {
        do {
            _ = try await client.auth.signInWithOAuth(provider: .google) { session in
                session.prefersEphemeralWebBrowserSession = false
            }
            return try await ensureProfileExists()
        } catch {
            throw AuthError.googleSignInFailed
        }
    }

    func signOut() async throws {
        try await client.auth.signOut()
    }

    private nonisolated func mapAuthError(_ error: Error) -> AuthError {
        let message = error.localizedDescription.lowercased()
        if message.contains("invalid") || message.contains("credentials") { return .invalidCredentials }
        if message.contains("already") || message.contains("registered") { return .emailAlreadyExists }
        if message.contains("network") || message.contains("connection") { return .networkError }
        return .unknown
    }

    // MARK: - Profile (user_profiles table)

    private struct ProfileRow: Codable {
        let id: UUID
        let email: String
        let display_name: String?
        let onboarding_completed: Bool?
        let created_at: Date?
    }

    func ensureProfileExists() async throws -> UserProfile {
        guard let userId = client.auth.currentSession?.user.id,
              let user = client.auth.currentUser else {
            throw AuthError.notAuthenticated
        }

        if let existing = try? await fetchProfile(userId: userId) {
            return existing
        }

        let row = ProfileRow(
            id: userId,
            email: user.email ?? "",
            display_name: user.userMetadata["full_name"]?.stringValue,
            onboarding_completed: false,
            created_at: Date()
        )
        do {
            try await client.from("user_profiles").insert(row).execute()
        } catch {
            // ignore – may already exist via DB trigger
        }
        return try await fetchProfile(userId: userId)
    }

    func fetchProfile(userId: UUID) async throws -> UserProfile {
        let row: ProfileRow = try await client
            .from("user_profiles")
            .select()
            .eq("id", value: userId)
            .single()
            .execute()
            .value

        return UserProfile(
            id: row.id,
            email: row.email,
            displayName: row.display_name,
            onboardingCompleted: row.onboarding_completed ?? false,
            createdAt: row.created_at ?? Date()
        )
    }

    func setOnboardingCompleted(_ completed: Bool, userId: UUID) async throws {
        try await client
            .from("user_profiles")
            .update(["onboarding_completed": completed])
            .eq("id", value: userId)
            .execute()
    }

    // MARK: - Onboarding answers

    private struct OnboardingPayload: Codable {
        let user_id: UUID
        let goal: String?
        let fitness_level: String?
        let equipment: String?
        let focus_areas: [String]
        let session_length: String?
        let weight: Double
        let weight_unit: String
        let height: Double
        let height_unit: String
        let diet_type: String?
        let coach_personality: String?
        let workout_time: String?
        let sleep_quality: String?
        let activity_level: String?
        let target_physique: String?
        let motivation_styles: [String]
        let language: String
        let theme: String
        let updated_at: Date
    }

    func saveOnboardingProgress(_ data: OnboardingData, userId: UUID) async {
        let payload = OnboardingPayload(
            user_id: userId,
            goal: data.goal?.rawValue,
            fitness_level: data.fitnessLevel?.rawValue,
            equipment: data.equipment?.rawValue,
            focus_areas: data.focusAreas.map(\.rawValue),
            session_length: data.sessionLength?.rawValue,
            weight: data.weight,
            weight_unit: data.weightUnit.rawValue,
            height: data.height,
            height_unit: data.heightUnit.rawValue,
            diet_type: data.dietType?.rawValue,
            coach_personality: data.coachPersonality?.rawValue,
            workout_time: data.workoutTime?.rawValue,
            sleep_quality: data.sleepQuality?.rawValue,
            activity_level: data.activityLevel?.rawValue,
            target_physique: data.targetPhysique?.rawValue,
            motivation_styles: data.motivationStyles.map(\.rawValue),
            language: data.language.rawValue,
            theme: data.theme.rawValue,
            updated_at: Date()
        )

        // Best-effort: ignore failure so onboarding can complete in-memory
        // and user can retry later. Logged for debugging.
        do {
            try await client
                .from("user_profiles")
                .update(payload)
                .eq("id", value: userId)
                .execute()
        } catch {
            print("[FITNEO] Failed to save onboarding progress: \(error)")
        }
    }

    // MARK: - Subscriptions (trial)

    private struct SubscriptionRow: Codable {
        let user_id: UUID
        let plan: String
        let status: String
        let started_at: Date
    }

    func startTrialSubscription(userId: UUID) async {
        let row = SubscriptionRow(
            user_id: userId,
            plan: "trial",
            status: "active",
            started_at: Date()
        )
        do {
            try await client.from("subscriptions").insert(row).execute()
        } catch {
            print("[FITNEO] Failed to start trial subscription: \(error)")
        }
    }
}
