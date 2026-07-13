import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

const previewHeroImages: Record<string, string> = {
  conditioning: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
  core: "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&w=1200&q=80",
  mobility: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
  strength: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80"
};

export default function WorkoutPreviewScreen() {
  const params = useLocalSearchParams<{ programId?: string; programName?: string }>();
  const programId = typeof params.programId === "string" ? params.programId : undefined;
  const program = workoutPrograms.find((item) => item.id === programId) ?? workoutPrograms[0];
  const exercises = getWorkoutProgramExercises(program.id);
  const frequency = getWorkoutTrainingFrequency(program.id);
  const badgeColor = getEquipmentTierBadgeColor(program.equipmentTier);
  const heroImage = getPreviewHeroImage(program.category);

  return (
    <AppLayout scroll contentContainerStyle={styles.screen}>
      <ImageBackground source={{ uri: heroImage }} resizeMode="cover" style={styles.hero} imageStyle={styles.heroImage}>
        <LinearGradient colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0.58)", "#000"]} style={styles.heroOverlay}>
          <View style={styles.heroActions}>
            <TouchableOpacity activeOpacity={0.78} style={styles.heroIconButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.heroRightActions}>
              <TouchableOpacity activeOpacity={0.78} style={styles.heroIconButton}>
                <Ionicons name="heart-outline" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.78} style={styles.heroIconButton}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
          <View>
            <Text style={styles.heroCategory}>{program.category}</Text>
            <Text style={styles.heroTitle}>{program.name}</Text>
          </View>
        </LinearGradient>
      </ImageBackground>

      <GlassCard radius={28} style={styles.heroCard}>
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

      <Text style={styles.sectionTitle}>Exercises ({exercises.length})</Text>
      <View style={styles.exerciseList}>
        {exercises.map((exercise, index) => {
          const exerciseBadgeColor = getEquipmentTierBadgeColor(exercise.equipmentTier);
          return (
            <GlassCard key={exercise.id} radius={18} style={styles.exerciseRow}>
              <View style={styles.exerciseThumbWrap}>
                <Image source={{ uri: exercise.animationUrl }} style={styles.exerciseThumb} resizeMode="contain" />
                <Text style={styles.exerciseIndex}>{index + 1}</Text>
              </View>
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

function getPreviewHeroImage(category: string) {
  const key = category.toLowerCase();
  if (key.includes("conditioning")) return previewHeroImages.conditioning;
  if (key.includes("core")) return previewHeroImages.core;
  if (key.includes("mobility")) return previewHeroImages.mobility;
  return previewHeroImages.strength;
}

const styles = StyleSheet.create({
  screen: { gap: 16, paddingTop: 0 },
  hero: { borderBottomLeftRadius: 32, borderBottomRightRadius: 32, marginHorizontal: -20, marginTop: -8, minHeight: 310, overflow: "hidden" },
  heroImage: { borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  heroOverlay: { flex: 1, justifyContent: "space-between", paddingBottom: 34, paddingHorizontal: 24, paddingTop: 18 },
  heroActions: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  heroIconButton: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.46)", borderColor: "rgba(255,255,255,0.14)", borderRadius: 22, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  heroRightActions: { alignItems: "center", flexDirection: "row", gap: 10 },
  heroCategory: { color: "rgba(255,255,255,0.82)", fontSize: 13, fontWeight: "900", letterSpacing: 1.8, textTransform: "uppercase" },
  heroTitle: { color: colors.textPrimary, fontSize: 38, fontWeight: "900", letterSpacing: -1.3, lineHeight: 42, marginTop: 6, maxWidth: 360 },
  heroCard: { gap: 14, marginTop: -34, padding: 20 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  equipmentBadge: { borderRadius: 999, borderWidth: 1, fontSize: 10, fontWeight: "900", letterSpacing: 0.4, paddingHorizontal: 9, paddingVertical: 5 },
  frequencyPill: { alignItems: "center", backgroundColor: "rgba(148,163,184,0.10)", borderColor: "rgba(148,163,184,0.18)", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 5, paddingHorizontal: 9, paddingVertical: 5 },
  frequencyText: { color: colors.textSecondary, fontSize: 10, fontWeight: "800" },
  description: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  sectionTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: "900" },
  exerciseList: { gap: 10 },
  exerciseRow: { alignItems: "center", flexDirection: "row", gap: 14, padding: 12 },
  exerciseThumbWrap: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.94)", borderRadius: 18, height: 76, justifyContent: "center", overflow: "hidden", width: 76 },
  exerciseThumb: { height: "100%", width: "100%" },
  exerciseIndex: { backgroundColor: colors.accent, borderRadius: 10, color: colors.textPrimary, fontSize: 10, fontWeight: "900", left: 6, overflow: "hidden", paddingHorizontal: 6, paddingVertical: 2, position: "absolute", top: 6 },
  exerciseBody: { flex: 1, gap: 9 },
  exerciseTop: { alignItems: "flex-start", flexDirection: "row", gap: 8 },
  flex: { flex: 1 },
  exerciseName: { color: colors.textPrimary, fontSize: 16, fontWeight: "900" },
  exerciseMuscle: { color: colors.textTertiary, fontSize: 11, fontWeight: "700", marginTop: 2 },
  exerciseEquipment: { borderRadius: 999, borderWidth: 1, flexShrink: 0, fontSize: 8, fontWeight: "900", maxWidth: 124, paddingHorizontal: 7, paddingVertical: 4, textAlign: "center" },
  exerciseMeta: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 6 },
  exerciseMetaText: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
  exerciseDot: { color: colors.textTertiary, fontSize: 12 },
  startButton: { alignItems: "center", backgroundColor: colors.accent, borderRadius: radii.lg, flexDirection: "row", gap: 9, justifyContent: "center", minHeight: 58, shadowColor: colors.accent, shadowOpacity: 0.42, shadowRadius: 18 },
  startText: { color: colors.textPrimary, fontSize: 16, fontWeight: "900" }
});
