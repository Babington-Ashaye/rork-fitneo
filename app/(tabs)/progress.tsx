import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { EmptySpacer, ErrorState, LoadingState, ScreenTitle, SectionHeader, StatCard, TouchableCard } from "@/components/ScreenKit";
import { fetchProgressData, ProgressData } from "@/lib/api";
import { colors, radii } from "@/lib/theme";

export default function ProgressScreen() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadProgress() {
    setError(null);
    setIsLoading(true);
    try {
      setData(await fetchProgressData());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load progress.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProgress();
  }, []);

  const max = useMemo(() => Math.max(1, ...(data?.weeklyWorkouts ?? [0])), [data?.weeklyWorkouts]);

  if (isLoading) {
    return (
      <AppLayout scroll>
        <LoadingState label="Loading live progress..." />
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout scroll>
        <ErrorState message={error ?? "Progress data is unavailable."} onRetry={loadProgress} />
      </AppLayout>
    );
  }

  return (
    <AppLayout scroll>
      <ScreenTitle title="Progress" subtitle="Your data, decoded" />
      <TouchableCard radius={radii.xxl} style={styles.streakCard} onPress={loadProgress}>
        <Ionicons name="flame" size={34} color={colors.coral} />
        <View style={styles.flex}>
          <Text style={styles.streakTitle}>{data.streak} day streak</Text>
          <Text style={styles.subtle}>Longest: {data.longestStreak} days</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.consistency}>{data.consistency}%</Text>
          <Text style={styles.subtleSmall}>consistency</Text>
        </View>
      </TouchableCard>

      <TouchableCard radius={radii.xxl} style={styles.cardStack} onPress={loadProgress}>
        <SectionHeader title="WORKOUTS / WEEK" />
        <View style={styles.chart}>
          {data.weeklyWorkouts.map((count, index) => (
            <View key={index} style={styles.barItem}>
              <Text style={[styles.barCount, { opacity: count > 0 ? 1 : 0.3 }]}>{count}</Text>
              <View style={[styles.bar, { height: Math.max(6, (count / max) * 90) }]} />
              <Text style={styles.barLabel}>W{index + 1}</Text>
            </View>
          ))}
        </View>
      </TouchableCard>

      <View style={styles.gridRow}>
        <StatCard icon="barbell" value={String(data.totalWorkouts)} label="Total workouts" onPress={loadProgress} />
        <StatCard icon="layers" value={String(data.totalSets)} label="Total sets" tint={colors.coral} onPress={loadProgress} />
      </View>
      <View style={styles.gridRow}>
        <StatCard icon="flame" value={data.caloriesBurned.toLocaleString()} label="Calories burned" tint="#FF9500" onPress={loadProgress} />
        <StatCard icon="flash" value={data.totalXp.toLocaleString()} label="Total XP" tint={colors.teal} onPress={loadProgress} />
      </View>

      <TouchableCard radius={radii.xxl} style={styles.cardStack} onPress={loadProgress}>
        <SectionHeader title="BODY METRICS" />
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.bmi}>{data.bmi ? data.bmi.toFixed(1) : "--"}</Text>
            <Text style={styles.subtle}>BMI {data.bmi ? "tracked" : "not enough data"}</Text>
          </View>
          <View style={styles.rightText}>
            <Text style={styles.goalPace}>{data.goalPaceWeeks ? `~${data.goalPaceWeeks} weeks` : "--"}</Text>
            <Text style={styles.subtleSmall}>est. goal pace</Text>
          </View>
        </View>
      </TouchableCard>

      <TouchableCard radius={radii.xxl} style={styles.cardStack} onPress={loadProgress}>
        <SectionHeader title="FAVORITE MUSCLE GROUPS" />
        <Text style={styles.emptyText}>Complete workouts to build your live training split.</Text>
      </TouchableCard>

      <EmptySpacer />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  streakCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 20,
    padding: 20
  },
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
  }
});
