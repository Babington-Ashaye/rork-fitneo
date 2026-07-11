import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { ErrorState, GlassCard, LoadingState } from "@/components/ScreenKit";
import { useSubscription } from "@/context/SubscriptionContext";
import { completeWorkoutSession } from "@/lib/api";
import { getWorkoutProgramExercises } from "@/lib/exercises";
import { colors } from "@/lib/theme";

type WorkoutPhase = "exercise" | "rest";

export default function ActiveWorkoutScreen() {
  const { height, width } = useWindowDimensions();
  const params = useLocalSearchParams<{ programId?: string; programName?: string }>();
  const { isLoading: isSubscriptionLoading, userPlan } = useSubscription();
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

  const programName = typeof params.programName === "string" ? params.programName : "Workout Session";
  const programId = typeof params.programId === "string" ? params.programId : undefined;
  const exercises = useMemo(() => getWorkoutProgramExercises(programId, userPlan), [programId, userPlan]);
  const currentExerciseIndex = exercises.length > 0 ? Math.min(exerciseIndex, exercises.length - 1) : 0;
  const exercise = exercises[currentExerciseIndex];
  const timedSeconds = useMemo(() => exercise ? parseTimedDuration(exercise.reps) : null, [exercise]);
  const progress = exercises.length > 0 ? ((currentExerciseIndex + 1) / exercises.length) * 100 : 0;
  const mediaHeight = Math.max(178, Math.min(238, height * 0.28, width * 0.62));

  useEffect(() => {
    const timer = setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (exerciseIndex >= exercises.length && exercises.length > 0) {
      setExerciseIndex(exercises.length - 1);
    }
  }, [exerciseIndex, exercises.length]);

  useEffect(() => {
    if (!exercise) return;
    setTimerRunning(false);
    setTimerRemaining(timedSeconds ?? 0);
    setMediaFailed(false);
  }, [exercise, currentSet, timedSeconds]);

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
        name: programName,
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
    if (saving || !exercise) return;
    const nextCompleted = setsCompleted + 1;
    setSetsCompleted(nextCompleted);
    setTimerRunning(false);

    if (currentSet < exercise.sets) {
      setCurrentSet((current) => current + 1);
      startRest(exercise.restSeconds);
      return;
    }
    if (currentExerciseIndex < exercises.length - 1) {
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
    if (currentExerciseIndex < exercises.length - 1) {
      setExerciseIndex((current) => current + 1);
      setCurrentSet(1);
      setPhase("exercise");
      return;
    }
    void finishWorkout();
  }

  function previousExercise() {
    setTimerRunning(false);
    if (currentExerciseIndex > 0) {
      setExerciseIndex((current) => Math.max(0, current - 1));
      setCurrentSet(1);
      setPhase("exercise");
    }
  }

  if (isSubscriptionLoading) {
    return (
      <AppLayout contentContainerStyle={styles.stateScreen}>
        <LoadingState label="Loading your exercise access..." />
      </AppLayout>
    );
  }

  if (!exercise || exercises.length === 0) {
    return (
      <AppLayout contentContainerStyle={styles.stateScreen}>
        <ErrorState message="No exercises available for this plan. Please refresh your subscription status or try again." />
      </AppLayout>
    );
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
      <View style={styles.sessionHeader}>
        <TouchableOpacity style={styles.roundButton} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.sessionTitle} numberOfLines={1}>{programName}</Text>
          <Text style={styles.timer}>{formatTime(elapsed)}</Text>
        </View>
        <TouchableOpacity style={styles.roundButton} onPress={() => setTimerRunning((current) => !current)}>
          <Ionicons name={timerRunning ? "pause" : "play"} size={18} color={colors.textPrimary} />
        </TouchableOpacity>
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
              <TouchableOpacity style={styles.mediaBadge} onPress={() => setIsDemoVisible(false)}>
                <Ionicons name="eye-off-outline" size={11} color={colors.textSecondary} />
                <Text style={styles.mediaBadgeText}>Hide video</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <GlassCard radius={18} style={[styles.exerciseCard, !isDemoVisible && styles.exerciseCardExpanded]}>
            <View style={styles.exerciseHeading}>
              <View style={styles.flex}>
                <Text style={styles.muscle}>{exercise.muscleGroup.toUpperCase()}</Text>
                <Text style={styles.exercise}>{exercise.name}</Text>
              </View>
              <Text style={styles.exerciseCount}>{currentExerciseIndex + 1}/{exercises.length}</Text>
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
            <View style={styles.coachingRow}>
              <Ionicons name="bulb" size={15} color={colors.gold} />
              <Text numberOfLines={2} style={styles.coaching}>{exercise.tip}</Text>
            </View>
          </GlassCard>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.skipExercise} onPress={previousExercise} disabled={saving || currentExerciseIndex === 0}>
              <Ionicons name="chevron-back" size={19} color={colors.textSecondary} />
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
            <TouchableOpacity style={styles.skipExercise} onPress={skipExercise} disabled={saving}>
              <Ionicons name="chevron-forward" size={19} color={colors.textSecondary} />
            </TouchableOpacity>
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
  screen: { gap: 12, paddingBottom: 12 },
  stateScreen: { justifyContent: "center" },
  flex: { flex: 1 },
  sessionHeader: { alignItems: "center", flexDirection: "row", gap: 12 },
  headerTitleBlock: { flex: 1, gap: 2 },
  sessionTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: "900" },
  roundButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.075)", borderRadius: 19, height: 38, justifyContent: "center", width: 38 },
  topRow: { alignItems: "flex-start", flexDirection: "row", gap: 10, justifyContent: "space-between" },
  topActions: { alignItems: "center", flexDirection: "row", gap: 8 },
  demoToggle: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 17, height: 34, justifyContent: "center", width: 34 },
  timer: { color: colors.accent, fontSize: 17, fontVariant: ["tabular-nums"], fontWeight: "900" },
  progressTrack: { backgroundColor: "rgba(255,255,255,0.09)", borderRadius: 4, height: 6, overflow: "hidden" },
  progressFill: { backgroundColor: colors.accent, borderRadius: 4, height: 6 },
  mediaCard: {
    backgroundColor: "#09090B",
    borderColor: "rgba(0,163,255,0.18)",
    borderRadius: 22,
    borderWidth: 1,
    flexShrink: 1,
    overflow: "hidden",
    position: "relative"
  },
  animation: { backgroundColor: "#09090B", height: "100%", resizeMode: "contain", width: "100%" },
  mediaFallback: { alignItems: "center", flex: 1, gap: 8, justifyContent: "center", paddingHorizontal: 24 },
  mediaFallbackText: { color: "#334155", fontSize: 12, lineHeight: 17, textAlign: "center" },
  mediaBadge: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.82)", borderRadius: 12, flexDirection: "row", gap: 4, paddingHorizontal: 8, paddingVertical: 5, position: "absolute", right: 12, top: 12 },
  mediaBadgeText: { color: "#64748B", fontSize: 9, fontWeight: "900" },
  exerciseCard: { flexShrink: 1, gap: 12, padding: 24 },
  exerciseCardExpanded: { flexGrow: 1, justifyContent: "center" },
  exerciseHeading: { alignItems: "center", flexDirection: "row", gap: 10 },
  exerciseCount: { color: colors.textTertiary, fontSize: 12, fontWeight: "800" },
  muscle: { color: colors.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  exercise: { color: colors.textPrimary, fontSize: 30, fontWeight: "900", marginTop: 2 },
  setMetrics: { flexDirection: "row", gap: 12, justifyContent: "center" },
  metric: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.045)", borderRadius: 18, flex: 1, justifyContent: "center", minHeight: 82, padding: 10 },
  metricValue: { color: colors.textPrimary, fontSize: 34, fontVariant: ["tabular-nums"], fontWeight: "900" },
  metricLabel: { color: colors.textTertiary, fontSize: 9, fontWeight: "800", marginTop: 2 },
  coachingRow: { alignItems: "flex-start", flexDirection: "row", gap: 8 },
  coaching: { color: colors.textSecondary, flex: 1, fontSize: 12, lineHeight: 17 },
  controls: { alignItems: "center", flexDirection: "row", gap: 10, marginTop: "auto" },
  skipExercise: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.055)", borderColor: "rgba(255,255,255,0.10)", borderRadius: 16, borderWidth: 1, justifyContent: "center", minHeight: 52, width: 52 },
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
