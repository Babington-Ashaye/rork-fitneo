import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { EmptySpacer, GlassCard, ScreenTitle, SkeletonBlock } from "@/components/ScreenKit";
import { EarnedBadge, fetchEarnedBadges } from "@/lib/api";
import { colors } from "@/lib/theme";

const catalog: Array<{ id: string; name: string; description: string; icon: keyof typeof Ionicons.glyphMap; tint: string }> = [
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
