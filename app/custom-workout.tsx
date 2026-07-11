import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { EmptySpacer, GlassCard, ScreenTitle } from "@/components/ScreenKit";
import { saveCustomWorkout } from "@/lib/api";
import { Exercise, ExerciseEquipmentTier, getAccessibleExercises, getExercisesByEquipmentTier } from "@/lib/exercises";
import { colors, radii } from "@/lib/theme";
import { useSubscription } from "@/context/SubscriptionContext";

type EquipmentFilter = "all" | ExerciseEquipmentTier;

const equipmentFilters: Array<{ key: EquipmentFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "none", label: "None" },
  { key: "few", label: "Few" },
  { key: "full", label: "Full" }
];

export default function CustomWorkoutScreen() {
  const { isPremium, userPlan } = useSubscription();
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentFilter>("all");
  const [selected, setSelected] = useState<Exercise[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<Exercise[]>(() => getAccessibleExercises(userPlan));

  useEffect(() => {
    setCatalog(getAccessibleExercises(userPlan));
  }, [userPlan]);

  const groupedCatalog = useMemo(() => getExercisesByEquipmentTier(catalog), [catalog]);
  const filteredCatalog = equipmentFilter === "all" ? catalog : groupedCatalog[equipmentFilter];

  const visibleExercises = useMemo(() => {
    const clean = query.trim().toLowerCase();
    const baseList = clean
      ? filteredCatalog.filter((item) =>
          item.name.toLowerCase().includes(clean) || item.muscleGroup.toLowerCase().includes(clean)
        )
      : filteredCatalog;

    return baseList
      .filter((item) =>
        !selected.some((selectedItem) => selectedItem.id === item.id)
      );
  }, [filteredCatalog, query, selected]);

  function addExercise(exercise: Exercise) {
    setSelected((current) => [...current, exercise]);
    setQuery("");
  }

  async function save() {
    if (!name.trim() || selected.length === 0 || isSaving) {
      setStatus("Add a workout name and at least one exercise.");
      return;
    }
    setIsSaving(true);
    setStatus(null);
    try {
      await saveCustomWorkout({ name, exerciseIds: selected.map((item) => item.id) });
      setStatus("Workout saved locally and synced.");
      setTimeout(() => router.back(), 650);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not save this workout.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppLayout scroll>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <ScreenTitle title="Custom Workout" subtitle="Build a reusable routine from the complete FITNEO exercise library." />
      </View>
      {!isPremium ? (
        <TouchableOpacity style={styles.libraryGate} onPress={() => router.push("/paywall")}>
          <Ionicons name="lock-closed" size={16} color={colors.gold} />
          <Text style={styles.libraryGateText}>Free includes 31 foundational exercises. Upgrade to Pro for the complete library.</Text>
        </TouchableOpacity>
      ) : null}
      <GlassCard radius={radii.xxl} style={styles.card}>
        <Text style={styles.title}>Program details</Text>
        <TextInput
          placeholder="Workout name"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          value={name}
          onChangeText={setName}
          underlineColorAndroid="transparent"
        />
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            placeholder="Search exercise or muscle group"
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            underlineColorAndroid="transparent"
          />
        </View>

        <View style={styles.filterBar}>
          {equipmentFilters.map((filter) => {
            const active = equipmentFilter === filter.key;
            const count = filter.key === "all" ? catalog.length : groupedCatalog[filter.key].length;
            return (
              <TouchableOpacity
                key={filter.key}
                activeOpacity={0.78}
                onPress={() => setEquipmentFilter(filter.key)}
                style={[styles.filterTab, active && styles.filterTabActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter.label}</Text>
                <Text style={[styles.filterCount, active && styles.filterTextActive]}>{count}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {visibleExercises.length > 0 ? (
          <View style={styles.suggestions}>
            {visibleExercises.map((item) => (
              <TouchableOpacity key={item.id} style={styles.suggestion} onPress={() => addExercise(item)}>
                <View style={styles.exerciseIcon}><Ionicons name="barbell" size={16} color={colors.accent} /></View>
                <View style={styles.flex}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <Text style={styles.exerciseMeta}>{item.muscleGroup} · {item.difficulty} · {item.equipmentTier}</Text>
                </View>
                <Ionicons name="add-circle" size={22} color={colors.accent} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.suggestionsEmpty}>
            <Text style={styles.empty}>No exercises match this search.</Text>
          </View>
        )}

        {selected.length > 0 ? (
          <ScrollView style={styles.selectedList} nestedScrollEnabled>
            {selected.map((item, index) => (
              <View key={item.id} style={styles.selectedRow}>
                <Text style={styles.order}>{index + 1}</Text>
                <View style={styles.flex}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <Text style={styles.exerciseMeta}>{item.sets} sets · {item.reps} reps · {item.restSeconds}s rest</Text>
                </View>
                <TouchableOpacity onPress={() => setSelected((current) => current.filter((row) => row.id !== item.id))}>
                  <Ionicons name="close-circle" size={21} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.empty}>Start typing to add exercises.</Text>
        )}

        {status ? <Text style={styles.status}>{status}</Text> : null}
        <TouchableOpacity style={[styles.saveButton, isSaving && styles.disabled]} onPress={() => void save()} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color={colors.textPrimary} /> : (
            <>
              <Ionicons name="checkmark-circle" size={19} color={colors.textPrimary} />
              <Text style={styles.saveText}>Save Workout</Text>
            </>
          )}
        </TouchableOpacity>
      </GlassCard>
      <EmptySpacer />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  headerRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  backButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.055)", borderRadius: 18, height: 40, justifyContent: "center", width: 40 },
  card: { gap: 12, padding: 18 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
  input: { backgroundColor: "rgba(255,255,255,0.04)", borderColor: colors.cardStroke, borderRadius: radii.md, borderWidth: 1, color: colors.textPrimary, minHeight: 52, paddingHorizontal: 14 },
  searchWrap: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderColor: colors.cardStroke, borderRadius: radii.md, borderWidth: 1, flexDirection: "row", gap: 9, paddingHorizontal: 14 },
  searchInput: { color: colors.textPrimary, flex: 1, minHeight: 52 },
  filterBar: { backgroundColor: "rgba(255,255,255,0.035)", borderColor: colors.cardStroke, borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 6, padding: 5 },
  filterTab: { alignItems: "center", borderColor: "transparent", borderRadius: 12, borderWidth: 1, flex: 1, justifyContent: "center", minHeight: 44 },
  filterTabActive: { backgroundColor: "rgba(0,163,255,0.16)", borderColor: "rgba(0,163,255,0.68)", shadowColor: colors.accent, shadowOpacity: 0.35, shadowRadius: 12 },
  filterText: { color: colors.textSecondary, fontSize: 12, fontWeight: "900" },
  filterTextActive: { color: colors.textPrimary },
  filterCount: { color: colors.textTertiary, fontSize: 10, fontWeight: "800", marginTop: 2 },
  suggestions: { backgroundColor: "#111827", borderColor: colors.cardStroke, borderRadius: 14, borderWidth: 1, minHeight: 60, overflow: "hidden" },
  suggestionsEmpty: { backgroundColor: "#111827", borderColor: colors.cardStroke, borderRadius: 14, borderWidth: 1, justifyContent: "center", minHeight: 60 },
  suggestion: { alignItems: "center", borderBottomColor: "rgba(255,255,255,0.06)", borderBottomWidth: 1, flexDirection: "row", gap: 10, minHeight: 60, padding: 10 },
  exerciseIcon: { alignItems: "center", backgroundColor: "rgba(10,132,255,0.12)", borderRadius: 10, height: 36, justifyContent: "center", width: 36 },
  flex: { flex: 1 },
  exerciseName: { color: colors.textPrimary, fontSize: 14, fontWeight: "800" },
  exerciseMeta: { color: colors.textTertiary, fontSize: 10, marginTop: 3 },
  selectedList: { maxHeight: 300 },
  selectedRow: { alignItems: "center", borderBottomColor: "rgba(255,255,255,0.07)", borderBottomWidth: 1, flexDirection: "row", gap: 10, minHeight: 62 },
  order: { color: colors.accent, fontSize: 13, fontWeight: "900", width: 20 },
  empty: { color: colors.textTertiary, fontSize: 12, paddingVertical: 14, textAlign: "center" },
  status: { color: colors.teal, fontSize: 12, lineHeight: 18, textAlign: "center" },
  saveButton: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 14, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 54 },
  saveText: { color: colors.textPrimary, fontSize: 15, fontWeight: "900" },
  disabled: { opacity: 0.6 }
  ,
  libraryGate: { alignItems: "center", backgroundColor: "rgba(255,199,51,0.08)", borderColor: "rgba(255,199,51,0.28)", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 9, padding: 13 },
  libraryGateText: { color: colors.textSecondary, flex: 1, fontSize: 12, lineHeight: 17 }
});
