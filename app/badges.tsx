import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { EmptySpacer, GlassCard, ScreenTitle, SkeletonBlock } from "@/components/ScreenKit";
import { EarnedBadge, fetchEarnedBadges } from "@/lib/api";
import { colors } from "@/lib/theme";

type BadgeDefinition = { id: string; name: string; description: string; icon: keyof typeof Ionicons.glyphMap; tint: string };

const baseCatalog: BadgeDefinition[] = [
  { id: "first_rep", name: "First Rep", description: "Complete your first workout", icon: "barbell", tint: colors.accent },
  { id: "week_warrior", name: "Week Warrior", description: "Reach a 7-day streak", icon: "flame", tint: colors.coral },
  { id: "month_beast", name: "Month Beast", description: "Reach a 30-day streak", icon: "calendar", tint: colors.gold },
  { id: "iron_will", name: "Iron Will", description: "Complete 50 workouts", icon: "shield", tint: colors.teal },
  { id: "calorie_crusher", name: "Calorie Crusher", description: "Burn 5,000 calories", icon: "flame-outline", tint: "#FF9500" },
  { id: "nutrition_master", name: "Nutrition Master", description: "Log meals for 14 days", icon: "restaurant", tint: colors.success },
  { id: "elite_unlocked", name: "Elite Unlocked", description: "Complete Elite Physique", icon: "diamond", tint: colors.gold },
  { id: "cardio_king", name: "Cardio King", description: "Complete 20 cardio sessions", icon: "heart", tint: colors.coral },
  { id: "strength_surge", name: "Strength Surge", description: "Complete 20 strength sessions", icon: "fitness", tint: colors.accent },
  { id: "speed_demon", name: "Speed Demon", description: "Complete 10 HIIT sessions", icon: "flash", tint: colors.gold },
  { id: "scale_slayer", name: "Scale Slayer", description: "Track a 5kg change", icon: "speedometer", tint: colors.teal },
  { id: "consistency_king", name: "Consistency King", description: "Hit 90% consistency", icon: "checkmark-done-circle", tint: colors.success },
  { id: "fitneo_ai_favorite", name: "AI Favorite", description: "Chat with FITNEO AI 30 times", icon: "sparkles", tint: colors.accent },
  { id: "social_climber", name: "Social Climber", description: "Reach the leaderboard top 3", icon: "trophy", tint: colors.gold },
  { id: "legend_status", name: "Legend Status", description: "Reach level 6", icon: "star", tint: "#A78BFA" }
];

