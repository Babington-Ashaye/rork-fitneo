import Foundation
import Supabase
import AuthenticationServices

// MARK: - Auth errors

enum AuthError: Error, LocalizedError {
    case invalidCredentials
    case emailAlreadyExists
    case networkError
    case unknown(String)
    case notAuthenticated
    case googleSignInFailed
    case profileCreationFailed

    var errorDescription: String? {
        switch self {
        case .invalidCredentials: return "Invalid email or password."
        case .emailAlreadyExists: return "An account with this email already exists."
        case .networkError: return "Network error. Please check your connection."
        case .unknown(let msg): return msg
        case .notAuthenticated: return "Please sign in to continue."
        case .googleSignInFailed: return "Google sign-in failed. Please try again."
        case .profileCreationFailed: return "Failed to create your profile."
        }
    }
}

// MARK: - Supabase Codable DTOs (nonisolated for background use)

private struct ProfileRow: Codable {
    let id: UUID
    let email: String
    let display_name: String?
    let onboarding_completed: Bool?
    let created_at: String?
}

private struct ProfileUpsert: Codable {
    let id: UUID
    let email: String
    let display_name: String
    let onboarding_completed: Bool
    let created_at: String
}

private struct ProfileUpdate: Codable {
    let fitness_level: String?
    let primary_goal: String?
    let height_cm: Double?
    let weight_kg: Double?
    let goal_weight_kg: Double?
    let onboarding_completed: Bool?
    let last_workout_date: String?
}

private struct WorkoutSessionInsert: Codable {
    let user_id: UUID
    let session_name: String
    let started_at: String
    let completed_at: String
    let duration_seconds: Int
    let total_sets_completed: Int
    let calories_burned: Int
    let xp_earned: Int
}

private struct SetLogInsert: Codable {
    let session_id: String
    let exercise_name: String
    let set_number: Int
    let reps_completed: Int
    let weight_kg: Double
}

private struct LeaderboardUpsert: Codable {
    let user_id: UUID
    let display_name: String
    let avatar_color: String
    let total_xp: Int
    let current_streak: Int
    let workouts_this_week: Int
    let last_updated: String
}

private struct NutritionLogInsert: Codable {
    let user_id: UUID
    let log_date: String
    let meal_type: String
    let food_name: String
    let serving_size: String
    let calories: Int
    let protein_g: Double
    let carbs_g: Double
    let fat_g: Double
    let scan_method: String
}

private struct BodyMetricInsert: Codable {
    let user_id: UUID
    let weight_kg: Double
    let recorded_date: String
}

private struct XPTransactionInsert: Codable {
    let user_id: UUID
    let amount: Int
    let reason: String
    let created_at: String
}

private struct BadgeUpsert: Codable {
    let user_id: UUID
    let badge_id: String
    let badge_name: String
    let earned_at: String
}

private struct ChatMessageInsert: Codable {
    let user_id: UUID
    let session_id: String
    let role: String
    let content: String
    let created_at: String
}

private struct ChatMessageRow: Codable {
    let id: String?
    let session_id: String?
    let role: String
    let content: String
    let created_at: String?
}

private struct ChatSessionUpsert: Codable {
    let id: UUID
    let user_id: UUID
    let title: String
    let created_at: String
}

private struct ChatSessionRow: Codable {
    let id: UUID
    let user_id: UUID
    let title: String
    let created_at: String?
}

private struct FullOnboardingProfileRow: Codable {
    let id: UUID
    let display_name: String
    let age: Int
    let gender: String
    let weight_kg: Double
    let height_cm: Double
    let primary_goal: String
    let fitness_level: String
    let activity_level: String
    let dietary_preference: String
    let daily_calorie_target: Int
    let daily_protein_target: Int
    let daily_carbs_target: Int
    let daily_fat_target: Int
    let onboarding_completed: Bool
}

