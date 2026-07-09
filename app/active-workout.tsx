import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard, ScreenTitle } from "@/components/ScreenKit";
import { completeWorkoutSession } from "@/lib/api";
import { starterExercises } from "@/lib/exercises";
import { colors, radii } from "@/lib/theme";

export default function ActiveWorkoutScreen() {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [setsCompleted, setSetsCompleted] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [restRemaining, setRestRemaining] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const exercise = starterExercises[exerciseIndex];
  const totalSets = useMemo(() => starterExercises.reduce((sum, item) => sum + item.sets, 0), []);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((current) => current + 1);
      setRestRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  async function finishWorkout() {
    setSaving(true);
    setError(null);
    try {
      await completeWorkoutSession({
        name: "Full Body Strength",
        durationSeconds: Math.max(60, elapsed),
        setsCompleted: Math.max(setsCompleted, 1)
      });
      setFinished(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this workout.");
    } finally {
      setSaving(false);
    }
  }

  function completeSet() {
    const nextCompleted = setsCompleted + 1;
    setSetsCompleted(nextCompleted);
    if (currentSet < exercise.sets) {
      setCurrentSet((current) => current + 1);
      setRestRemaining(exercise.restSeconds);
      return;
    }
    if (exerciseIndex < starterExercises.length - 1) {
      setExerciseIndex((current) => current + 1);
      setCurrentSet(1);
      setRestRemaining(exercise.restSeconds);
      return;
    }
    void finishWorkout();
  }

  if (finished) {
    return (
      <AppLayout contentContainerStyle={styles.completeScreen}>
        <View style={styles.completeIcon}>
          <Ionicons name="checkmark-circle" size={80} color={colors.teal} />
        </View>
        <Text style={styles.completeTitle}>Workout complete</Text>
        <Text style={styles.completeCopy}>{setsCompleted} sets logged in {formatTime(elapsed)}.</Text>
        <TouchableOpacity style={styles.primary} onPress={() => router.replace("/(tabs)")}>
          <Text style={styles.primaryText}>Back to dashboard</Text>
        </TouchableOpacity>
      </AppLayout>
    );
  }

  return (
    <AppLayout scroll>
      <View style={styles.topRow}>
        <ScreenTitle title="Active Workout" subtitle={`${exerciseIndex + 1} of ${starterExercises.length} exercises`} />
        <Text style={styles.timer}>{formatTime(elapsed)}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(4, setsCompleted / totalSets * 100)}%` }]} />
      </View>

      <GlassCard radius={20} style={styles.mediaCard}>
        <Image source={{ uri: exercise.animationUrl }} style={styles.animation} resizeMode="contain" />
        <View style={styles.mediaBadge}>
          <Ionicons name="repeat" size={12} color={colors.teal} />
          <Text style={styles.mediaBadgeText}>LOOPING DEMO</Text>
        </View>
      </GlassCard>

      <GlassCard radius={20} style={styles.exerciseCard}>
        <Text style={styles.muscle}>{exercise.muscleGroup.toUpperCase()}</Text>
        <Text style={styles.exercise}>{exercise.name}</Text>
        <View style={styles.setMetrics}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{currentSet}</Text>
            <Text style={styles.metricLabel}>of {exercise.sets} sets</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{exercise.reps}</Text>
            <Text style={styles.metricLabel}>target reps</Text>
          </View>
        </View>
        <View style={styles.coachingRow}>
          <Ionicons name="information-circle" size={17} color={colors.accent} />
          <Text style={styles.coaching}>{exercise.instructions}</Text>
        </View>
        <View style={styles.coachingRow}>
          <Ionicons name="bulb" size={17} color={colors.gold} />
          <Text style={styles.coaching}>{exercise.tip}</Text>
        </View>
      </GlassCard>

      {restRemaining > 0 ? (
        <GlassCard radius={16} selected style={styles.restCard}>
          <Text style={styles.restLabel}>RECOVERY</Text>
          <Text style={styles.restValue}>{restRemaining}s</Text>
          <TouchableOpacity onPress={() => setRestRemaining(0)}>
            <Text style={styles.skip}>Skip rest</Text>
          </TouchableOpacity>
        </GlassCard>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.navButton, exerciseIndex === 0 && styles.disabled]}
          disabled={exerciseIndex === 0}
          onPress={() => {
            setExerciseIndex((current) => Math.max(0, current - 1));
            setCurrentSet(1);
          }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primary, restRemaining > 0 && styles.disabled]} disabled={restRemaining > 0 || saving} onPress={completeSet}>
          {saving ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.primaryText}>Complete set</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, exerciseIndex === starterExercises.length - 1 && styles.disabled]}
          disabled={exerciseIndex === starterExercises.length - 1}
          onPress={() => {
            setExerciseIndex((current) => Math.min(starterExercises.length - 1, current + 1));
            setCurrentSet(1);
          }}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </AppLayout>
  );
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

const styles = StyleSheet.create({
  topRow: { alignItems: "flex-start", flexDirection: "row", gap: 12, justifyContent: "space-between" },
  timer: { color: colors.accent, fontSize: 18, fontWeight: "900", paddingTop: 7 },
  progressTrack: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 4, height: 7, overflow: "hidden" },
  progressFill: { backgroundColor: colors.accent, borderRadius: 4, height: 7 },
  mediaCard: { backgroundColor: "#FFFFFF", height: 260, overflow: "hidden" },
  animation: { height: "100%", width: "100%" },
  mediaBadge: { alignItems: "center", backgroundColor: "rgba(6,9,20,0.88)", borderRadius: 10, bottom: 10, flexDirection: "row", gap: 5, paddingHorizontal: 9, paddingVertical: 6, position: "absolute", right: 10 },
  mediaBadgeText: { color: colors.teal, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  exerciseCard: { gap: 14, padding: 20 },
  muscle: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  exercise: { color: colors.textPrimary, fontSize: 27, fontWeight: "800" },
  setMetrics: { flexDirection: "row", gap: 12 },
  metric: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.045)", borderRadius: 14, flex: 1, padding: 14 },
  metricValue: { color: colors.textPrimary, fontSize: 27, fontWeight: "900" },
  metricLabel: { color: colors.textTertiary, fontSize: 10 },
  coachingRow: { alignItems: "flex-start", flexDirection: "row", gap: 9 },
  coaching: { color: colors.textSecondary, flex: 1, fontSize: 13, lineHeight: 19 },
  restCard: { alignItems: "center", gap: 3, padding: 18 },
  restLabel: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  restValue: { color: colors.textPrimary, fontSize: 34, fontWeight: "900" },
  skip: { color: colors.textSecondary, fontSize: 12, fontWeight: "700", paddingTop: 4 },
  controls: { alignItems: "center", flexDirection: "row", gap: 10 },
  navButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 14, height: 54, justifyContent: "center", width: 54 },
  primary: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 14, flex: 1, justifyContent: "center", minHeight: 54, paddingHorizontal: 18 },
  primaryText: { color: colors.textPrimary, fontSize: 15, fontWeight: "900" },
  disabled: { opacity: 0.4 },
  error: { color: colors.danger, fontSize: 12, textAlign: "center" },
  completeScreen: { alignItems: "center", justifyContent: "center" },
  completeIcon: { alignItems: "center", backgroundColor: "rgba(0,217,178,0.1)", borderRadius: 60, height: 120, justifyContent: "center", width: 120 },
  completeTitle: { color: colors.textPrimary, fontSize: 28, fontWeight: "900" },
  completeCopy: { color: colors.textSecondary, fontSize: 14, textAlign: "center" }
});