const milestoneCatalog: BadgeDefinition[] = [
  { id: "hydration_hero", name: "Hydration Hero", description: "Log water 7 days in a row", icon: "water", tint: colors.teal },
  { id: "protein_pro", name: "Protein Pro", description: "Hit protein goal 10 times", icon: "nutrition", tint: colors.success },
  { id: "early_bird", name: "Early Bird", description: "Complete 5 morning workouts", icon: "sunny", tint: colors.gold },
  { id: "night_grinder", name: "Night Grinder", description: "Complete 5 evening workouts", icon: "moon", tint: "#A78BFA" },
  { id: "mobility_monk", name: "Mobility Monk", description: "Complete 15 mobility sessions", icon: "body", tint: colors.teal },
  { id: "core_commander", name: "Core Commander", description: "Complete 25 core sessions", icon: "radio-button-on", tint: colors.accent },
  { id: "home_athlete", name: "Home Athlete", description: "Complete 20 no-equipment workouts", icon: "home", tint: colors.success },
  { id: "gym_general", name: "Gym General", description: "Complete 20 gym workouts", icon: "business", tint: colors.gold },
  { id: "sports_rookie", name: "Sports Rookie", description: "Calibrate your first sports plan", icon: "football", tint: "#22C55E" },
  { id: "sports_pro", name: "Sports Pro", description: "Complete 10 sports sessions", icon: "medal", tint: colors.gold },
  { id: "soccer_engine", name: "Soccer Engine", description: "Complete a football athletic plan", icon: "football", tint: "#22C55E" },
  { id: "court_ready", name: "Court Ready", description: "Complete a basketball session", icon: "basketball", tint: "#F59E0B" },
  { id: "ring_ready", name: "Ring Ready", description: "Complete a boxing session", icon: "accessibility", tint: "#F97316" },
  { id: "track_machine", name: "Track Machine", description: "Complete a running session", icon: "walk", tint: "#3B82F6" },
  { id: "swim_strong", name: "Swim Strong", description: "Complete a swimming session", icon: "water", tint: "#06B6D4" },
  { id: "meal_scanner", name: "Meal Scanner", description: "Scan your first meal", icon: "camera", tint: colors.accent },
  { id: "barcode_boss", name: "Barcode Boss", description: "Scan your first barcode", icon: "barcode", tint: colors.teal },
  { id: "data_exporter", name: "Data Exporter", description: "Export your FITNEO data", icon: "download", tint: "#94A3B8" },
  { id: "plan_builder", name: "Plan Builder", description: "Create a custom workout", icon: "construct", tint: colors.accent },
  { id: "set_finisher", name: "Set Finisher", description: "Complete 100 total sets", icon: "checkmark-circle", tint: colors.success },
  { id: "rep_machine", name: "Rep Machine", description: "Complete 1,000 total reps", icon: "repeat", tint: colors.coral },
  { id: "xp_500", name: "500 XP Club", description: "Earn 500 XP", icon: "flash", tint: colors.gold },
  { id: "xp_1000", name: "1K XP Club", description: "Earn 1,000 XP", icon: "rocket", tint: colors.accent },
  { id: "xp_5000", name: "5K XP Club", description: "Earn 5,000 XP", icon: "planet", tint: "#A78BFA" },
  { id: "streak_3", name: "Three-Day Spark", description: "Reach a 3-day streak", icon: "bonfire", tint: colors.coral },
  { id: "streak_14", name: "Two-Week Lock", description: "Reach a 14-day streak", icon: "lock-closed", tint: colors.gold },
  { id: "streak_60", name: "Sixty Strong", description: "Reach a 60-day streak", icon: "ribbon", tint: colors.teal },
  { id: "streak_100", name: "Century Streak", description: "Reach a 100-day streak", icon: "trophy", tint: colors.gold },
  { id: "nutrition_7", name: "Macro Starter", description: "Log nutrition for 7 days", icon: "leaf", tint: colors.success },
  { id: "nutrition_30", name: "Macro Master", description: "Log nutrition for 30 days", icon: "restaurant", tint: colors.success },
  { id: "coach_5", name: "Coach Check-in", description: "Chat with FITNEO AI 5 times", icon: "chatbubble-ellipses", tint: colors.accent },
  { id: "coach_100", name: "AI Training Partner", description: "Chat with FITNEO AI 100 times", icon: "hardware-chip", tint: colors.accent },
  { id: "recovery_respect", name: "Recovery Respect", description: "Complete 10 recovery flows", icon: "bed", tint: colors.teal },
  { id: "fat_loss_focus", name: "Fat Loss Focus", description: "Complete 10 fat-loss circuits", icon: "flame", tint: colors.coral },
  { id: "fitneo_legend", name: "FITNEO Legend", description: "Unlock 40 achievements", icon: "star", tint: "#FACC15" }
];

const catalog = [...baseCatalog, ...milestoneCatalog].slice(0, 50);

export default function BadgesScreen() {
  const [earned, setEarned] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchEarnedBadges().then(setEarned).finally(() => setLoading(false));
  }, []);
  const earnedIds = useMemo(() => new Set(earned.map((badge) => badge.badgeId)), [earned]);

  return (
    <AppLayout scroll>
      <ScreenTitle title="Achievements" subtitle={`${earned.length} of ${catalog.length} milestones unlocked`} />
      {loading ? (
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, index) => <SkeletonBlock key={index} height={154} radius={16} style={styles.cell} />)}
        </View>
      ) : (
        <View style={styles.grid}>
          {catalog.map((badge) => {
            const unlocked = earnedIds.has(badge.id);
            return (
              <GlassCard key={badge.id} radius={16} selected={unlocked} style={[styles.badge, !unlocked && styles.locked]}>
                <View style={[styles.iconCircle, { backgroundColor: unlocked ? `${badge.tint}22` : "rgba(255,255,255,0.04)" }]}>
                  <Ionicons name={unlocked ? badge.icon : "lock-closed"} size={25} color={unlocked ? badge.tint : colors.textTertiary} />
                </View>
                <Text style={styles.badgeTitle}>{badge.name}</Text>
                <Text style={styles.description}>{badge.description}</Text>
              </GlassCard>
            );
          })}
        </View>
      )}
      <EmptySpacer />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  cell: { width: "48%" },
  badge: { alignItems: "center", gap: 8, minHeight: 154, padding: 14, width: "48%" },
  locked: { opacity: 0.62 },
  iconCircle: { alignItems: "center", borderRadius: 27, height: 54, justifyContent: "center", width: 54 },
  badgeTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: "800", textAlign: "center" },
  description: { color: colors.textTertiary, fontSize: 10, lineHeight: 14, textAlign: "center" }
});
