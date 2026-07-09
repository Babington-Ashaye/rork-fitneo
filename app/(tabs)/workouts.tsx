import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { Chip, EmptySpacer, ErrorState, IconBubble, MetaItem, ScreenTitle, SkeletonBlock, TouchableCard } from "@/components/ScreenKit";
import { fetchWorkoutPrograms, WorkoutProgram } from "@/lib/api";
import { colors, radii } from "@/lib/theme";

const filters = ["All", "Strength", "Conditioning", "Mobility", "Core"];

export default function WorkoutsScreen() {
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadPrograms() {
    setError(null);
    setIsLoading(true);
    try {
      setPrograms(await fetchWorkoutPrograms());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workout programs.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPrograms();
  }, []);

  const visiblePrograms = useMemo(() => {
    return programs.filter((program) => {
      const matchesFilter = filter === "All" || program.category.toLowerCase().includes(filter.toLowerCase());
      const matchesQuery = program.name.toLowerCase().includes(query.toLowerCase()) || program.category.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [filter, programs, query]);

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
        <TextInput placeholder="Search workouts" placeholderTextColor={colors.textTertiary} style={styles.searchInput} value={query} onChangeText={setQuery} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {filters.map((item) => (
          <TouchableOpacity key={item} activeOpacity={0.78} onPress={() => setFilter(item)}>
            <Chip title={item} active={filter === item} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.list}>
          <SkeletonBlock height={132} radius={16} />
          <SkeletonBlock height={132} radius={16} />
          <SkeletonBlock height={132} radius={16} />
        </View>
      ) : null}
      {error ? <ErrorState message={error} onRetry={loadPrograms} /> : null}

      {!isLoading && !error ? (
        <View style={styles.list}>
          {visiblePrograms.map((program) => (
            <WorkoutCard key={program.id} program={program} />
          ))}
          {visiblePrograms.length === 0 ? <Text style={styles.emptyText}>No programs match that filter.</Text> : null}
        </View>
      ) : null}

      <EmptySpacer />
    </AppLayout>
  );
}

function WorkoutCard({ program }: { program: WorkoutProgram }) {
  const tint = program.category.toLowerCase().includes("conditioning") ? colors.coral : program.category.toLowerCase().includes("mobility") ? colors.teal : colors.accent;
  const icon: keyof typeof Ionicons.glyphMap = program.category.toLowerCase().includes("mobility") ? "body" : program.category.toLowerCase().includes("conditioning") ? "flash" : "barbell";

  return (
    <TouchableCard radius={radii.xl} style={styles.workoutCard} onPress={() => router.push("/active-workout")}>
      <View style={styles.row}>
        <IconBubble icon={icon} tint={tint} shape="rounded" size={48} />
        <View style={styles.workoutTitleBlock}>
          <Text style={styles.workoutName}>{program.name}</Text>
          <Text style={[styles.category, { color: tint }]}>{program.category}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </View>
      <Text style={styles.description} numberOfLines={2}>Balanced programming with progressions, rest timing, and FITNEO XP rewards.</Text>
      <View style={styles.metaFooter}>
        <MetaItem icon="time" text={`${program.durationMinutes}m`} />
        <MetaItem icon="flame" text={String(program.calories)} />
        <MetaItem icon="layers" text={`${program.exercises} ex`} />
        <View style={styles.dots}>
          {[1, 2, 3].map((dot) => <View key={dot} style={[styles.dot, { backgroundColor: dot <= program.difficulty ? colors.accent : "rgba(255,255,255,0.15)" }]} />)}
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
  workoutCard: {
    gap: 14,
    padding: 18
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
