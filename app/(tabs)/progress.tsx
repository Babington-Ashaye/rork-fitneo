import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/AppLayout";
import { EmptySpacer, ErrorState, LoadingState, ScreenTitle, SectionHeader, StatCard, TouchableCard } from "@/components/ScreenKit";
import { fetchProgressData, ProgressData } from "@/lib/api";
import { colors, radii } from "@/lib/theme";

export default function ProgressScreen() {
  const { t } = useTranslation();
  const [data, setData] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadProgress() {
    setError(null);
    setIsLoading(true);
    try {
      setData(await fetchProgressData());
    } catch (err) {
      setError(err instanceof Error ? err.message : t("progress.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProgress();
  }, []);

  const max = useMemo(() => Math.max(1, ...(data?.weeklyWorkouts ?? [0])), [data?.weeklyWorkouts]);
  const weekLabels = useMemo(() => getWeekLabels(data?.weeklyWorkouts.length ?? 0, t), [data?.weeklyWorkouts.length, t]);
  const favoriteMax = useMemo(
    () => Math.max(1, ...(data?.favoriteMuscleGroups.map((item) => item.count) ?? [0])),
    [data?.favoriteMuscleGroups]
  );

  if (isLoading) {
    return (
      <AppLayout scroll>
        <LoadingState label={t("progress.loading")} />
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout scroll>
        <ErrorState message={error ?? t("progress.unavailable")} onRetry={loadProgress} />
      </AppLayout>
    );
  }

  return (
    <AppLayout scroll>
      <ScreenTitle title={t("progress.title")} subtitle={t("progress.subtitle")} />
      <TouchableCard radius={radii.xxl} style={styles.todayCard} onPress={loadProgress}>
        <LinearGradient colors={["rgba(255,107,53,0.25)", "rgba(10,132,255,0.12)"]} style={styles.todayGradient}>
          <View style={styles.todayHeader}>
            <View>
              <Text style={styles.todayKicker}>TODAY'S ACTIVITY</Text>
              <Text style={styles.todayTitle}>{Math.max(1, data.streak)} Day Streak</Text>
            </View>
            <Ionicons name="flame" size={34} color={colors.coral} />
          </View>
          <View style={styles.weekMedals}>
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
              <View key={`${day}-${index}`} style={styles.weekMedalItem}>
                <View style={[styles.weekMedal, index === ((new Date().getDay() + 6) % 7) && styles.weekMedalActive]}>
                  <Ionicons name={index <= Math.min(6, data.streak - 1) ? "star" : "ellipse"} size={index <= Math.min(6, data.streak - 1) ? 16 : 10} color={index <= Math.min(6, data.streak - 1) ? colors.textPrimary : "rgba(255,255,255,0.25)"} />
                </View>
                <Text style={styles.weekMedalText}>{day}</Text>
              </View>
            ))}
          </View>
          <View style={styles.minutesGoal}>
            <Text style={styles.minutesGoalText}>{Math.min(7, data.totalWorkouts || 1)} / 7 min active today</Text>
            <View style={styles.minutesTrack}>
              <View style={[styles.minutesFill, { width: `${Math.min(100, ((data.totalWorkouts || 1) / 7) * 100)}%` }]} />
            </View>
          </View>
        </LinearGradient>
      </TouchableCard>
      <TouchableCard radius={radii.xxl} style={styles.streakCard} onPress={loadProgress}>
        <Ionicons name="flame" size={34} color={colors.coral} />
        <View style={styles.flex}>
          <Text style={styles.streakTitle}>{t("progress.dayStreak", { count: data.streak })}</Text>
          <Text style={styles.subtle}>{t("progress.longest", { count: data.longestStreak })}</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.consistency}>{data.consistency}%</Text>
          <Text style={styles.subtleSmall}>{t("progress.consistency")}</Text>
        </View>
      </TouchableCard>

      <TouchableCard radius={radii.xxl} style={styles.cardStack}>
        <SectionHeader title={t("progress.workoutsPerWeek")} />
        <View style={styles.chart}>
          {data.weeklyWorkouts.map((count, index) => (
            <View key={index} style={styles.barItem}>
              <Text style={[styles.barCount, { opacity: count > 0 ? 1 : 0.3 }]}>{count}</Text>
              <View style={[styles.bar, { height: Math.max(6, (count / max) * 90) }]} />
              <Text style={styles.barLabel}>{weekLabels[index]}</Text>
            </View>
          ))}
        </View>
      </TouchableCard>

      <View style={styles.gridRow}>
        <StatCard icon="barbell" value={String(data.totalWorkouts)} label={t("progress.totalWorkouts")} />
        <StatCard icon="layers" value={String(data.totalSets)} label={t("progress.totalSets")} tint={colors.coral} />
      </View>
      <View style={styles.gridRow}>
        <StatCard icon="flame" value={data.caloriesBurned.toLocaleString()} label={t("progress.caloriesBurned")} tint="#FF9500" />
        <StatCard icon="flash" value={data.totalXp.toLocaleString()} label={t("progress.totalXp")} tint={colors.teal} />
      </View>

      <TouchableCard radius={radii.xxl} style={styles.cardStack}>
        <SectionHeader title={t("progress.bodyMetrics")} />
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.bmi}>{data.bmi ? data.bmi.toFixed(1) : "--"}</Text>
            <Text style={styles.subtle}>
              {data.bmi ? t("progress.bmiTracked") : t("progress.bmiGuidance")}
            </Text>
          </View>
          <View style={styles.rightText}>
            <Text style={styles.goalPace}>{data.goalPaceWeeks ? t("progress.weeksApprox", { count: data.goalPaceWeeks }) : "--"}</Text>
            <Text style={styles.subtleSmall}>{t("progress.goalPace")}</Text>
          </View>
        </View>
      </TouchableCard>

      <TouchableCard radius={radii.xxl} style={styles.cardStack}>
        <SectionHeader title={t("progress.favoriteMuscleGroups")} />
        {data.favoriteMuscleGroups.length > 0 ? (
          data.favoriteMuscleGroups.map((item, index) => (
            <View key={item.name} style={styles.muscleRow}>
              <Text style={styles.muscleRank}>{index + 1}</Text>
              <View style={styles.flex}>
                <View style={styles.rowBetween}>
                  <Text style={styles.muscleName}>{item.name}</Text>
                  <Text style={styles.muscleCount}>{item.count}</Text>
                </View>
                <View style={styles.muscleTrack}>
                  <View style={[styles.muscleFill, { width: `${Math.max(8, (item.count / favoriteMax) * 100)}%` }]} />
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{t("progress.emptyMuscles")}</Text>
        )}
      </TouchableCard>

      <EmptySpacer />
    </AppLayout>
  );
}

