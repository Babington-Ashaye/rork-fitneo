import Foundation

enum BadgeCatalog {
    static let all: [Badge] = [
        Badge(id: "first_rep", name: "First Rep", description: "Complete your first workout", icon: "figure.strengthtraining.traditional"),
        Badge(id: "week_warrior", name: "Week Warrior", description: "Reach a 7-day streak", icon: "flame.fill"),
        Badge(id: "month_beast", name: "Month Beast", description: "Reach a 30-day streak", icon: "calendar.badge.clock"),
        Badge(id: "iron_will", name: "Iron Will", description: "Complete 50 total workouts", icon: "shield.fill"),
        Badge(id: "calorie_crusher", name: "Calorie Crusher", description: "Burn 5,000 total calories", icon: "flame.circle.fill"),
        Badge(id: "nutrition_master", name: "Nutrition Master", description: "Log meals 14 days straight", icon: "fork.knife.circle.fill"),
        Badge(id: "elite_unlocked", name: "Elite Unlocked", description: "Complete the Elite Physique program", icon: "crown.fill"),
        Badge(id: "cardio_king", name: "Cardio King", description: "Complete 20 cardio sessions", icon: "heart.circle.fill"),
        Badge(id: "strength_surge", name: "Strength Surge", description: "Complete 20 strength sessions", icon: "dumbbell.fill"),
        Badge(id: "speed_demon", name: "Speed Demon", description: "Complete 10 HIIT sessions", icon: "bolt.circle.fill"),
        Badge(id: "scale_slayer", name: "Scale Slayer", description: "Log a 5kg drop in weight", icon: "scalemass.fill"),
        Badge(id: "consistency_king", name: "Consistency King", description: "Hit 90% consistency", icon: "checkmark.seal.fill"),
        Badge(id: "jarvis_favorite", name: "Jarvis Favorite", description: "Chat with Jarvis 30 times", icon: "brain.head.profile"),
        Badge(id: "social_climber", name: "Social Climber", description: "Reach the top 3 on the leaderboard", icon: "trophy.fill"),
        Badge(id: "legend_status", name: "Legend Status", description: "Reach Level 6 — Legend", icon: "star.circle.fill")
    ]

    static func badge(id: String) -> Badge? { all.first { $0.id == id } }
}
