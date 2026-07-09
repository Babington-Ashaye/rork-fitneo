import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { EmptySpacer, ErrorState, IconBubble, MetaItem, PillButton, SectionHeader, SkeletonBlock, StatCard, TouchableCard, XPBar, withAlpha } from "@/components/ScreenKit";
import { DashboardData, fetchActiveWorkoutPlan, fetchDashboardData, WorkoutProgram } from "@/lib/api";
import { colors, radii } from "@/lib/theme";
import { useAuth } from "@/context/AuthContext";
import { loadWaterIntake, saveWaterIntake } from "@/lib/water";

export default function DashboardScreen() {
  const { needsOnboarding, user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [plan, setPlan] = useState<WorkoutProgram | null>(null);
  const [planOpen, setPlanOpen] = useState(false);

  async function loadDashboard() {
    setError(null);
    setIsLoading(true);
    try {
      const [dashboard, activePlan] = await Promise.all([
        fetchDashboardData(),
        fetchActiveWorkoutPlan()
      ]);
      const waterCurrent = await loadWaterIntake(user?.id ?? null, dashboard.waterGoal);
      setData({ ...dashboard, waterCurrent });
      setPlan(activePlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function updateWaterIntake(amount: number) {
    if (!data) return;
    const previous = data.waterCurrent;
    setData({ ...data, waterCurrent: amount });
    try {
      await saveWaterIntake(user?.id ?? null, amount, data.waterGoal);
    } catch {
      setData((current) => current ? { ...current, waterCurrent: previous } : current);
    }
  }

  if (isLoading) {
    return (
      <AppLayout scroll>
        <View style={styles.skeletonStack}>
          <SkeletonBlock height={68} />
          <SkeletonBlock height={76} />
          <SkeletonBlock height={190} radius={18} />
          <View style={styles.statRow}>
            <SkeletonBlock height={124} radius={16} style={styles.statCell} />
            <SkeletonBlock height={124} radius={16} style={styles.statCell} />
          </View>
        </View>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout scroll>
        <ErrorState message={error ?? "Dashboard data is unavailable."} onRetry={loadDashboard} />
      </AppLayout>
    );
  }

  const xpInto = data.xp % data.xpSpan;

  if (needsOnboarding) {
    return (
      <AppLayout scroll>
        <TouchableCard radius={radii.xxl} style={styles.onboardingGate} onPress={() => router.replace("/onboarding")}>
          <IconBubble icon="person-circle" size={52} />
          <View style={styles.flex}>
            <Text style={styles.gateTitle}>Complete your profile to see your plan</Text>
            <Text style={styles.gateCopy}>FITNEO needs your goals, fitness level, and baseline metrics before generating your My Plan dashboard.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableCard>
      </AppLayout>
    );
  }

  return (
    <AppLayout scroll>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.greeting}>Good morning</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.name}>{data.displayName}</Text>
        </View>
        <TouchableCard radius={radii.lg} style={styles.streakPill} onPress={() => Alert.alert("Streak", `${data.streak} day streak`)}>
          <Ionicons name="flame" size={28} color={colors.coral} />
          <Text style={styles.streakText}>{data.streak}</Text>
        </TouchableCard>
      </View>

      <XPBar level={data.level} rankTitle={data.rankTitle} progress={xpInto / data.xpSpan} xpInto={xpInto} xpSpan={data.xpSpan} />

      <TouchableCard radius={radii.xxl} style={styles.planHeader} onPress={() => setPlanOpen((current) => !current)}>
        <View style={styles.inline}>
          <Ionicons name="sparkles" size={14} color={colors.accent} />
          <SectionHeader title="MY PLAN" accent />
          <Text numberOfLines={1} style={styles.planName}>{plan?.name ?? data.todayWorkout.name}</Text>
        </View>
        <Ionicons name={planOpen ? "chevron-up" : "chevron-down"} size={14} color={colors.textSecondary} />
      </TouchableCard>
      {planOpen ? (
        <View style={styles.planDetails}>
          <View style={styles.planMeta}>
            <MetaItem icon="time" text={`${plan?.durationMinutes ?? data.todayWorkout.durationMinutes} min`} />
            <MetaItem icon="layers" text={`${plan?.exercises ?? 6} exercises`} />
            <MetaItem icon="bar-chart" text={plan?.category ?? data.todayWorkout.category} />
          </View>
          <Text style={styles.planCopy}>Your active plan is calibrated from onboarding and your latest FITNEO AI programming.</Text>
          <TouchableOpacity style={styles.planStart} onPress={() => router.push("/active-workout")}>
            <Text style={styles.planStartText}>Start active plan</Text>
            <Ionicons name="play" size={14} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableCard radius={radii.hero} style={styles.heroCard} onPress={() => router.push("/active-workout")}>
        <View style={styles.heroTop}>
          <View style={styles.inline}>
            <Ionicons name="sparkles" size={13} color={colors.accent} />
            <Text style={styles.heroKicker}>TODAY'S WORKOUT</Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{data.todayWorkout.category}</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>{data.todayWorkout.name}</Text>
        <View style={styles.metaRow}>
          <MetaItem icon="time" text={`${data.todayWorkout.durationMinutes} min`} />
          <MetaItem icon="flame" text={`${data.todayWorkout.calories} kcal`} />
          <MetaItem icon="bar-chart" text={data.todayWorkout.difficulty} />
        </View>
        <View style={styles.heroActions}>
          <TouchableOpacity activeOpacity={0.78} style={styles.quickStart} onPress={() => router.push("/active-workout")}>
            <PillButton title="Quick Start" icon="play" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.78} style={styles.aiButton} onPress={() => router.push("/(tabs)/coach")}>
            <Ionicons name="sparkles" size={21} color={colors.accent} />
            <Text style={styles.aiText}>AI</Text>
          </TouchableOpacity>
        </View>
        <Ionicons name="barbell" size={90} color="rgba(10,132,255,0.08)" style={styles.heroWatermark} />
      </TouchableCard>

      <View style={styles.statRow}>
        <StatCard icon="flame" value={String(data.caloriesToday)} label="Cal today" tint={colors.coral} onPress={() => Alert.alert("Calories burned today", `${data.caloriesToday} kcal`)} />
        <StatCard icon="barbell" value={String(data.workoutsThisWeek)} label="This week" onPress={() => router.push("/(tabs)/progress")} />
      </View>
      <View style={styles.statRow}>
        <StatCard icon="time" value={String(data.activeMinutes)} label="Active min" tint={colors.teal} onPress={() => Alert.alert("Active minutes", `${data.activeMinutes} minutes today`)} />
        <StatCard icon="flame-outline" value={String(data.streak)} label="Streak" tint="#FF9500" onPress={() => Alert.alert("Streak", `${data.streak} day streak`)} />
      </View>

      <TouchableCard radius={radii.xxl} style={styles.cardStack} onPress={() => router.push("/(tabs)/progress")}>
        <SectionHeader title="GOALS" />
        <GoalRow title="Weekly workouts" value={data.workoutsThisWeek} target={data.weeklyWorkoutGoal} tint={colors.accent} />
        <GoalRow title="Calories burned" value={data.caloriesToday} target={data.calorieBurnGoal} tint={colors.coral} />
        <GoalRow title="Calories eaten" value={data.caloriesEaten} target={data.calorieEatGoal} tint={colors.gold} />
      </TouchableCard>

      <TouchableCard radius={radii.xxl} style={styles.cardStack}>
        <View style={styles.rowBetween}>
          <View style={styles.inline}>
            <Ionicons name="water" size={16} color={colors.textPrimary} />
            <Text style={styles.cardTitle}>Water intake</Text>
          </View>
          <Text style={styles.accentMeta}>{data.waterCurrent} / {data.waterGoal}</Text>
        </View>
        <View style={styles.waterRow}>
          {Array.from({ length: data.waterGoal }).map((_, index) => (
            <TouchableOpacity
              accessibilityLabel={`Set water intake to ${((index + 1) * 0.25).toFixed(2)} liters`}
              accessibilityRole="button"
              key={index}
              onPress={() => void updateWaterIntake(index + 1)}
              style={[styles.waterDrop, index < data.waterCurrent && styles.waterDropActive]}
            >
              <Ionicons name="water" size={18} color={index < data.waterCurrent ? colors.textPrimary : colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.waterLiters}>{(data.waterCurrent * 0.25).toFixed(2)} L logged today</Text>
      </TouchableCard>

      <TouchableCard radius={radii.xxl} style={styles.insightCard} onPress={() => router.push("/(tabs)/coach")}>
        <IconBubble icon="bulb" size={44} />
        <View style={styles.flex}>
          <Text style={styles.insightTitle}>FITNEO AI Insight</Text>
          <Text style={styles.insightText}>You are building momentum. Keep today's session controlled and finish with protein.</Text>
        </View>
      </TouchableCard>

      <TouchableCard radius={radii.xxl} style={styles.cardStack} onPress={() => router.push("/(tabs)/progress")}>
        <SectionHeader title="RECENT ACTIVITY" />
        {data.recentActivity.length > 0 ? (
          data.recentActivity.map((item) => <Text key={item} style={styles.activityText}>{item}</Text>)
        ) : (
          <Text style={styles.emptyText}>No workouts yet - start your first session to see it here.</Text>
        )}
      </TouchableCard>

      <EmptySpacer />
    </AppLayout>
  );
}

function GoalRow({ title, value, target, tint }: { title: string; value: number; target: number; tint: string }) {
  return (
    <View style={styles.goalRow}>
      <View style={styles.rowBetween}>
        <Text style={styles.goalTitle}>{title}</Text>
        <Text style={styles.goalValue}>{value} / {target}</Text>
      </View>
      <View style={styles.goalTrack}>
        <View style={[styles.goalFill, { width: `${Math.min(100, (value / target) * 100)}%`, backgroundColor: tint }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 8
  },
  headerCopy: {
    flex: 1,
    minWidth: 0
  },
  greeting: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "500"
  },
  name: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "700",
    minWidth: 0
  },
  streakPill: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexShrink: 0
  },
  streakText: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700"
  },
  planHeader: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 58,
    justifyContent: "space-between",
    paddingHorizontal: 18
  },
  inline: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7
  },
  planName: {
    color: colors.textPrimary,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "700"
  },
  heroCard: {
    gap: 16,
    overflow: "hidden",
    padding: 22
  },
  heroTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  heroKicker: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5
  },
  categoryBadge: {
    backgroundColor: withAlpha(colors.accent, 0.2),
    borderRadius: radii.round,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  categoryText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "700"
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "700"
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18
  },
  heroActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginTop: 4
  },
  quickStart: {
    flex: 1
  },
  aiButton: {
    alignItems: "center",
    gap: 4,
    minWidth: 44
  },
  aiText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1
  },
  heroWatermark: {
    position: "absolute",
    right: 10,
    top: -10
  },
  statRow: {
    flexDirection: "row",
    gap: 12
  },
  statCell: {
    flex: 1
  },
  skeletonStack: {
    gap: 14,
    width: "100%"
  },
  planDetails: {
    backgroundColor: "rgba(10,132,255,0.07)",
    borderColor: "rgba(10,132,255,0.25)",
    borderRadius: 16,
    borderWidth: 1,
    gap: 13,
    marginTop: -10,
    padding: 16
  },
  planMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16
  },
  planCopy: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19
  },
  planStart: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  planStartText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "800"
  },
  cardStack: {
    gap: 16,
    padding: 20
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700"
  },
  accentMeta: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700"
  },
  waterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 4
  },
  waterDrop: { alignItems: "center", borderColor: "rgba(255,255,255,0.12)", borderRadius: 18, borderWidth: 1, height: 36, justifyContent: "center", width: 36 },
  waterDropActive: { backgroundColor: colors.accent, borderColor: "rgba(255,255,255,0.72)" },
  waterLiters: { color: colors.textSecondary, fontSize: 11, fontWeight: "700" },
  insightCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    padding: 20
  },
  flex: {
    flex: 1
  },
  onboardingGate: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    padding: 18
  },
  gateTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900"
  },
  gateCopy: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4
  },
  insightTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700"
  },
  insightText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4
  },
  goalRow: {
    gap: 8
  },
  goalTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600"
  },
  goalValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700"
  },
  goalTrack: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: radii.round,
    height: 8,
    overflow: "hidden"
  },
  goalFill: {
    borderRadius: radii.round,
    height: 8
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 10
  },
  activityText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 4
  }
});
