import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { EmptySpacer, GlassCard, MetaItem } from "@/components/ScreenKit";
import {
  getCleanEquipmentTierLabel,
  getEquipmentTierBadgeColor,
  getWorkoutProgramExercises,
  getWorkoutTrainingFrequency,
  workoutPrograms
} from "@/lib/exercises";
import { colors, radii } from "@/lib/theme";

export default function WorkoutPreviewScreen() {
  const params = useLocalSearchParams<{ programId?: string; programName?: string }>();
  const programId = typeof params.programId === "string" ? params.programId : undefined;
  const program = workoutPrograms.find((item) => item.id === programId) ?? workoutPrograms[0];
  const exercises = getWorkoutProgramExercises(program?.id);
  const frequency = getWorkoutTrainingFrequency(program?.id);
  const badgeColor = getEquipmentTierBadgeColor(program.equipmentTier);

  return (
    <AppLayout scroll contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.78} style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.category}>{program.category}</Text>
          <Text style={styles.title}>{program.name}</Text>
        </View>
      </View>

      <GlassCard radius={22} style={styles.heroCard}>
        <View style={styles.pillRow}>
          <Text style={[styles.equipmentBadge, { backgroundColor: `${badgeColor}22`, borderColor: `${badgeColor}66`, color: badgeColor }]}>
            {getCleanEquipmentTierLabel(program.equipmentTier)}
          </Text>
          <View style={styles.frequencyPill}>
            <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.frequencyText}>{frequency}</Text>
          </View>
        </View>
        <Text style={styles.description}>{program.description}</Text>
        <View style={styles.metaRow}>
          <MetaItem icon="time" text={`${program.durationMinutes} min`} />
          <MetaItem icon="layers" text={`${exercises.length} exercises`} />
          <MetaItem icon="bar-chart" text={program.difficulty} />
        </View>
      </GlassCard>

      <Text style={styles.sectionTitle}>Exercise list</Text>
      <View style={styles.exerciseList}>
        {exercises.map((exercise, index) => {
          const exerciseBadgeColor = getEquipmentTierBadgeColor(exercise.equipmentTier);
          return (
            <GlassCard key={exercise.id} radius={16} style={styles.exerciseRow}>
              <Text style={styles.exerciseIndex}>{index + 1}</Text>
              <View style={styles.exerciseBody}>
                <View style={styles.exerciseTop}>
                  <View style={styles.flex}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseMuscle}>{exercise.muscleGroup}</Text>
                  </View>
                  <Text style={[styles.exerciseEquipment, { backgroundColor: `${exerciseBadgeColor}22`, borderColor: `${exerciseBadgeColor}66`, color: exerciseBadgeColor }]}>
                    {getCleanEquipmentTierLabel(exercise.equipmentTier)}
                  </Text>
                </View>
                <View style={styles.exerciseMeta}>
                  <Text style={styles.exerciseMetaText}>{exercise.sets} sets</Text>
                  <Text style={styles.exerciseDot}>•</Text>
                  <Text style={styles.exerciseMetaText}>{exercise.reps} reps</Text>
                  <Text style={styles.exerciseDot}>•</Text>
                  <Text style={styles.exerciseMetaText}>{exercise.restSeconds}s rest</Text>
                </View>
              </View>
            </GlassCard>
          );
        })}
      </View>

      <TouchableOpacity
        activeOpacity={0.84}
        style={styles.startButton}
        onPress={() => router.push({ pathname: "/active-workout", params: { programId: program.id, programName: program.name } })}
      >
        <Ionicons name="play" size={18} color={colors.textPrimary} />
        <Text style={styles.startText}>Start Workout</Text>
      </TouchableOpacity>
      <EmptySpacer />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 16 },
  header: { alignItems: "center", flexDirection: "row", gap: 12 },
  backButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 20, height: 42, justifyContent: "center", width: 42 },
  headerCopy: { flex: 1 },
  category: { color: colors.accent, fontSize: 11, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase" },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: "900", marginTop: 3 },
  heroCard: { gap: 14, padding: 18 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  equipmentBadge: { borderRadius: 999, borderWidth: 1, fontSize: 10, fontWeight: "900", letterSpacing: 0.4, paddingHorizontal: 9, paddingVertical: 5 },
  frequencyPill: { alignItems: "center", backgroundColor: "rgba(148,163,184,0.10)", borderColor: "rgba(148,163,184,0.18)", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 5, paddingHorizontal: 9, paddingVertical: 5 },
  frequencyText: { color: colors.textSecondary, fontSize: 10, fontWeight: "800" },
  description: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "900" },
  exerciseList: { gap: 10 },
  exerciseRow: { alignItems: "flex-start", flexDirection: "row", gap: 12, padding: 14 },
  exerciseIndex: { color: colors.accent, fontSize: 14, fontWeight: "900", width: 22 },
  exerciseBody: { flex: 1, gap: 9 },
  exerciseTop: { alignItems: "flex-start", flexDirection: "row", gap: 8 },
  flex: { flex: 1 },
  exerciseName: { color: colors.textPrimary, fontSize: 15, fontWeight: "900" },
  exerciseMuscle: { color: colors.textTertiary, fontSize: 11, fontWeight: "700", marginTop: 2 },
  exerciseEquipment: { borderRadius: 999, borderWidth: 1, flexShrink: 0, fontSize: 8, fontWeight: "900", maxWidth: 116, paddingHorizontal: 7, paddingVertical: 4, textAlign: "center" },
  exerciseMeta: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 6 },
  exerciseMetaText: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
  exerciseDot: { color: colors.textTertiary, fontSize: 12 },
  startButton: { alignItems: "center", backgroundColor: colors.accent, borderRadius: radii.lg, flexDirection: "row", gap: 9, justifyContent: "center", minHeight: 56 },
  startText: { color: colors.textPrimary, fontSize: 16, fontWeight: "900" }
});
