import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard, ScreenTitle } from "@/components/ScreenKit";
import { completeWorkoutSession } from "@/lib/api";
import { starterExercises } from "@/lib/exercises";
import { colors } from "@/lib/theme";

type WorkoutPhase = "exercise" | "rest";

export default function ActiveWorkoutScreen() {
  const { height, width } = useWindowDimensions();
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [setsCompleted, setSetsCompleted] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<WorkoutPhase>("exercise");
  const [restRemaining, setRestRemaining] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isDemoVisible, setIsDemoVisible] = useState(true);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exercise = starterExercises[exerciseIndex];
  const timedSeconds = useMemo(() => parseTimedDuration(exercise.reps), [exercise.reps]);
  const progress = ((exerciseIndex + 1) / starterExercises.length) * 100;
  const mediaHeight = Math.max(128, Math.min(245, height * 0.25, width * 0.54));

  useEffect(() => {
    const timer = setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setTimerRunning(false);
    setTimerRemaining(timedSeconds ?? 0);
    setMediaFailed(false);
  }, [exercise.id, currentSet, timedSeconds]);

  useEffect(() => {
    if (phase !== "rest") return;
    if (restRemaining <= 0) {
      setPhase("exercise");
      return;
    }
    const timer = setInterval(() => {
      setRestRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, restRemaining]);

  useEffect(() => {
    if (!timerRunning) return;
    const timer = setInterval(() => {
      setTimerRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timerRunning]);

  useEffect(() => {
    if (timerRunning && timerRemaining === 0) {
      setTimerRunning(false);
      advanceAfterSet();
    }
  }, [timerRemaining, timerRunning]);

  async function finishWorkout(finalSetsCompleted = setsCompleted) {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await completeWorkoutSession({
        name: "Full Body Strength",
        durationSeconds: Math.max(60, elapsed),
        setsCompleted: Math.max(finalSetsCompleted, 1)
      });
      setFinished(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this workout.");
    } finally {
      setSaving(false);
    }
  }

  function advanceAfterSet() {
    if (saving) return;
    const nextCompleted = setsCompleted + 1;
    setSetsCompleted(nextCompleted);
    setTimerRunning(false);

    if (currentSet < exercise.sets) {
      setCurrentSet((current) => current + 1);
      startRest(exercise.restSeconds);
      return;
    }
    if (exerciseIndex < starterExercises.length - 1) {
      setExerciseIndex((current) => current + 1);
      setCurrentSet(1);
      startRest(exercise.restSeconds);
      return;
    }
    void finishWorkout(nextCompleted);
  }

  function startRest(seconds: number) {
    if (seconds <= 0) {
      setPhase("exercise");
      return;
    }
    setRestRemaining(seconds);
    setPhase("rest");
  }

  function skipExercise() {
    setTimerRunning(false);
    if (exerciseIndex < starterExercises.length - 1) {
      setExerciseIndex((current) => current + 1);
      setCurrentSet(1);
      setPhase("exercise");
      return;
    }
    void finishWorkout();
  }

  if (finished) {
    return (
      <AppLayout contentContainerStyle={styles.completeScreen}>
        <View style={styles.completeIcon}>
          <Ionicons name="checkmark-circle" size={78} color={colors.teal} />
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
    <AppLayout contentContainerStyle={styles.screen}>
      <View style={styles.topRow}>
        <ScreenTitle title="Active Workout" subtitle={`${exerciseIndex + 1} of ${starterExercises.length} exercises`} />
        <View style={styles.topActions}>
          <TouchableOpacity style={styles.demoToggle} onPress={() => setIsDemoVisible((current) => !current)}>
            <Ionicons name={isDemoVisible ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.timer}>{formatTime(elapsed)}</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {phase === "rest" ? (
        <View style={styles.restModule}>
          <Text style={styles.restLabel}>REST</Text>
          <Text style={styles.restValue}>{formatTime(restRemaining)}</Text>
          <Text style={styles.nextLabel}>Next: {exercise.name} · set {currentSet}</Text>
          <TouchableOpacity style={styles.skipRest} onPress={() => { setRestRemaining(0); setPhase("exercise"); }}>
            <Text style={styles.skipRestText}>Skip Rest</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {isDemoVisible ? (
            <View style={[styles.mediaCard, { height: mediaHeight }]}>
              {mediaFailed ? (
                <View style={styles.mediaFallback}>
                  <Ionicons name="barbell-outline" size={34} color={colors.accent} />
                  <Text style={styles.mediaFallbackText}>Demo unavailable — follow the coaching cues below.</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: exercise.animationUrl }}
                  style={styles.animation}
                  resizeMode="contain"
                  onError={() => setMediaFailed(true)}
                />
              )}
              <View style={styles.mediaBadge}>
                <Ionicons name="repeat" size={12} color={colors.teal} />
                <Text style={styles.mediaBadgeText}>DEMO</Text>
              </View>
            </View>
          ) : null}

          <GlassCard radius={18} style={[styles.exerciseCard, !isDemoVisible && styles.exerciseCardExpanded]}>
            <View style={styles.exerciseHeading}>
              <View style={styles.flex}>
                <Text style={styles.muscle}>{exercise.muscleGroup.toUpperCase()}</Text>
                <Text style={styles.exercise}>{exercise.name}</Text>
              </View>
              <Text style={styles.exerciseCount}>{exerciseIndex + 1}/{starterExercises.length}</Text>
            </View>

            <View style={styles.setMetrics}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{currentSet}</Text>
                <Text style={styles.metricLabel}>OF {exercise.sets} SETS</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{timedSeconds ? formatTime(timerRemaining) : exercise.reps}</Text>
                <Text style={styles.metricLabel}>{timedSeconds ? "COUNTDOWN" : "TARGET REPS"}</Text>
              </View>
            </View>

            <View style={styles.coachingRow}>
              <Ionicons name="information-circle" size={16} color={colors.accent} />
              <Text numberOfLines={isDemoVisible ? 2 : 4} style={styles.coaching}>{exercise.instructions}</Text>
            </View>
          </GlassCard>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.skipExercise} onPress={skipExercise} disabled={saving}>
              <Text style={styles.skipExerciseText}>Skip exercise</Text>
            </TouchableOpacity>
            {timedSeconds ? (
              <TouchableOpacity
                style={[styles.primary, saving && styles.disabled]}
                onPress={() => setTimerRunning((current) => !current)}
                disabled={saving || timerRemaining === 0}
              >
                <Ionicons name={timerRunning ? "pause" : "play"} size={17} color={colors.textPrimary} />
                <Text style={styles.primaryText}>{timerRunning ? "Pause" : timerRemaining < timedSeconds ? "Resume" : "Start"}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.primary} onPress={advanceAfterSet} disabled={saving}>
                {saving ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.primaryText}>Complete Set</Text>}
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </AppLayout>
  );
}

function parseTimedDuration(reps: string) {
  const normalized = reps.toLowerCase().trim();
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value)) return null;
  if (normalized.includes("min")) return Math.round(value * 60);
  if (normalized.includes("sec") || /^\d+\s*s$/.test(normalized)) return Math.round(value);
  return null;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

const styles = StyleSheet.create({
  screen: { gap: 10, paddingBottom: 12 },
  flex: { flex: 1 },
  topRow: { alignItems: "flex-start", flexDirection: "row", gap: 10, justifyContent: "space-between" },
  topActions: { alignItems: "center", flexDirection: "row", gap: 8 },
  demoToggle: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 17, height: 34, justifyContent: "center", width: 34 },
  timer: { color: colors.accent, fontSize: 17, fontVariant: ["tabular-nums"], fontWeight: "900" },
  progressTrack: { backgroundColor: "rgba(255,255,255,0.09)", borderRadius: 4, height: 6, overflow: "hidden" },
  progressFill: { backgroundColor: colors.accent, borderRadius: 4, height: 6 },
  mediaCard: { backgroundColor: "#FFFFFF", borderRadius: 18, flexShrink: 1, overflow: "hidden", position: "relative" },
  animation: { height: "100%", resizeMode: "contain", width: "100%" },
  mediaFallback: { alignItems: "center", flex: 1, gap: 8, justifyContent: "center", paddingHorizontal: 24 },
  mediaFallbackText: { color: "#334155", fontSize: 12, lineHeight: 17, textAlign: "center" },
  mediaBadge: { alignItems: "center", backgroundColor: "rgba(6,9,20,0.88)", borderRadius: 9, bottom: 8, flexDirection: "row", gap: 5, paddingHorizontal: 8, paddingVertical: 5, position: "absolute", right: 8 },
  mediaBadgeText: { color: colors.teal, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  exerciseCard: { flexShrink: 1, gap: 10, padding: 16 },
  exerciseCardExpanded: { flexGrow: 1, justifyContent: "center" },
  exerciseHeading: { alignItems: "center", flexDirection: "row", gap: 10 },
  exerciseCount: { color: colors.textTertiary, fontSize: 12, fontWeight: "800" },
  muscle: { color: colors.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  exercise: { color: colors.textPrimary, fontSize: 23, fontWeight: "900", marginTop: 2 },
  setMetrics: { flexDirection: "row", gap: 10 },
  metric: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.045)", borderRadius: 12, flex: 1, padding: 10 },
  metricValue: { color: colors.textPrimary, fontSize: 23, fontVariant: ["tabular-nums"], fontWeight: "900" },
  metricLabel: { color: colors.textTertiary, fontSize: 8, fontWeight: "800", marginTop: 2 },
  coachingRow: { alignItems: "flex-start", flexDirection: "row", gap: 8 },
  coaching: { color: colors.textSecondary, flex: 1, fontSize: 12, lineHeight: 17 },
  controls: { alignItems: "center", flexDirection: "row", gap: 10, marginTop: "auto" },
  skipExercise: { alignItems: "center", borderColor: "rgba(255,255,255,0.14)", borderRadius: 14, borderWidth: 1, justifyContent: "center", minHeight: 52, paddingHorizontal: 14 },
  skipExerciseText: { color: colors.textSecondary, fontSize: 12, fontWeight: "800" },
  primary: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 14, flex: 1, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 52, paddingHorizontal: 16 },
  primaryText: { color: colors.textPrimary, fontSize: 14, fontWeight: "900" },
  disabled: { opacity: 0.45 },
  error: { color: colors.danger, fontSize: 11, textAlign: "center" },
  restModule: { alignItems: "center", flex: 1, justifyContent: "center" },
  restLabel: { color: colors.accent, fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  restValue: { color: colors.textPrimary, fontSize: 72, fontVariant: ["tabular-nums"], fontWeight: "300", letterSpacing: -3, marginVertical: 8 },
  nextLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: 24 },
  skipRest: { paddingHorizontal: 22, paddingVertical: 12 },
  skipRestText: { color: colors.accent, fontSize: 14, fontWeight: "900" },
  completeScreen: { alignItems: "center", gap: 14, justifyContent: "center" },
  completeIcon: { alignItems: "center", backgroundColor: "rgba(0,217,178,0.1)", borderRadius: 58, height: 116, justifyContent: "center", width: 116 },
  completeTitle: { color: colors.textPrimary, fontSize: 28, fontWeight: "900" },
  completeCopy: { color: colors.textSecondary, fontSize: 14, textAlign: "center" }
});