private struct SubscriptionUpsert: Codable {
    let user_id: UUID
    let plan: String
    let status: String
    let started_at: String
}

private struct WorkoutTemplateInsert: Codable {
    let user_id: UUID
    let program_name: String
    let category: String
    let difficulty: Int
    let duration_minutes: Int
    let description: String
    let exercise_ids: [String]
    let is_premium: Bool
    let is_template: Bool
    let created_at: String
}

// MARK: - SupabaseService

@Observable
@MainActor
final class SupabaseService {
    static let shared = SupabaseService()

    let client: SupabaseClient

    var isAuthenticated: Bool { client.auth.currentSession != nil }
    var userId: UUID? { client.auth.currentSession?.user.id }
    var currentUserEmail: String? { client.auth.currentSession?.user.email }

    private init() {
        self.client = SupabaseClient(
            supabaseURL: URL(string: AppConfig.supabaseURL)!,
            supabaseKey: AppConfig.supabaseAnonKey
        )
    }

    // MARK: - Session

    func restoreSession() async throws -> UserProfile? {
        let session = try await client.auth.session
        return try await ensureProfileExists(userId: session.user.id, email: session.user.email)
    }

    func hasValidSession() async -> Bool {
        (try? await client.auth.session) != nil
    }

    // MARK: - Auth

    func signUp(email: String, password: String, displayName: String? = nil) async throws -> UserProfile {
        do {
            let response = try await client.auth.signUp(email: email, password: password)
            if let session = response.session {
                return try await ensureProfileExists(userId: session.user.id, email: session.user.email, displayName: displayName)
            }
            // No session returned — email confirmation may be pending or user already exists
            let user = response.user
            try? await upsertProfile(userId: user.id, email: user.email ?? email, displayName: displayName)
            return UserProfile(id: user.id, email: user.email ?? email, displayName: displayName, onboardingCompleted: false, createdAt: Date())
        } catch let authErr as AuthError {
            throw authErr
        } catch {
            // Show the REAL Supabase error on screen
            throw AuthError.unknown(error.localizedDescription)
        }
    }

    func signIn(email: String, password: String) async throws -> UserProfile {
        do {
            let session = try await client.auth.signIn(email: email, password: password)
            return try await ensureProfileExists(userId: session.user.id, email: session.user.email)
        } catch let authErr as AuthError {
            throw authErr
        } catch {
            let message = error.localizedDescription.lowercased()
            if message.contains("invalid") || message.contains("credentials") {
                throw AuthError.invalidCredentials
            }
            throw AuthError.unknown(error.localizedDescription)
        }
    }

    func signInWithGoogle() async throws -> UserProfile {
        let redirectURL = URL(string: AppConfig.supabaseAuthCallbackURL)!
        do {
            let session = try await client.auth.signInWithOAuth(
                provider: .google,
                redirectTo: redirectURL
            ) { session in
                session.prefersEphemeralWebBrowserSession = true
            }
            return try await ensureProfileExists(userId: session.user.id, email: session.user.email)
        } catch is CancellationError {
            throw AuthError.googleSignInFailed
        } catch {
            throw AuthError.googleSignInFailed
        }
    }

    func signOut() async throws {
        try await client.auth.signOut()
    }

    func resetPassword(email: String) async throws {
        try await client.auth.resetPasswordForEmail(email)
    }

    // MARK: - Profile

    func ensureProfileExists(userId: UUID, email: String?, displayName: String? = nil) async throws -> UserProfile {
        if let existing = try? await fetchProfile(userId: userId) {
            return existing
        }
        try? await upsertProfile(userId: userId, email: email, displayName: displayName)
        return try await fetchProfile(userId: userId)
    }

    private func upsertProfile(userId: UUID, email: String?, displayName: String?) async throws {
        let row = ProfileUpsert(
            id: userId,
            email: email ?? "",
            display_name: displayName ?? (email ?? ""),
            onboarding_completed: false,
            created_at: ISO8601DateFormatter().string(from: Date())
        )
        try await client.from("user_profiles").upsert(row).execute()
    }

