import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/AppLayout";
import { EmptySpacer, ErrorState, IconBubble, MetaItem, PillButton, SectionHeader, SkeletonBlock, StatCard, TouchableCard, XPBar, withAlpha } from "@/components/ScreenKit";
import { calculateXpProgress, DashboardData, fetchActiveWorkoutPlan, fetchDashboardData, WorkoutProgram } from "@/lib/api";
import { GeneratedPlanRecord, getPlanDayForDate, loadExistingPlanWithMetadata } from "@/lib/generateAiPlan";
import { colors, radii } from "@/lib/theme";
import { useAuth } from "@/context/AuthContext";
import { loadWaterIntake, saveWaterIntake } from "@/lib/water";

export default function DashboardScreen() {
  const { needsOnboarding, user } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [plan, setPlan] = useState<WorkoutProgram | null>(null);
  const [aiPlanRecord, setAiPlanRecord] = useState<GeneratedPlanRecord | null>(null);
  const [planOpen, setPlanOpen] = useState(false);

  async function loadDashboard() {
    setError(null);
    setIsLoading(true);
    try {
      const [dashboard, activePlan, generatedPlan] = await Promise.all([
        fetchDashboardData(),
        fetchActiveWorkoutPlan(),
        user?.id ? loadExistingPlanWithMetadata(user.id) : Promise.resolve(null)
      ]);
      const waterCurrent = await loadWaterIntake(user?.id ?? null, dashboard.waterGoal);
      setData((current) => ({ ...dashboard, waterCurrent: current?.waterCurrent ?? waterCurrent }));
      setPlan(activePlan);
      setAiPlanRecord(generatedPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (needsOnboarding) {
      setIsLoading(false);
      return;
    }
    void loadDashboard();
  }, [needsOnboarding]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t("dashboard.goodMorning");
    if (hour < 18) return t("dashboard.goodAfternoon");
    return t("dashboard.goodEvening");
  }, [t]);

  async function updateWaterIntake(amount: number) {
    if (!data) return;
    const normalized = Math.max(0, Math.min(data.waterGoal, Math.round(amount)));
    const previous = data.waterCurrent;
    setData({ ...data, waterCurrent: normalized });
    try {
      await saveWaterIntake(user?.id ?? null, normalized, data.waterGoal);
    } catch {
      setData((current) => current ? { ...current, waterCurrent: previous } : current);
    }
  }
  if (needsOnboarding) {
    return (
      <AppLayout scroll>
        <TouchableCard radius={radii.xxl} style={styles.onboardingGate} onPress={() => router.replace("/onboarding")}>
          <IconBubble icon="person-circle" size={52} />
          <View style={styles.flex}>
            <Text style={styles.gateTitle}>{t("dashboard.completeProfileTitle")}</Text>
            <Text style={styles.gateCopy}>{t("dashboard.completeProfileCopy")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableCard>
      </AppLayout>
    );
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
        <ErrorState message={error ?? t("dashboard.dataUnavailable")} onRetry={loadDashboard} />
      </AppLayout>
    );
  }

  const xpInto = calculateXpProgress(data.xp).xpInto;
  const insight = getDashboardInsight(data, t);
  const todayAiDay = aiPlanRecord ? getPlanDayForDate(aiPlanRecord.plan, aiPlanRecord.generatedAt) : null;
  const hasAiWorkout = Boolean(todayAiDay && !todayAiDay.isRest && todayAiDay.exerciseIds.length > 0);
  const heroCategory = todayAiDay ? "AI PLAN" : data.todayWorkout.category;
  const heroTitle = todayAiDay
    ? `Day ${todayAiDay.dayNumber} · ${todayAiDay.title}`
    : aiPlanRecord
      ? aiPlanRecord.plan.planTitle
      : "Set up your training plan";

  function openTodayWorkout() {
    if (todayAiDay && hasAiWorkout && aiPlanRecord) {
      router.push({
        pathname: "/active-workout",
        params: {
          programId: "ai-dashboard",
          programName: `${aiPlanRecord.plan.planTitle} · Day ${todayAiDay.dayNumber}`,
          exerciseIds: JSON.stringify(todayAiDay.exerciseIds)
        }
      });
      return;
    }
    router.push("/sports-mode");
  }

  return (
    <AppLayout scroll>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.name}>{data.displayName}</Text>
        </View>
        <TouchableCard radius={radii.lg} style={styles.streakPill} onPress={() => Alert.alert(t("dashboard.streak"), t("dashboard.dayStreak", { count: data.streak }))}>
          <Ionicons name="flame" size={28} color={colors.coral} />
          <Text style={styles.streakText}>{data.streak}</Text>
        </TouchableCard>
      </View>

      <XPBar level={data.level} rankTitle={data.rankTitle} progress={xpInto / data.xpSpan} xpInto={xpInto} xpSpan={data.xpSpan} />

      <TouchableCard radius={radii.xxl} style={styles.planHeader} onPress={() => setPlanOpen((current) => !current)}>
        <View style={styles.inline}>
          <Ionicons name="sparkles" size={14} color={colors.accent} />
          <SectionHeader title={t("dashboard.myPlan")} accent />
          <Text numberOfLines={1} style={styles.planName}>{aiPlanRecord?.plan.planTitle ?? plan?.name ?? data.todayWorkout.name}</Text>
        </View>
        <Ionicons name={planOpen ? "chevron-up" : "chevron-down"} size={14} color={colors.textSecondary} />
      </TouchableCard>
      {planOpen ? (
        <View style={styles.planDetails}>
          <View style={styles.planMeta}>
            <MetaItem icon="time" text={`${plan?.durationMinutes ?? data.todayWorkout.durationMinutes} min`} />
            <MetaItem icon="layers" text={`${todayAiDay?.exerciseIds.length ?? plan?.exercises ?? 6} exercises`} />
            <MetaItem icon="bar-chart" text={aiPlanRecord ? "AI calibrated" : plan?.category ?? data.todayWorkout.category} />
          </View>
          <Text style={styles.planCopy}>{aiPlanRecord?.plan.planDescription ?? t("dashboard.planCopy")}</Text>
          <TouchableOpacity style={styles.planStart} onPress={openTodayWorkout}>
            <Text style={styles.planStartText}>{aiPlanRecord ? t("dashboard.startActivePlan") : "Set up AI plan"}</Text>
            <Ionicons name="play" size={14} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableCard radius={radii.hero} style={styles.heroCard} onPress={openTodayWorkout}>
        <View style={styles.heroTop}>
          <View style={styles.inline}>
            <Ionicons name="sparkles" size={13} color={colors.accent} />
            <Text style={styles.heroKicker}>{t("dashboard.todaysWorkout")}</Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{heroCategory}</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>{heroTitle}</Text>
        {todayAiDay ? <Text style={styles.heroFocus}>{todayAiDay.focus}</Text> : <Text style={styles.heroFocus}>Answer your sport profile once and FITNEO AI will build your 4-week training plan.</Text>}
        <View style={styles.metaRow}>
          <MetaItem icon="time" text={`${data.todayWorkout.durationMinutes} min`} />
          <MetaItem icon="flame" text={todayAiDay?.isRest ? "Recovery" : `${data.todayWorkout.calories} kcal`} />
          <MetaItem icon="bar-chart" text={todayAiDay ? aiPlanRecord?.plan.tagline ?? "AI calibrated" : data.todayWorkout.difficulty} />
        </View>
        <View style={styles.heroActions}>
          <TouchableOpacity activeOpacity={0.78} style={styles.quickStart} onPress={openTodayWorkout}>
            <PillButton title={hasAiWorkout ? t("dashboard.quickStart") : "Set Up Plan"} icon={hasAiWorkout ? "play" : "sparkles"} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.78} style={styles.aiButton} onPress={() => router.push("/(tabs)/coach")}>
            <Ionicons name="sparkles" size={21} color={colors.accent} />
            <Text style={styles.aiText}>AI</Text>
          </TouchableOpacity>
        </View>
        <Ionicons name="barbell" size={90} color="rgba(10,132,255,0.08)" style={styles.heroWatermark} />
      </TouchableCard>

      <View style={styles.statRow}>
        <StatCard icon="flame" value={String(data.caloriesToday)} label={t("dashboard.calToday")} tint={colors.coral} onPress={() => Alert.alert(t("dashboard.caloriesBurnedToday"), `${data.caloriesToday} kcal`)} />
        <StatCard icon="barbell" value={String(data.workoutsThisWeek)} label={t("dashboard.thisWeek")} onPress={() => router.push("/(tabs)/progress")} />
      </View>
      <View style={styles.statRow}>
        <StatCard icon="time" value={String(data.activeMinutes)} label={t("dashboard.activeMin")} tint={colors.teal} onPress={() => Alert.alert(t("dashboard.activeMinutes"), t("dashboard.minutesToday", { count: data.activeMinutes }))} />
        <StatCard icon="flame-outline" value={String(data.streak)} label={t("dashboard.streak")} tint="#FF9500" onPress={() => Alert.alert(t("dashboard.streak"), t("dashboard.dayStreak", { count: data.streak }))} />
      </View>

      <TouchableCard radius={radii.xxl} style={styles.cardStack} onPress={() => router.push("/(tabs)/progress")}>
        <SectionHeader title={t("dashboard.goals")} />
        <GoalRow title={t("dashboard.weeklyWorkouts")} value={data.workoutsThisWeek} target={data.weeklyWorkoutGoal} tint={colors.accent} />
        <GoalRow title={t("dashboard.caloriesBurned")} value={data.caloriesToday} target={data.calorieBurnGoal} tint={colors.coral} />
        <GoalRow title={t("dashboard.caloriesEaten")} value={data.caloriesEaten} target={data.calorieEatGoal} tint={colors.gold} />
      </TouchableCard>

      <TouchableCard radius={radii.xxl} style={styles.cardStack}>
        <View style={styles.rowBetween}>
          <View style={styles.inline}>
            <Ionicons name="water" size={16} color={colors.textPrimary} />
            <Text style={styles.cardTitle}>{t("dashboard.waterIntake")}</Text>
          </View>
          <Text style={styles.accentMeta}>{data.waterCurrent} / {data.waterGoal}</Text>
        </View>
        <View style={styles.waterControls}>
          <TouchableOpacity accessibilityLabel="Decrease water intake" style={styles.waterAdjust} onPress={() => void updateWaterIntake(data.waterCurrent - 1)}>
            <Ionicons name="remove" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.waterInputWrap}>
            <TextInput
              keyboardType="number-pad"
              value={String(data.waterCurrent)}
              onChangeText={(value) => void updateWaterIntake(Number(value.replace(/[^0-9]/g, "") || 0))}
              style={styles.waterInput}
              underlineColorAndroid="transparent"
            />
            <Text style={styles.waterInputLabel}>{t("dashboard.cups")}</Text>
          </View>
          <TouchableOpacity accessibilityLabel="Increase water intake" style={[styles.waterAdjust, styles.waterAdjustActive]} onPress={() => void updateWaterIntake(data.waterCurrent + 1)}>
            <Ionicons name="add" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
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
        <Text style={styles.waterLiters}>{t("dashboard.litersLogged", { liters: (data.waterCurrent * 0.25).toFixed(2) })}</Text>
      </TouchableCard>

      <TouchableCard radius={radii.xxl} style={styles.insightCard} onPress={() => router.push("/(tabs)/coach")}>
        <IconBubble icon="bulb" size={44} />
        <View style={styles.flex}>
          <Text style={styles.insightTitle}>{t("dashboard.aiInsight")}</Text>
          <Text style={styles.insightText}>{insight}</Text>
        </View>
      </TouchableCard>

      <TouchableCard radius={radii.xxl} style={styles.cardStack} onPress={() => router.push("/(tabs)/progress")}>
        <SectionHeader title={t("dashboard.recentActivity")} />
        {data.recentActivity.length > 0 ? (
          data.recentActivity.map((item) => <Text key={item} style={styles.activityText}>{item}</Text>)
        ) : (
          <Text style={styles.emptyText}>{t("dashboard.noWorkoutsYet")}</Text>
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

function getDashboardInsight(data: DashboardData, t: (key: string, options?: Record<string, unknown>) => string) {
  const hour = new Date().getHours();
  if (data.streak === 0) {
    return t("dashboard.insightStartStreak");
  }
  if (data.workoutsThisWeek >= data.weeklyWorkoutGoal) {
    return t("dashboard.insightWeeklyTarget");
  }
  if (data.caloriesToday < 200 && hour >= 14) {
    return t("dashboard.insightLowBurn");
  }
  if (data.caloriesEaten > data.calorieEatGoal) {
    return t("dashboard.insightCalorieTarget");
  }
  return t("dashboard.insightDefault");
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
    maxWidth: "64%",
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
    minWidth: 0,
    overflow: "hidden"
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
    flexShrink: 1,
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
  heroFocus: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
    marginTop: -6
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
    gap: 12,
    width: "100%"
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
  waterControls: { alignItems: "center", flexDirection: "row", gap: 10 },
  waterAdjust: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.07)", borderColor: colors.cardStroke, borderRadius: 16, borderWidth: 1, height: 42, justifyContent: "center", width: 42 },
  waterAdjustActive: { backgroundColor: colors.accent, borderColor: "rgba(255,255,255,0.36)" },
  waterInputWrap: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.045)", borderColor: colors.cardStroke, borderRadius: 16, borderWidth: 1, flex: 1, flexDirection: "row", justifyContent: "center", minHeight: 42, paddingHorizontal: 12 },
  waterInput: { color: colors.textPrimary, fontSize: 18, fontWeight: "900", minWidth: 34, padding: 0, textAlign: "center" },
  waterInputLabel: { color: colors.textTertiary, fontSize: 11, fontWeight: "800", marginLeft: 5 },
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



