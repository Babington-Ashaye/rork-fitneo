import Foundation

/// Local rule-based coaching engine for Jarvis.
/// Detects intents and generates personalized, data-aware responses without a network call.
enum JarvisIntent: Sendable {
    case startWorkout
    case pause
    case next
    case tired
    case progress
    case harder
    case easier
    case logFood(String)
    case restDay
    case chat
}

enum JarvisBrain {

    static func detectIntent(_ message: String) -> JarvisIntent {
        let m = message.lowercased()
        if m.contains("start workout") || m.contains("train me") || m.contains("let's go") || m.contains("lets go") || m.contains("autopilot") {
            return .startWorkout
        }
        if m.contains("pause") || m.contains("stop workout") { return .pause }
        if m == "next" || m.contains("skip") { return .next }
        if m.contains("tired") || m.contains("fatigued") || m.contains("exhausted") { return .tired }
        if m.contains("how am i doing") || m.contains("progress") || m.contains("my stats") { return .progress }
        if m.contains("make it harder") || m.contains("harder") || m.contains("more intense") { return .harder }
        if m.contains("make it easier") || m.contains("easier") || m.contains("lighter") { return .easier }
        if m.contains("rest day") || m.contains("recover") { return .restDay }
        if m.hasPrefix("log ") || m.contains("log my") {
            let food = m.replacingOccurrences(of: "log ", with: "").trimmingCharacters(in: .whitespaces)
            return .logFood(food)
        }
        return .chat
    }

    /// Generates a personalized coach response using stored data.
    static func respond(to message: String,
                        intent: JarvisIntent,
                        user: AppUser,
                        memory: JarvisMemory,
                        personality: String) -> String {
        let name = user.name
        switch intent {
        case .startWorkout:
            return "Locked in, \(name). Based on your history I've programmed a session matched to your level. Tap Quick Start on Home or open Workouts. Let's move."
        case .pause:
            return "Paused. Catch your breath — when you're ready, hit resume. Don't let the rest stretch too long."
        case .next:
            return "Moving on. Reset your form before the next set and breathe through it."
        case .tired:
            return "Heard. I've logged your fatigue. Today, drop the intensity 20% and shorten rest — keep the streak alive without burning out. Next step: do the Mobility & Flexibility session."
        case .progress:
            return progressSummary(user: user, memory: memory)
        case .harder:
            return "Beast mode. Add a set to each exercise, cut rest by 15 seconds, and push the last rep to failure. Your \(memory.currentStreak)-day streak says you can handle it."
        case .easier:
            return "Smart call. Reduce to 2 sets, slow the tempo, and rest fully between sets. Consistency beats intensity every time. Next step: start the Full Body Beginner program."
        case .logFood(let food):
            let f = food.isEmpty ? "that" : "“\(food)”"
            return "Open the Nutrition tab and search \(f) — I'll calculate the macros instantly. You're averaging \(memory.avgDailyCalories) kcal/day right now."
        case .restDay:
            return "Rest is where growth happens. Logged it. Hydrate, stretch, and sleep well — we go again tomorrow."
        case .chat:
            return chatResponse(message: message, user: user, memory: memory, personality: personality)
        }
    }

    private static func progressSummary(user: AppUser, memory: JarvisMemory) -> String {
        var parts: [String] = []
        parts.append("Here's the read, \(user.name):")
        parts.append("• \(memory.totalWorkoutsAllTime) total workouts, \(memory.totalWorkoutsThisWeek) this week")
        parts.append("• \(memory.currentStreak)-day streak (best: \(memory.longestStreak))")
        parts.append("• Consistency \(memory.consistencyScore)%")
        let close: String
        if memory.currentStreak >= 7 {
            close = "Elite territory. Keep stacking days."
        } else if memory.totalWorkoutsAllTime == 0 {
            close = "Let's get workout #1 on the board today."
        } else {
            close = "Push for a full week — that's your next milestone."
        }
        parts.append(close)
        return parts.joined(separator: "\n")
    }

    private static func chatResponse(message: String, user: AppUser, memory: JarvisMemory, personality: String) -> String {
        let lib = personalityLibrary(personality)
        // Pick a contextual response, lightly personalized.
        let base = lib.randomElement() ?? "Stay focused and trust the process."
        let goal = user.goals.first ?? "your goal"
        let nudge: String
        if memory.currentStreak == 0 {
            nudge = "Let's start a new streak today."
        } else if memory.totalWorkoutsThisWeek < user.weeklyWorkoutGoal {
            nudge = "You're \(user.weeklyWorkoutGoal - memory.totalWorkoutsThisWeek) workout(s) from your weekly target."
        } else {
            nudge = "You've already hit your weekly target — momentum is on your side."
        }
        return "\(base) Toward \(goal.lowercased()), every session compounds. \(nudge) Next step: pick a workout and start."
    }

    private static func personalityLibrary(_ personality: String) -> [String] {
        switch personality {
        case "drill_sergeant":
            return [
                "No excuses today. The work doesn't care how you feel.",
                "Comfort is the enemy. Get after it.",
                "You said you wanted results — prove it now.",
                "Champions train when they don't feel like it.",
                "Stop negotiating with yourself. Move."
            ]
        case "motivational":
            return [
                "Today's the day you outwork yesterday.",
                "Energy up — you've got more in the tank than you think.",
                "Big goals demand big effort. Let's bring it.",
                "Every rep is a vote for the person you're becoming.",
                "Momentum is built one session at a time. Go."
            ]
        default: // supportive
            return [
                "You're doing great — small steps add up fast.",
                "Be proud of showing up; that's the hardest part.",
                "Progress isn't always loud. Trust your consistency.",
                "However today goes, you're moving forward.",
                "I'm with you every step. Let's keep it gentle and steady."
            ]
        }
    }

    /// Proactive insight surfaced on app open.
    static func proactiveInsight(user: AppUser, memory: JarvisMemory, loggedToday: Bool, workedOutYesterday: Bool) -> String {
        if memory.currentStreak >= 7 {
            return "\(memory.currentStreak) days straight. Elite territory — keep it alive."
        }
        if memory.currentStreak == 0 && memory.totalWorkoutsAllTime > 0 {
            return "You skipped recently — want to make up for it today?"
        }
        if memory.totalWorkoutsAllTime == 0 {
            return "Welcome, \(user.name). Your first workout is the spark — let's light it."
        }
        if memory.consistencyScore >= 70 {
            return "Your consistency is at \(memory.consistencyScore)%. You're building a real habit."
        }
        if memory.totalWorkoutsThisWeek < user.weeklyWorkoutGoal {
            let left = user.weeklyWorkoutGoal - memory.totalWorkoutsThisWeek
            return "You're \(left) workout(s) away from your weekly goal. You've got this."
        }
        return "Weekly target hit. Consider a recovery or mobility session to stay fresh."
    }
}
