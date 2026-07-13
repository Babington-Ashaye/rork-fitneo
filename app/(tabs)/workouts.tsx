import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AdaptiveBanner } from "@/components/AdaptiveBanner";
import { AppLayout } from "@/components/AppLayout";
import { Chip, EmptySpacer, IconBubble, MetaItem, ScreenTitle, TouchableCard } from "@/components/ScreenKit";
import { useSubscription } from "@/context/SubscriptionContext";
import {
  getEquipmentTierBadgeColor,
  getCleanEquipmentTierLabel,
  getWorkoutProgramExercises,
  getWorkoutTrainingFrequency,
  workoutPrograms
} from "@/lib/exercises";
import type { WorkoutProgram } from "@/lib/exercises";
import { colors, radii } from "@/lib/theme";

const filters = ["All", "Strength", "Conditioning", "Mobility", "Core"];
const equipmentOrder: Record<WorkoutProgram["equipmentTier"], number> = { none: 0, few: 1, full: 2 };
const difficultyDots: Record<WorkoutProgram["difficulty"], number> = { Beginner: 1, Intermediate: 2, Advanced: 3 };
const workoutHeroImage = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80";
const programImages = {
  strength: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=80",
  conditioning: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&q=80",
  mobility: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&q=80",
  core: "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=900&q=80"
};