    func fetchProfile(userId: UUID) async throws -> UserProfile {
        let row: ProfileRow = try await client
            .from("user_profiles")
            .select()
            .eq("id", value: userId)
            .single()
            .execute()
            .value

        let date: Date = {
            guard let ts = row.created_at else { return Date() }
            return ISO8601DateFormatter().date(from: ts) ?? Date()
        }()

        return UserProfile(
            id: row.id,
            email: row.email,
            displayName: row.display_name,
            onboardingCompleted: row.onboarding_completed ?? false,
            createdAt: date
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

    func saveOnboardingAnswers(_ data: OnboardingData, userId: UUID) async {
        let update = ProfileUpdate(
            fitness_level: data.fitnessLevel?.rawValue,
            primary_goal: data.goal?.rawValue,
            height_cm: data.heightUnit == .cm ? data.height : data.height * 2.54,
            weight_kg: data.weightUnit == .kg ? data.weight : data.weight * 0.453592,
            goal_weight_kg: data.weight,
            onboarding_completed: true,
            last_workout_date: nil
        )
        do {
            try await client
                .from("user_profiles")
                .update(update)
                .eq("id", value: userId)
                .execute()
        } catch {
            print("[SupabaseService] Failed to update profile after onboarding: \(error)")
        }
    }

    /// Saves the complete onboarding profile including name, age, gender, TDEE, and dietary preference.
    func saveFullOnboardingProfile(
        userId: UUID,
        name: String,
        age: Int,
        gender: String,
        weightKg: Double,
        heightCm: Double,
        goal: String,
        fitnessLevel: String,
        activityLevel: String,
        dietaryPreference: String,
        dailyCalorieTarget: Int
    ) async {
        let row = FullOnboardingProfileRow(
            id: userId,
            display_name: name,
            age: age,
            gender: gender,
            weight_kg: weightKg,
            height_cm: heightCm,
            primary_goal: goal,
            fitness_level: fitnessLevel,
            activity_level: activityLevel,
            dietary_preference: dietaryPreference,
            daily_calorie_target: dailyCalorieTarget,
            daily_protein_target: Int(Double(dailyCalorieTarget) * 0.30 / 4),
            daily_carbs_target: Int(Double(dailyCalorieTarget) * 0.40 / 4),
            daily_fat_target: Int(Double(dailyCalorieTarget) * 0.30 / 9),
            onboarding_completed: true
        )
        do {
            try await client
                .from("user_profiles")
                .upsert(row)
                .execute()
        } catch {
            print("[SupabaseService] Failed to save full onboarding profile: \(error)")
        }
    }

    // MARK: - Workout sessions

    func saveWorkoutSession(_ workout: CompletedWorkout, userId: UUID) async {
        let fmt = ISO8601DateFormatter()
        let startedAt = workout.completedAt.addingTimeInterval(-Double(workout.durationSeconds))
        let row = WorkoutSessionInsert(
            user_id: userId,
            session_name: workout.name,
            started_at: fmt.string(from: startedAt),
            completed_at: fmt.string(from: workout.completedAt),
            duration_seconds: workout.durationSeconds,
            total_sets_completed: workout.setsCompleted,
            calories_burned: workout.caloriesBurned,
            xp_earned: workout.xpEarned
        )
        do { try await client.from("workout_sessions").insert(row).execute() }
        catch { print("[SupabaseService] Failed to save workout session: \(error)") }
    }

    func saveSetLog(sessionId: String, exerciseName: String, setNumber: Int, reps: Int, weightKg: Double = 0) async {
        let row = SetLogInsert(
            session_id: sessionId,
            exercise_name: exerciseName,
            set_number: setNumber,
            reps_completed: reps,
            weight_kg: weightKg
        )
        do { try await client.from("session_sets_log").insert(row).execute() }
        catch { print("[SupabaseService] Failed to save set log: \(error)") }
    }

    func updateProfileAfterWorkout(xpEarned: Int, userId: UUID) async {
        let update = ProfileUpdate(
            fitness_level: nil, primary_goal: nil, height_cm: nil, weight_kg: nil,
            goal_weight_kg: nil, onboarding_completed: nil,
            last_workout_date: ISO8601DateFormatter().string(from: Date())
        )
        do {
            try await client
                .from("user_profiles")
                .update(update)
                .eq("id", value: userId)
                .execute()
        } catch {
            print("[SupabaseService] Failed to update profile after workout: \(error)")
        }
    }

    // MARK: - Leaderboard

    func syncLeaderboard(xp: Int, streak: Int, workoutsThisWeek: Int, userId: UUID, displayName: String) async {
        let row = LeaderboardUpsert(
            user_id: userId,
            display_name: displayName,
            avatar_color: "#0A84FF",
            total_xp: xp,
            current_streak: streak,
            workouts_this_week: workoutsThisWeek,
            last_updated: ISO8601DateFormatter().string(from: Date())
        )
        do { try await client.from("leaderboard_entries").upsert(row).execute() }
        catch { print("[SupabaseService] Failed to sync leaderboard: \(error)") }
    }

    func fetchLeaderboard(by tab: String = "xp") async -> [[String: Any]] {
        let column = tab == "streak" ? "current_streak" : tab == "weekly" ? "workouts_this_week" : "total_xp"
        do {
            let response = try await client
                .from("leaderboard_entries")
                .select()
                .order(column, ascending: false)
                .limit(50)
                .execute()
            return (try? JSONSerialization.jsonObject(with: response.data) as? [[String: Any]]) ?? []
        } catch {
            print("[SupabaseService] Failed to fetch leaderboard: \(error)")
            return []
        }
    }

    // MARK: - Nutrition

    func saveFoodLog(entry: FoodEntry, userId: UUID) async {
        let row = NutritionLogInsert(
            user_id: userId,
            log_date: FitneoStore.dayKey(entry.loggedAt),
            meal_type: entry.mealType.rawValue,
            food_name: entry.name,
            serving_size: "\(entry.portion)x",
            calories: entry.calories,
            protein_g: entry.protein,
            carbs_g: entry.carbs,
            fat_g: entry.fat,
            scan_method: "manual"
        )
        do { try await client.from("nutrition_logs").insert(row).execute() }
        catch { print("[SupabaseService] Failed to save food log: \(error)") }
    }

    // MARK: - Body metrics

    func saveWeightEntry(weight: Double, date: Date, userId: UUID) async {
        let row = BodyMetricInsert(
            user_id: userId,
            weight_kg: weight,
            recorded_date: ISO8601DateFormatter().string(from: date)
        )
        do { try await client.from("body_metrics").insert(row).execute() }
        catch { print("[SupabaseService] Failed to save weight: \(error)") }
    }

    // MARK: - XP

    func saveXPTransaction(amount: Int, reason: String, userId: UUID) async {
        let row = XPTransactionInsert(
            user_id: userId,
            amount: amount,
            reason: reason,
            created_at: ISO8601DateFormatter().string(from: Date())
        )
        do { try await client.from("xp_transactions").insert(row).execute() }
        catch { print("[SupabaseService] Failed to save XP: \(error)") }
    }

    // MARK: - Badges

    func saveBadge(badgeId: String, badgeName: String, userId: UUID) async {
        let row = BadgeUpsert(
            user_id: userId,
            badge_id: badgeId,
            badge_name: badgeName,
            earned_at: ISO8601DateFormatter().string(from: Date())
        )
        do { try await client.from("badges").upsert(row).execute() }
        catch { print("[SupabaseService] Failed to save badge: \(error)") }
    }

    // MARK: - Chat sessions

    func createChatSession(userId: UUID, title: String) async -> UUID {
        let sessionId = UUID()
        let row = ChatSessionUpsert(
            id: sessionId,
            user_id: userId,
            title: title,
            created_at: ISO8601DateFormatter().string(from: Date())
        )
        do {
            try await client.from("chat_sessions").insert(row).execute()
        } catch {
            print("[SupabaseService] Failed to create chat session: \(error)")
        }
        return sessionId
    }

    func fetchChatSessions(userId: UUID) async -> [(id: UUID, title: String, createdAt: Date)] {
        do {
            let rows: [ChatSessionRow] = try await client
                .from("chat_sessions")
                .select()
                .eq("user_id", value: userId)
                .order("created_at", ascending: false)
                .limit(30)
                .execute()
                .value
            return rows.compactMap { row in
                let date = row.created_at.flatMap { ISO8601DateFormatter().date(from: $0) } ?? Date()
                return (id: row.id, title: row.title, createdAt: date)
            }
        } catch {
            print("[SupabaseService] Failed to fetch chat sessions: \(error)")
            return []
        }
    }

    func updateChatSessionTitle(sessionId: UUID, title: String) async {
        do {
            try await client
                .from("chat_sessions")
                .update(["title": title])
                .eq("id", value: sessionId)
                .execute()
        } catch {
            print("[SupabaseService] Failed to update session title: \(error)")
        }
    }

    // MARK: - AI chat messages (with session support)

    func saveChatMessage(role: String, content: String, userId: UUID, sessionId: String) async {
        let row = ChatMessageInsert(
            user_id: userId,
            session_id: sessionId,
            role: role,
            content: content,
            created_at: ISO8601DateFormatter().string(from: Date())
        )
        do { try await client.from("chat_messages").insert(row).execute() }
        catch { print("[SupabaseService] Failed to save chat message: \(error)") }
    }

    func fetchChatHistory(userId: UUID, sessionId: String? = nil, limit: Int = 50) async -> [FitneoAIMessage] {
        do {
            var query = client
                .from("chat_messages")
                .select()
                .eq("user_id", value: userId)
            if let sid = sessionId {
                query = query.eq("session_id", value: sid)
            }
            let rows: [ChatMessageRow] = try await query
                .order("created_at", ascending: true)
                .limit(limit)
                .execute()
                .value

            return rows.compactMap { row in
                let role: FitneoAIRole = row.role == "user" ? .user : .coach
                let date = row.created_at.flatMap { ISO8601DateFormatter().date(from: $0) } ?? Date()
                return FitneoAIMessage(id: UUID(), role: role, text: row.content, date: date)
            }
        } catch {
            print("[SupabaseService] Failed to fetch chat history: \(error)")
            return []
        }
    }

    // MARK: - Subscriptions

    func startTrialSubscription(userId: UUID) async {
        let row = SubscriptionUpsert(
            user_id: userId,
            plan: "trial",
            status: "active",
            started_at: ISO8601DateFormatter().string(from: Date())
        )
        do { try await client.from("subscriptions").upsert(row).execute() }
        catch { print("[SupabaseService] Failed to start trial: \(error)") }
    }

    // MARK: - Workout templates

    func saveWorkoutTemplate(_ program: WorkoutProgram, userId: UUID) async {
        let row = WorkoutTemplateInsert(
            user_id: userId,
            program_name: program.name,
            category: program.category.rawValue,
            difficulty: program.difficulty.rawValue,
            duration_minutes: program.durationMinutes,
            description: program.description,
            exercise_ids: program.exerciseIDs,
            is_premium: program.isPremium,
            is_template: true,
            created_at: ISO8601DateFormatter().string(from: Date())
        )
        do { try await client.from("workout_programs").insert(row).execute() }
        catch { print("[SupabaseService] Failed to save template: \(error)") }
    }
}