import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { EmptySpacer, GlassCard, ScreenTitle } from "@/components/ScreenKit";
import { saveCustomWorkout } from "@/lib/api";
import { Exercise, exerciseCatalog, fetchRemoteExerciseCatalog } from "@/lib/exercises";
import { colors, radii } from "@/lib/theme";
import { useSubscription } from "@/context/SubscriptionContext";

export default function CustomWorkoutScreen() {
  const { isPremium } = useSubscription();
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Exercise[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<Exercise[]>(() => isPremium ? exerciseCatalog : exerciseCatalog.slice(0, 31));

  useEffect(() => {
    if (!isPremium) {
      setCatalog(exerciseCatalog.slice(0, 31));
      return;
    }
    let mounted = true;
    void fetchRemoteExerciseCatalog()
      .then((remoteExercises) => {
        if (!mounted) return;
        const existingNames = new Set(exerciseCatalog.map((item) => item.name.toLowerCase()));
        const additions = remoteExercises.filter((item) => !existingNames.has(item.name.toLowerCase()));
        setCatalog([...exerciseCatalog, ...additions]);
      })
      .catch(() => {
        if (mounted) setCatalog(exerciseCatalog);
      });
    return () => {
      mounted = false;
    };
  }, [isPremium]);

  const suggestions = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];
    return catalog
      .filter((item) =>
        !selected.some((selectedItem) => selectedItem.id === item.id) &&
        (item.name.toLowerCase().includes(clean) || item.muscleGroup.toLowerCase().includes(clean))
      )
      .slice(0, 8);
  }, [catalog, query, selected]);

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
      <ScreenTitle title="Custom Workout" subtitle="Build a reusable routine from the complete FITNEO exercise library." />
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
        {suggestions.length > 0 ? (
          <View style={styles.suggestions}>
            {suggestions.map((item) => (
              <TouchableOpacity key={item.id} style={styles.suggestion} onPress={() => addExercise(item)}>
                <View style={styles.exerciseIcon}><Ionicons name="barbell" size={16} color={colors.accent} /></View>
                <View style={styles.flex}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <Text style={styles.exerciseMeta}>{item.muscleGroup} · {item.difficulty}</Text>
                </View>
                <Ionicons name="add-circle" size={22} color={colors.accent} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

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
  card: { gap: 12, padding: 18 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
  input: { backgroundColor: "rgba(255,255,255,0.04)", borderColor: colors.cardStroke, borderRadius: radii.md, borderWidth: 1, color: colors.textPrimary, minHeight: 52, paddingHorizontal: 14 },
  searchWrap: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderColor: colors.cardStroke, borderRadius: radii.md, borderWidth: 1, flexDirection: "row", gap: 9, paddingHorizontal: 14 },
  searchInput: { color: colors.textPrimary, flex: 1, minHeight: 52 },
  suggestions: { backgroundColor: "#111827", borderColor: colors.cardStroke, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
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