export default function WorkoutsScreen() {
  const { isPremium } = useSubscription();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const visiblePrograms = useMemo(() => {
    return workoutPrograms.filter((program) => {
      const matchesFilter = filter === "All" || program.category.toLowerCase().includes(filter.toLowerCase());
      const cleanQuery = query.toLowerCase();
      const matchesQuery =
        program.name.toLowerCase().includes(cleanQuery) ||
        program.category.toLowerCase().includes(cleanQuery) ||
        program.description.toLowerCase().includes(cleanQuery);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  const groupedPrograms = useMemo(() => {
    const groups = visiblePrograms.reduce<Array<{ name: string; programs: WorkoutProgram[] }>>((acc, program) => {
      const existing = acc.find((group) => group.name === program.name);
      if (existing) {
        existing.programs.push(program);
      } else {
        acc.push({ name: program.name, programs: [program] });
      }
      return acc;
    }, []);
    return groups.map((group) => ({
      ...group,
      programs: [...group.programs].sort((a, b) => equipmentOrder[a.equipmentTier] - equipmentOrder[b.equipmentTier])
    }));
  }, [visiblePrograms]);

  return (
    <AppLayout scroll>
      <View style={styles.segment}>
        <TouchableOpacity activeOpacity={0.78} style={styles.segmentActive}>
          <Text style={styles.segmentActiveText}>Normal</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.78} style={styles.segmentInactive} onPress={() => router.push("/sports-mode")}>
          <Text style={styles.segmentInactiveText}>Sports</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <ImageBackground source={{ uri: workoutHeroImage }} resizeMode="cover" style={StyleSheet.absoluteFillObject} imageStyle={styles.heroImage}>
          <LinearGradient colors={["rgba(0,0,0,0.38)", "rgba(0,0,0,0.88)"]} style={StyleSheet.absoluteFillObject} />
        </ImageBackground>
        <Text style={styles.heroKicker}>TRAINING LIBRARY</Text>
        <Text style={styles.heroTitle}>Choose your next win</Text>
        <Text style={styles.heroCopy}>Home, gym, strength, conditioning, mobility — every plan now opens with a full preview before you start.</Text>
      </View>

      <AdaptiveBanner enabled={!isPremium} label="Sponsored training plan" />

      <ScreenTitle title="Workouts" subtitle="Programs tuned to your level" />

      <TouchableCard radius={radii.lg} style={styles.createCard} onPress={() => router.push("/custom-workout")}>
        <Ionicons name="add-circle" size={20} color={colors.accent} />
        <Text style={styles.createText}>Create Custom Workout</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </TouchableCard>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput placeholder="Search workouts" placeholderTextColor={colors.textTertiary} style={styles.searchInput} value={query} onChangeText={setQuery} underlineColorAndroid="transparent" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {filters.map((item) => (
          <TouchableOpacity key={item} activeOpacity={0.78} onPress={() => setFilter(item)}>
            <Chip title={item} active={filter === item} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.list}>
        {groupedPrograms.map((group) => (
          <View key={group.name} style={group.programs.length > 1 ? styles.programPair : undefined}>
            {group.programs.length > 1 ? <Text style={styles.pairLabel}>{group.name} options</Text> : null}
            {group.programs.map((program) => (
              <WorkoutCard key={program.id} program={program} isPaired={group.programs.length > 1} />
            ))}
          </View>
        ))}
        {visiblePrograms.length === 0 ? <Text style={styles.emptyText}>No programs match that filter.</Text> : null}
      </View>

      <EmptySpacer />
    </AppLayout>
  );
}

function WorkoutCard({ isPaired, program }: { isPaired: boolean; program: WorkoutProgram }) {
  const tint = program.category.toLowerCase().includes("conditioning") ? colors.coral : program.category.toLowerCase().includes("mobility") ? colors.teal : colors.accent;
  const icon: keyof typeof Ionicons.glyphMap = program.category.toLowerCase().includes("mobility") ? "body" : program.category.toLowerCase().includes("conditioning") ? "flash" : "barbell";
  const exercises = getWorkoutProgramExercises(program.id);
  const badgeColor = getEquipmentTierBadgeColor(program.equipmentTier);
  const tierVariant = program.equipmentTier === "none" ? "Home version" : program.equipmentTier === "few" ? "Home gear version" : "Gym version";
  const frequency = getWorkoutTrainingFrequency(program.id);
  const image = program.category.toLowerCase().includes("conditioning")
    ? programImages.conditioning
    : program.category.toLowerCase().includes("mobility")
      ? programImages.mobility
      : program.category.toLowerCase().includes("core")
        ? programImages.core
        : programImages.strength;

  return (
    <TouchableCard
      radius={radii.xl}
      style={[styles.workoutCard, isPaired && styles.pairedCard]}
      onPress={() => router.push({ pathname: "/workout-preview", params: { programId: program.id, programName: program.name } })}
    >
      <ImageBackground source={{ uri: image }} resizeMode="cover" style={StyleSheet.absoluteFillObject} imageStyle={styles.cardImage}>
        <LinearGradient colors={["rgba(0,0,0,0.18)", "rgba(0,0,0,0.78)", "rgba(0,0,0,0.94)"]} style={StyleSheet.absoluteFillObject} />
      </ImageBackground>
      <View style={styles.row}>
        <IconBubble icon={icon} tint={tint} shape="rounded" size={48} />
        <View style={styles.workoutTitleBlock}>
          <Text style={styles.workoutName}>{program.name}</Text>
          <Text style={[styles.category, { color: tint }]}>{program.category} · {tierVariant}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </View>
      <Text style={styles.description} numberOfLines={3}>{program.description}</Text>
      <View style={styles.frequencyPill}>
        <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
        <Text style={styles.frequencyText}>{frequency}</Text>
      </View>
      <View style={styles.equipmentRow}>
        <Text style={[styles.equipmentPill, { backgroundColor: `${badgeColor}22`, borderColor: `${badgeColor}66`, color: badgeColor }]}>
          {getCleanEquipmentTierLabel(program.equipmentTier)}
        </Text>
      </View>
      <View style={styles.metaFooter}>
        <MetaItem icon="time" text={`${program.durationMinutes}m`} />
        <MetaItem icon="layers" text={`${exercises.length || program.exerciseIds.length} ex`} />
        <MetaItem icon="bar-chart" text={program.difficulty} />
        <View style={styles.dots}>
          {[1, 2, 3].map((dot) => <View key={dot} style={[styles.dot, { backgroundColor: dot <= difficultyDots[program.difficulty] ? colors.accent : "rgba(255,255,255,0.15)" }]} />)}
        </View>
      </View>
    </TouchableCard>
  );
}

const styles = StyleSheet.create({
  segment: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: colors.cardStroke,
    borderRadius: radii.round,
    borderWidth: 1,
    flexDirection: "row",
    padding: 3
  },
  segmentActive: {
    backgroundColor: colors.accent,
    borderRadius: radii.round,
    flex: 1,
    paddingVertical: 11
  },
  segmentInactive: {
    flex: 1,
    paddingVertical: 11
  },
  segmentActiveText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center"
  },
  segmentInactiveText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center"
  },
  hero: {
    borderColor: "rgba(10,132,255,0.24)",
    borderRadius: 28,
    borderWidth: 1,
    gap: 8,
    minHeight: 190,
    overflow: "hidden",
    padding: 22,
    justifyContent: "flex-end"
  },
  heroImage: {
    borderRadius: 28
  },
  heroKicker: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.7
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.7
  },
  heroCopy: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    maxWidth: 330
  },
  createCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    minHeight: 68,
    padding: 18
  },
  createText: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 15,
    fontWeight: "700"
  },
  search: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: colors.cardStroke,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 16
  },
  searchInput: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 15
  },
  chips: {
    gap: 10,
    paddingRight: 20
  },
  list: {
    gap: 16
  },
  programPair: {
    backgroundColor: "rgba(255,255,255,0.025)",
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 8
  },
  pairLabel: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    paddingHorizontal: 8,
    textTransform: "uppercase"
  },
  workoutCard: {
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    gap: 14,
    minHeight: 236,
    overflow: "hidden",
    padding: 18,
    justifyContent: "flex-end"
  },
  cardImage: {
    borderRadius: radii.xl
  },
  pairedCard: {
    backgroundColor: "rgba(255,255,255,0.04)"
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14
  },
  workoutTitleBlock: {
    flex: 1,
    gap: 4
  },
  workoutName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "700"
  },
  category: {
    fontSize: 12,
    fontWeight: "600"
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19
  },
  equipmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  frequencyPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(148,163,184,0.10)",
    borderColor: "rgba(148,163,184,0.18)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  frequencyText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "800"
  },
  equipmentPill: {
    backgroundColor: "rgba(255,199,51,0.12)",
    borderColor: "rgba(255,199,51,0.26)",
    borderRadius: 999,
    borderWidth: 1,
    color: colors.gold,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  noEquipmentPill: {
    backgroundColor: "rgba(0,217,178,0.12)",
    borderColor: "rgba(0,217,178,0.3)",
    color: colors.teal
  },
  metaFooter: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16
  },
  dots: {
    flexDirection: "row",
    gap: 3,
    marginLeft: "auto"
  },
  dot: {
    borderRadius: 3,
    height: 6,
    width: 6
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 24,
    textAlign: "center"
  }
});
