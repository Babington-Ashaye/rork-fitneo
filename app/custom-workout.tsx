import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AdaptiveBanner } from "@/components/AdaptiveBanner";
import { AppLayout } from "@/components/AppLayout";
import { EmptySpacer, GlassCard } from "@/components/ScreenKit";
import { useSubscription } from "@/context/SubscriptionContext";
import { saveCustomWorkout } from "@/lib/api";
import { Exercise, ExerciseEquipmentTier, getAccessibleExercises, getEquipmentTierLabel, getExercisesByEquipmentTier } from "@/lib/exercises";
import { colors, radii } from "@/lib/theme";

type EquipmentFilter = "all" | ExerciseEquipmentTier;

const equipmentFilters: Array<{ key: EquipmentFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "none", label: "0 Equip" },
  { key: "few", label: "Home" },
  { key: "full", label: "Gym" }
];

const builderHeroImage = "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=80";

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
  const totalSets = selected.reduce((sum, item) => sum + item.sets, 0);
  const estimatedMinutes = Math.max(0, selected.reduce((sum, item) => sum + item.sets * 2 + Math.ceil(item.restSeconds / 60), 0));

  const visibleExercises = useMemo(() => {
    const clean = query.trim().toLowerCase();
    const baseList = clean
      ? filteredCatalog.filter((item) =>
          item.name.toLowerCase().includes(clean) || item.muscleGroup.toLowerCase().includes(clean)
        )
      : filteredCatalog;

    return baseList.filter((item) => !selected.some((selectedItem) => selectedItem.id === item.id));
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
    <AppLayout scroll contentContainerStyle={styles.screen}>
      <ImageBackground source={{ uri: builderHeroImage }} resizeMode="cover" style={styles.heroImage} imageStyle={styles.heroImageInner}>
        <LinearGradient colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0.90)"]} style={styles.heroOverlay}>
          <View style={styles.heroTop}>
            <TouchableOpacity activeOpacity={0.78} style={styles.heroBack} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={13} color={colors.accent} />
              <Text style={styles.heroBadgeText}>AI BUILDER</Text>
            </View>
          </View>
          <Text style={styles.heroKicker}>CREATE YOUR OWN</Text>
          <Text style={styles.heroTitle}>Custom Workout</Text>
          <Text style={styles.heroCopy}>Build a routine that fits your goal, equipment, and training style.</Text>
          <View style={styles.heroStats}>
            <BuilderStat label="Exercises" value={String(selected.length)} />
            <BuilderStat label="Sets" value={String(totalSets)} />
            <BuilderStat label="Est. time" value={estimatedMinutes ? `${estimatedMinutes}m` : "--"} />
          </View>
        </LinearGradient>
      </ImageBackground>

      <AdaptiveBanner enabled={!isPremium} label="Sponsored workout gear" />

      {!isPremium ? (
        <TouchableOpacity style={styles.libraryGate} onPress={() => router.push("/paywall")}>
          <Ionicons name="lock-closed" size={16} color={colors.gold} />
          <Text style={styles.libraryGateText}>Your library includes the full exercise catalog with 0-equipment, home-gear, and gym labels.</Text>
        </TouchableOpacity>
      ) : null}

      <GlassCard radius={radii.xxl} style={styles.card}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionKicker}>PROGRAM DETAILS</Text>
            <Text style={styles.title}>Name & exercise library</Text>
          </View>
          <View style={styles.countChip}>
            <Text style={styles.countChipText}>{catalog.length} moves</Text>
          </View>
        </View>

        <TextInput
          placeholder="Workout name e.g. Explosive Home Push"
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
            {visibleExercises.slice(0, 36).map((item) => (
              <TouchableOpacity key={item.id} style={styles.suggestion} onPress={() => addExercise(item)}>
                <View style={styles.exerciseIcon}><Ionicons name="barbell" size={16} color={colors.accent} /></View>
                <View style={styles.flex}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <View style={styles.metaLine}>
                    <Text style={styles.exerciseMeta}>{item.muscleGroup} · {item.difficulty}</Text>
                    <Text style={[styles.equipmentPill, item.equipmentTier === "none" && styles.noEquipmentPill]}>
                      {getEquipmentTierLabel(item.equipmentTier)}
                    </Text>
                  </View>
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
      </GlassCard>

      <GlassCard radius={radii.xxl} style={styles.card}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionKicker}>YOUR ROUTINE</Text>
            <Text style={styles.title}>{selected.length ? `${selected.length} exercises selected` : "No exercises yet"}</Text>
          </View>
          <Ionicons name="list" size={20} color={colors.accent} />
        </View>

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
          <View style={styles.emptyRoutine}>
            <Ionicons name="add-circle-outline" size={28} color={colors.textTertiary} />
            <Text style={styles.empty}>Search above and tap exercises to build your workout.</Text>
          </View>
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

function BuilderStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.builderStat}>
      <Text style={styles.builderStatValue}>{value}</Text>
      <Text style={styles.builderStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 16 },
  heroImage: { borderRadius: 28, minHeight: 330, overflow: "hidden" },
  heroImageInner: { borderRadius: 28 },
  heroOverlay: { flex: 1, justifyContent: "flex-end", padding: 18 },
  heroTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", left: 16, position: "absolute", right: 16, top: 16 },
  heroBack: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.42)", borderColor: "rgba(255,255,255,0.14)", borderRadius: 20, borderWidth: 1, height: 42, justifyContent: "center", width: 42 },
  heroBadge: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.48)", borderColor: "rgba(10,132,255,0.38)", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 6, paddingHorizontal: 11, paddingVertical: 7 },
  heroBadgeText: { color: colors.textPrimary, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  heroKicker: { color: colors.accent, fontSize: 12, fontWeight: "900", letterSpacing: 1.5 },
  heroTitle: { color: colors.textPrimary, fontSize: 40, fontWeight: "900", letterSpacing: -1.5, marginTop: 4 },
  heroCopy: { color: colors.textSecondary, fontSize: 14, fontWeight: "700", lineHeight: 21, maxWidth: 330, marginTop: 8 },
  heroStats: { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.12)", borderRadius: 18, borderWidth: 1, flexDirection: "row", marginTop: 18, paddingVertical: 12 },
  builderStat: { alignItems: "center", flex: 1 },
  builderStatValue: { color: colors.textPrimary, fontSize: 18, fontWeight: "900" },
  builderStatLabel: { color: colors.textTertiary, fontSize: 10, fontWeight: "800", marginTop: 2 },
  card: { gap: 12, padding: 18 },
  sectionHeading: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: 10 },
  sectionKicker: { color: colors.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
  countChip: { backgroundColor: "rgba(255,255,255,0.07)", borderColor: colors.cardStroke, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  countChipText: { color: colors.textSecondary, fontSize: 10, fontWeight: "900" },
  input: { backgroundColor: "rgba(255,255,255,0.04)", borderColor: colors.cardStroke, borderRadius: radii.md, borderWidth: 1, color: colors.textPrimary, minHeight: 52, paddingHorizontal: 14 },
  searchWrap: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderColor: colors.cardStroke, borderRadius: radii.md, borderWidth: 1, flexDirection: "row", gap: 9, paddingHorizontal: 14 },
  searchInput: { color: colors.textPrimary, flex: 1, minHeight: 52 },
  filterBar: { backgroundColor: "rgba(255,255,255,0.035)", borderColor: colors.cardStroke, borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 6, padding: 5 },
  filterTab: { alignItems: "center", borderColor: "transparent", borderRadius: 12, borderWidth: 1, flex: 1, justifyContent: "center", minHeight: 44 },
  filterTabActive: { backgroundColor: "rgba(0,163,255,0.16)", borderColor: "rgba(0,163,255,0.68)", shadowColor: colors.accent, shadowOpacity: 0.35, shadowRadius: 12 },
  filterText: { color: colors.textSecondary, fontSize: 12, fontWeight: "900" },
  filterTextActive: { color: colors.textPrimary },
  filterCount: { color: colors.textTertiary, fontSize: 10, fontWeight: "800", marginTop: 2 },
  suggestions: { backgroundColor: "#111827", borderColor: colors.cardStroke, borderRadius: 14, borderWidth: 1, maxHeight: 430, minHeight: 60, overflow: "hidden" },
  suggestionsEmpty: { backgroundColor: "#111827", borderColor: colors.cardStroke, borderRadius: 14, borderWidth: 1, justifyContent: "center", minHeight: 60 },
  suggestion: { alignItems: "center", borderBottomColor: "rgba(255,255,255,0.06)", borderBottomWidth: 1, flexDirection: "row", gap: 10, minHeight: 60, padding: 10 },
  exerciseIcon: { alignItems: "center", backgroundColor: "rgba(10,132,255,0.12)", borderRadius: 10, height: 36, justifyContent: "center", width: 36 },
  flex: { flex: 1 },
  exerciseName: { color: colors.textPrimary, fontSize: 14, fontWeight: "800" },
  exerciseMeta: { color: colors.textTertiary, fontSize: 10, marginTop: 3 },
  metaLine: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 2 },
  equipmentPill: { backgroundColor: "rgba(255,199,51,0.12)", borderColor: "rgba(255,199,51,0.25)", borderRadius: 999, borderWidth: 1, color: colors.gold, fontSize: 8, fontWeight: "900", paddingHorizontal: 7, paddingVertical: 2, textTransform: "uppercase" },
  noEquipmentPill: { backgroundColor: "rgba(0,217,178,0.12)", borderColor: "rgba(0,217,178,0.28)", color: colors.teal },
  selectedList: { maxHeight: 300 },
  selectedRow: { alignItems: "center", borderBottomColor: "rgba(255,255,255,0.07)", borderBottomWidth: 1, flexDirection: "row", gap: 10, minHeight: 62 },
  order: { color: colors.accent, fontSize: 13, fontWeight: "900", width: 20 },
  empty: { color: colors.textTertiary, fontSize: 12, paddingVertical: 14, textAlign: "center" },
  emptyRoutine: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.035)", borderColor: colors.cardStroke, borderRadius: 16, borderWidth: 1, gap: 4, padding: 20 },
  status: { color: colors.teal, fontSize: 12, lineHeight: 18, textAlign: "center" },
  saveButton: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 14, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 54 },
  saveText: { color: colors.textPrimary, fontSize: 15, fontWeight: "900" },
  disabled: { opacity: 0.6 },
  libraryGate: { alignItems: "center", backgroundColor: "rgba(255,199,51,0.08)", borderColor: "rgba(255,199,51,0.28)", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 9, padding: 13 },
  libraryGateText: { color: colors.textSecondary, flex: 1, fontSize: 12, lineHeight: 17 }
});
