import Foundation
import Supabase
import AuthenticationServices

enum AuthError: Error, LocalizedError {
    case invalidCredentials
    case emailAlreadyExists
    case networkError
    case unknown
    case notAuthenticated
    case invalidResponse
    case appleSignInFailed
    case googleSignInFailed
    case profileCreationFailed

    var errorDescription: String? {
        switch self {
        case .invalidCredentials: return "Invalid email or password"
        case .emailAlreadyExists: return "An account with this email already exists"
        case .networkError: return "Network error. Please try again."
        case .unknown: return "Something went wrong"
        case .notAuthenticated: return "Please sign in"
        case .invalidResponse: return "Invalid server response"
        case .appleSignInFailed: return "Apple Sign-In failed"
        case .googleSignInFailed: return "Google Sign-In failed"
        case .profileCreationFailed: return "Failed to create user profile"
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

    var isAuthenticated: Bool {
        client.auth.currentSession != nil
    }

    var userId: UUID? {
        client.auth.currentSession?.user.id
    }

    private init() {
        self.client = SupabaseClient(
            supabaseURL: supabaseURL,
            supabaseKey: supabaseKey
        )
    }

    // MARK: - Session Restoration

    func restoreSession() async throws -> UserProfile? {
        let _ = try await client.auth.session
        return try await ensureProfileExists()
    }

    // MARK: - Email/Password Auth

    func signUp(email: String, password: String) async throws -> UserProfile {
        let response = try await client.auth.signUp(
            email: email,
            password: password
        )

        let user = response.user

        let profile = UserProfile(
            id: user.id,
            email: email,
            displayName: user.userMetadata["full_name"]?.stringValue,
            onboardingCompleted: false,
            createdAt: Date(),
            subscriptionStatus: .free
        )

        try await createProfile(profile)
        return profile
    }

    func signIn(email: String, password: String) async throws -> UserProfile {
        let _ = try await client.auth.signIn(
            email: email,
            password: password
        )

        return try await ensureProfileExists()
    }

    // MARK: - Apple Sign-In

    func signInWithApple(idToken: String, fullName: String?) async throws -> UserProfile {
        let _ = try await client.auth.signInWithIdToken(
            credentials: .init(
                provider: .apple,
                idToken: idToken
            )
        )

        // Update full name if provided (only available on first sign-in)
        if let fullName {
            _ = try? await client.auth.update(
                user: UserAttributes(data: ["full_name": .string(fullName)])
            )
        }

        return try await ensureProfileExists()
    }

    // MARK: - Google Sign-In

    func signInWithGoogle() async throws -> UserProfile {
        let _ = try await client.auth.signInWithOAuth(
            provider: .google
        ) { session in
            session.prefersEphemeralWebBrowserSession = false
        }

        return try await ensureProfileExists()
    }

    // MARK: - Sign Out

    func signOut() async throws {
        try await client.auth.signOut()
    }

    // MARK: - Profile Management

    func ensureProfileExists() async throws -> UserProfile {
        guard let userId = client.auth.currentSession?.user.id else {
            throw AuthError.notAuthenticated
        }

        do {
            let profile: UserProfile = try await client
                .from("profiles")
                .select()
                .eq("id", value: userId)
                .single()
                .execute()
                .value

            return profile
        } catch {
            // Profile doesn't exist, create it
            guard let user = client.auth.currentUser else {
                throw AuthError.notAuthenticated
            }

            let profile = UserProfile(
                id: userId,
                email: user.email ?? "",
                displayName: user.userMetadata["full_name"]?.stringValue,
                onboardingCompleted: false,
                createdAt: Date(),
                subscriptionStatus: .free
            )

            try await createProfile(profile)
            return profile
        }
    }

    func createProfile(_ profile: UserProfile) async throws {
        try await client
            .from("profiles")
            .insert(profile)
            .execute()
    }

    func fetchProfile(userId: UUID) async throws -> UserProfile {
        let profile: UserProfile = try await client
            .from("profiles")
            .select()
            .eq("id", value: userId)
            .single()
            .execute()
            .value

        return profile
    }

    func updateProfile(_ profile: UserProfile) async throws {
        try await client
            .from("profiles")
            .update(profile)
            .eq("id", value: profile.id)
            .execute()
    }

    // MARK: - Onboarding

    func saveOnboarding(_ data: OnboardingData, userId: UUID) async throws {
        struct OnboardingPayload: Codable {
            let userId: UUID
            let age: Int
            let gender: String?
            let fitnessGoal: String
            let fitnessLevel: String
            let workoutPreference: String
            let workoutDuration: String
            let daysPerWeek: Int
            let targetAreas: [String]

            enum CodingKeys: String, CodingKey {
                case userId = "user_id"
                case age
                case gender
                case fitnessGoal = "fitness_goal"
                case fitnessLevel = "fitness_level"
                case workoutPreference = "workout_preference"
                case workoutDuration = "workout_duration"
                case daysPerWeek = "days_per_week"
                case targetAreas = "target_areas"
            }
        }

        let payload = OnboardingPayload(
            userId: userId,
            age: data.age,
            gender: data.gender,
            fitnessGoal: data.fitnessGoal.rawValue,
            fitnessLevel: data.fitnessLevel.rawValue,
            workoutPreference: data.workoutPreference.rawValue,
            workoutDuration: data.workoutDuration.rawValue,
            daysPerWeek: data.daysPerWeek,
            targetAreas: data.targetAreas.map { $0.rawValue }
        )

        try await client
            .from("onboarding")
            .upsert(payload)
            .execute()
    }

    func fetchOnboarding(userId: UUID) async throws -> OnboardingData? {
        struct OnboardingRow: Codable {
            let userId: UUID
            let age: Int
            let gender: String?
            let fitnessGoal: String
            let fitnessLevel: String
            let workoutPreference: String
            let workoutDuration: String
            let daysPerWeek: Int
            let targetAreas: [String]

            enum CodingKeys: String, CodingKey {
                case userId = "user_id"
                case age
                case gender
                case fitnessGoal = "fitness_goal"
                case fitnessLevel = "fitness_level"
                case workoutPreference = "workout_preference"
                case workoutDuration = "workout_duration"
                case daysPerWeek = "days_per_week"
                case targetAreas = "target_areas"
            }
        }

        do {
            let row: OnboardingRow = try await client
                .from("onboarding")
                .select()
                .eq("user_id", value: userId)
                .single()
                .execute()
                .value

            return OnboardingData(
                age: row.age,
                gender: row.gender,
                fitnessGoal: OnboardingData.FitnessGoal(rawValue: row.fitnessGoal) ?? .maintainFitness,
                fitnessLevel: OnboardingData.FitnessLevel(rawValue: row.fitnessLevel) ?? .beginner,
                workoutPreference: OnboardingData.WorkoutPreference(rawValue: row.workoutPreference) ?? .noEquipment,
                workoutDuration: OnboardingData.WorkoutDuration(rawValue: row.workoutDuration) ?? .thirty,
                daysPerWeek: row.daysPerWeek,
                targetAreas: row.targetAreas.compactMap { OnboardingData.TargetArea(rawValue: $0) }
            )
        } catch {
            return nil
        }
    }

    // MARK: - Workouts

    func saveWorkoutPlan(_ plan: WorkoutPlan) async throws {
        try await client
            .from("workout_plans")
            .upsert(plan)
            .execute()
    }

    func fetchWorkoutPlans(userId: UUID) async throws -> [WorkoutPlan] {
        let plans: [WorkoutPlan] = try await client
            .from("workout_plans")
            .select()
            .eq("user_id", value: userId)
            .execute()
            .value

        return plans
    }

    func markWorkoutCompleted(workoutId: UUID) async throws {
        try await client
            .from("workout_plans")
            .update(["is_completed": true])
            .eq("id", value: workoutId)
            .execute()
    }

    // MARK: - History

    func saveWorkoutHistory(_ history: WorkoutHistory) async throws {
        try await client
            .from("workout_history")
            .insert(history)
            .execute()
    }

    func fetchWorkoutHistory(userId: UUID) async throws -> [WorkoutHistory] {
        let history: [WorkoutHistory] = try await client
            .from("workout_history")
            .select()
            .eq("user_id", value: userId)
            .order("completed_at", ascending: false)
            .execute()
            .value

        return history
    }

    // MARK: - Subscription

    func fetchSubscriptionStatus(userId: UUID) async throws -> UserProfile.SubscriptionStatus {
        let profile = try await fetchProfile(userId: userId)
        return profile.subscriptionStatus
    }

    func updateSubscription(userId: UUID, status: UserProfile.SubscriptionStatus) async throws {
        try await client
            .from("profiles")
            .update(["subscription_status": status.rawValue])
            .eq("id", value: userId)
            .execute()
    }
}