function getWeekLabels(length: number, t: (key: string, options?: Record<string, unknown>) => string) {
  return Array.from({ length }).map((_, index) => {
    const remaining = length - index - 1;
    if (remaining === 0) return t("progress.thisWeek");
    if (remaining === 1) return t("progress.lastWeek");
    return t("progress.weeksAgo", { count: remaining });
  });
}

const styles = StyleSheet.create({
  streakCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 20,
    padding: 20
  },
  todayCard: { overflow: "hidden" },
  todayGradient: { gap: 18, padding: 20 },
  todayHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  todayKicker: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  todayTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: "900", marginTop: 4 },
  weekMedals: { flexDirection: "row", justifyContent: "space-between" },
  weekMedalItem: { alignItems: "center", gap: 7 },
  weekMedal: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 17, height: 34, justifyContent: "center", width: 34 },
  weekMedalActive: { backgroundColor: colors.accent },
  weekMedalText: { color: colors.textTertiary, fontSize: 10, fontWeight: "900" },
  minutesGoal: { gap: 8 },
  minutesGoalText: { color: colors.textSecondary, fontSize: 13, fontWeight: "800" },
  minutesTrack: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 999, height: 8, overflow: "hidden" },
  minutesFill: { backgroundColor: colors.accent, borderRadius: 999, height: 8 },
  flex: {
    flex: 1
  },
  streakTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700"
  },
  subtle: {
    color: colors.textTertiary,
    fontSize: 13
  },
  subtleSmall: {
    color: colors.textTertiary,
    fontSize: 11
  },
  consistency: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: "700"
  },
  center: {
    alignItems: "center"
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
  emptyText: {
    color: colors.textTertiary,
    fontSize: 14,
    paddingVertical: 16
  },
  chart: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 8,
    height: 130
  },
  barItem: {
    alignItems: "center",
    flex: 1,
    gap: 6,
    justifyContent: "flex-end"
  },
  barCount: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700"
  },
  bar: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    width: "100%"
  },
  barLabel: {
    color: colors.textTertiary,
    fontSize: 9
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
    minHeight: 124,
    width: "100%"
  },
  bmi: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "700"
  },
  rightText: {
    alignItems: "flex-end"
  },
  goalPace: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "600"
  },
  muscleRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  muscleRank: { color: colors.accent, fontSize: 14, fontWeight: "900", width: 20 },
  muscleName: { color: colors.textPrimary, fontSize: 13, fontWeight: "800" },
  muscleCount: { color: colors.textTertiary, fontSize: 11, fontWeight: "800" },
  muscleTrack: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: radii.round, height: 8, marginTop: 7, overflow: "hidden" },
  muscleFill: { backgroundColor: colors.accent, borderRadius: radii.round, height: 8 }
});
