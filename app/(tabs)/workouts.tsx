import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { Chip, EmptySpacer, IconBubble, MetaItem, ScreenTitle, TouchableCard } from "@/components/ScreenKit";
import {
  getEquipmentTierBadgeColor,
  getEquipmentTierLabel,
  getWorkoutProgramExercises,
  workoutPrograms
} from "@/lib/exercises";
import type { WorkoutProgram } from "@/lib/exercises";
import { colors, radii } from "@/lib/theme";

const filters = ["All", "Strength", "Conditioning", "Mobility", "Core"];
const equipmentOrder: Record<WorkoutProgram["equipmentTier"], number> = { none: 0, few: 1, full: 2 };
const difficultyDots: Record<WorkoutProgram["difficulty"], number> = { Beginner: 1, Intermediate: 2, Advanced: 3 };

export default function WorkoutsScreen() {
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
        <TouchableOpacity activeOpacity={0.78} style={styles.segmentInactive} onPress={() => router.push("/(tabs)/nutrition")}>
          <Text style={styles.segmentInactiveText}>Eating</Text>
        </TouchableOpacity>
      </View>

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

  return (
    <TouchableCard
      radius={radii.xl}
      style={[styles.workoutCard, isPaired && styles.pairedCard]}
      onPress={() => router.push({ pathname: "/active-workout", params: { programId: program.id, programName: program.name } })}
    >
      <View style={styles.row}>
        <IconBubble icon={icon} tint={tint} shape="rounded" size={48} />
        <View style={styles.workoutTitleBlock}>
          <Text style={styles.workoutName}>{program.name}</Text>
          <Text style={[styles.category, { color: tint }]}>{program.category} · {tierVariant}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </View>
      <Text style={styles.description} numberOfLines={3}>{program.description}</Text>
      <View style={styles.equipmentRow}>
        <Text style={[styles.equipmentPill, { backgroundColor: `${badgeColor}22`, borderColor: `${badgeColor}66`, color: badgeColor }]}>
          {getEquipmentTierLabel(program.equipmentTier)}
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
    gap: 14,
    padding: 18
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
