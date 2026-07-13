import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/ScreenKit";
import { DashboardData, fetchDashboardData, fetchProgressData, ProgressData } from "@/lib/api";
import { colors, radii } from "@/lib/theme";

const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

export default function DailyScreen() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const today = useMemo(() => new Date(), []);
  const calendarDays = useMemo(() => buildMonthDays(today), [today]);
  const weekDays = useMemo(() => buildWeekDays(today), [today]);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      try {
        const [dashboardData, progressData] = await Promise.all([fetchDashboardData(), fetchProgressData()]);
        setDashboard(dashboardData);
        setProgress(progressData);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <AppLayout contentContainerStyle={styles.loading}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.loadingText}>Building your daily board...</Text>
      </AppLayout>
    );
  }

  const streak = progress?.streak ?? dashboard?.streak ?? 0;
  const activeMinutes = dashboard?.activeMinutes ?? 0;
  const calories = dashboard?.caloriesToday ?? 0;
  const todayWorkoutName = dashboard?.todayWorkout.name ?? "Personal Plan";

  return (
    <AppLayout scroll contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.dateTitle}>
          {today.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </Text>
        <TouchableOpacity style={styles.editButton} onPress={() => router.push("/onboarding?mode=edit" as never)}>
          <Text style={styles.editText}>Edit</Text>
          <Ionicons name="options-outline" size={17} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <GlassCard radius={26} style={styles.streakCard}>
        <View style={styles.streakTop}>
          <View>
            <Text style={styles.streakTitle}><Text style={styles.streakNumber}>{Math.max(1, streak)}</Text> Day Streak</Text>
            <Text style={styles.streakCopy}>You’ve taken the first step. Keep the flame alive.</Text>
          </View>
          <Ionicons name="flame" size={36} color="#FF6B35" />
        </View>
        <View style={styles.streakTrack}>
          <LinearGradient colors={[colors.appBlueBright, "#00D9B2"]} style={[styles.streakFill, { width: `${Math.min(100, Math.max(16, streak * 14))}%` }]} />
          {[2, 5, 7].map((milestone) => (
            <View key={milestone} style={[styles.milestone, { left: `${Math.min(92, milestone * 13)}%` }]}>
              <Ionicons name={streak >= milestone ? "flame" : "medal"} size={22} color={streak >= milestone ? "#FF6B35" : "#5E6472"} />
              <Text style={styles.milestoneText}>{milestone}</Text>
            </View>
          ))}
        </View>
      </GlassCard>

      <GlassCard radius={26} style={styles.weekCard}>
        <Text style={styles.weekRange}>
          {weekDays[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} - {weekDays[6].toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </Text>
        <View style={styles.weekRow}>
          {weekDays.map((date) => {
            const isToday = sameDay(date, today);
            const completed = isToday && activeMinutes > 0;
            return (
              <View key={date.toISOString()} style={styles.weekItem}>
                <View style={[styles.medal, isToday && styles.medalToday, completed && styles.medalComplete]}>
                  <Ionicons name={completed ? "star" : "ellipse"} size={completed ? 18 : 12} color={completed ? colors.textPrimary : "rgba(255,255,255,0.18)"} />
                </View>
                <Text style={[styles.weekDay, isToday && styles.weekDayActive]}>{date.getDate()}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.dashedLine} />
        <View style={styles.activitiesHeader}>
          <Text style={styles.activitiesTitle}>Activities</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/progress")}>
            <Text style={styles.historyText}>History ›</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activityMetrics}>
          <View>
            <Text style={styles.minutes}><Text style={styles.minutesBig}>{Math.max(1, activeMinutes)}</Text> min / 7 mins</Text>
            <Text style={styles.calories}>Calories: {calories} kcal</Text>
          </View>
          <View style={styles.moodRing}>
            <Text style={styles.mood}>🙂</Text>
          </View>
        </View>
        <View style={styles.recentActivity}>
          <View style={styles.activityThumb}>
            <Ionicons name="barbell" size={24} color={colors.textPrimary} />
          </View>
          <View style={styles.activityTextBlock}>
            <Text style={styles.activityName}>Day 1 · {todayWorkoutName}</Text>
            <Text style={styles.activitySub}>{today.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} · {activeMinutes || 1} min · {calories} kcal</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push("/active-workout")}>
          <Ionicons name="add" size={20} color={colors.textPrimary} />
          <Text style={styles.addButtonText}>Add Activities</Text>
        </TouchableOpacity>
      </GlassCard>

      <Text style={styles.sectionTitle}>Calendar</Text>
      <GlassCard radius={26} style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <Ionicons name="chevron-back" size={20} color={colors.textTertiary} />
          <Text style={styles.monthTitle}>{today.toLocaleDateString(undefined, { month: "short", year: "numeric" })}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
        <View style={styles.calendarGrid}>
          {dayLabels.map((label, index) => <Text key={`${label}-${index}`} style={styles.dayLabel}>{label}</Text>)}
          {calendarDays.map((day, index) => (
            <View key={`${day?.toISOString() ?? "blank"}-${index}`} style={styles.calendarCell}>
              {day ? (
                <View style={[styles.dateBubble, sameDay(day, today) && styles.dateBubbleActive]}>
                  <Text style={[styles.dateText, sameDay(day, today) && styles.dateTextActive]}>{day.getDate()}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
        <View style={styles.calendarFooter}>
          <Ionicons name="flame" size={24} color={colors.coral} />
          <View>
            <Text style={styles.calendarStreak}>{Math.max(1, streak)} Day Streak</Text>
            <Text style={styles.personalBest}>Personal Best: {progress?.longestStreak ?? Math.max(1, streak)}</Text>
          </View>
        </View>
      </GlassCard>
    </AppLayout>
  );
}

function buildWeekDays(today: Date) {
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
}

function buildMonthDays(today: Date) {
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = Array.from({ length: startOffset }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(today.getFullYear(), today.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const styles = StyleSheet.create({
  screen: { gap: 18 },
  loading: { alignItems: "center", justifyContent: "center" },
  loadingText: { color: colors.textSecondary, fontSize: 13, marginTop: 8 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  dateTitle: { color: colors.textPrimary, fontSize: 34, fontWeight: "900", letterSpacing: -1 },
  editButton: { alignItems: "center", flexDirection: "row", gap: 6 },
  editText: { color: colors.textPrimary, fontSize: 16, fontWeight: "800" },
  streakCard: { gap: 22, padding: 20 },
  streakTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  streakTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: "900" },
  streakNumber: { color: "#FF7A1A" },
  streakCopy: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  streakTrack: { backgroundColor: "rgba(255,255,255,0.11)", borderRadius: 999, height: 34, justifyContent: "center", marginBottom: 8 },
  streakFill: { borderRadius: 999, height: 34 },
  milestone: { alignItems: "center", marginLeft: -16, position: "absolute", top: -13 },
  milestoneText: { color: colors.textSecondary, fontSize: 10, fontWeight: "900", marginTop: -5 },
  weekCard: { gap: 18, padding: 20 },
  weekRange: { color: colors.textSecondary, fontSize: 15, fontWeight: "800", textAlign: "center" },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  weekItem: { alignItems: "center", gap: 8 },
  medal: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  medalToday: { backgroundColor: "rgba(10,132,255,0.20)" },
  medalComplete: { backgroundColor: colors.appBlueBright },
  weekDay: { color: colors.textTertiary, fontSize: 12, fontWeight: "900" },
  weekDayActive: { color: colors.textPrimary },
  dashedLine: { borderColor: "rgba(255,255,255,0.12)", borderStyle: "dashed", borderTopWidth: 1 },
  activitiesHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  activitiesTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: "900" },
  historyText: { color: colors.appBlueBright, fontSize: 15, fontWeight: "800" },
  activityMetrics: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  minutes: { color: colors.textSecondary, fontSize: 16, fontWeight: "800" },
  minutesBig: { color: colors.textPrimary, fontSize: 42, fontWeight: "900" },
  calories: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  moodRing: { alignItems: "center", borderColor: colors.success, borderRadius: 38, borderRightWidth: 5, borderTopWidth: 5, height: 76, justifyContent: "center", width: 76 },
  mood: { fontSize: 31 },
  recentActivity: { alignItems: "center", flexDirection: "row", gap: 13 },
  activityThumb: { alignItems: "center", backgroundColor: "rgba(10,132,255,0.25)", borderRadius: 14, height: 62, justifyContent: "center", width: 62 },
  activityTextBlock: { flex: 1 },
  activityName: { color: colors.textPrimary, fontSize: 16, fontWeight: "900" },
  activitySub: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  addButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 18, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 56 },
  addButtonText: { color: colors.textPrimary, fontSize: 17, fontWeight: "900" },
  sectionTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: "900" },
  calendarCard: { gap: 18, padding: 20 },
  calendarHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  monthTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: "900" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 14 },
  dayLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: "900", textAlign: "center", width: `${100 / 7}%` },
  calendarCell: { alignItems: "center", height: 34, justifyContent: "center", width: `${100 / 7}%` },
  dateBubble: { alignItems: "center", borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  dateBubbleActive: { backgroundColor: colors.appBlueBright },
  dateText: { color: colors.textPrimary, fontSize: 15, fontWeight: "800" },
  dateTextActive: { color: colors.textPrimary },
  calendarFooter: { alignItems: "center", borderTopColor: "rgba(255,255,255,0.10)", borderTopWidth: 1, flexDirection: "row", gap: 12, paddingTop: 16 },
  calendarStreak: { color: colors.textPrimary, fontSize: 18, fontWeight: "900" },
  personalBest: { color: colors.textSecondary, fontSize: 12, marginTop: 2 }
});
