import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AdaptiveBanner } from "@/components/AdaptiveBanner";
import { AppLayout } from "@/components/AppLayout";
import { EmptySpacer, MetaItem } from "@/components/ScreenKit";
import { useSubscription } from "@/context/SubscriptionContext";
import {
  getCleanEquipmentTierLabel,
  getEquipmentTierBadgeColor,
  getWorkoutProgramCatalogCategory,
  getWorkoutProgramExercises,
  getWorkoutTrainingFrequency,
  workoutPrograms
} from "@/lib/exercises";
import type { ExerciseEquipmentTier, WorkoutProgram } from "@/lib/exercises";
import { colors, radii, spacing, typography } from "@/lib/theme";

type TrainingMode = "home" | "gym" | "walk";

const modes: Array<{ key: TrainingMode | "sports"; label: string }> = [
  { key: "home", label: "At Home" },
  { key: "gym", label: "Gym" },
  { key: "walk", label: "Walk & Run" },
  { key: "sports", label: "Sports" }
];

const categories = ["Full Body", "Core", "Chest", "Arm", "Legs", "Mobility", "Cardio"];
const walkCategories = ["Walking", "Running", "Mobility", "Endurance", "Beginner"];
const difficultyDots: Record<WorkoutProgram["difficulty"], number> = { Beginner: 1, Intermediate: 2, Advanced: 3 };

const programImages: Record<string, string> = {
  hero: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85",
  strength: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=85",
  conditioning: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=85",
  mobility: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=85",
  core: "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&w=1200&q=85",
  gym: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=85",
  homeNoEquipment: "https://images.unsplash.com/photo-1598971639058-a7441f840ec0?auto=format&fit=crop&w=1200&q=85",
  homeGear: "https://images.unsplash.com/photo-1605296867424-35fc25c9212a?auto=format&fit=crop&w=1200&q=85",
  walking: "https://images.unsplash.com/photo-1501554728187-ce583db33af7?auto=format&fit=crop&w=1200&q=85",
  run: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=85",
  runEndurance: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=85",
  runMobility: "https://images.unsplash.com/photo-1518459031867-a89b944bffe4?auto=format&fit=crop&w=1200&q=85",
  custom: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=85"
};

const programImageById: Record<string, string> = {
  "full-body-beginner-home": "https://images.unsplash.com/photo-1598971639058-a7441f840ec0?auto=format&fit=crop&w=1200&q=85",
  "full-body-beginner-gym": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=85",
  "upper-lower-split-home": "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=85",
  "upper-lower-split-gym": "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?auto=format&fit=crop&w=1200&q=85",
  "push-pull-legs-home": "https://images.unsplash.com/photo-1598971639058-a7441f840ec0?auto=format&fit=crop&w=1200&q=85",
  "push-pull-legs-gym": "https://images.unsplash.com/photo-1571019613914-85f342c1d70c?auto=format&fit=crop&w=1200&q=85",
  "hiit-burn-home": "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=85",
  "core-control-home": "https://images.unsplash.com/photo-1518459031867-a89b944bffe4?auto=format&fit=crop&w=1200&q=85",
  "core-control-gym": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=85",
  "home-no-equipment": "https://images.unsplash.com/photo-1616279969856-759f316a5ac1?auto=format&fit=crop&w=1200&q=85",
  "mobility-reset": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=85",
  "athletic-conditioning-home": "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1200&q=85",
  "athletic-conditioning-gym": "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=1200&q=85",
  "leg-power-home": "https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=1200&q=85",
  "leg-power-gym": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=85",
  "upper-body-pump-home": "https://images.unsplash.com/photo-1598971639058-a7441f840ec0?auto=format&fit=crop&w=1200&q=85",
  "upper-body-pump-gym": "https://images.unsplash.com/photo-1532384748853-8f54a8f476e2?auto=format&fit=crop&w=1200&q=85",
  "fat-loss-circuit": "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?auto=format&fit=crop&w=1200&q=85",
  "recovery-flow": "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?auto=format&fit=crop&w=1200&q=85",
  "walk-run-foundation": "https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&w=1200&q=85",
  "walking-weight-loss": "https://images.unsplash.com/photo-1501554728187-ce583db33af7?auto=format&fit=crop&w=1200&q=85",
  "easy-jog-builder": "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=85",
  "runner-mobility-reset": "https://images.unsplash.com/photo-1518459031867-a89b944bffe4?auto=format&fit=crop&w=1200&q=85",
  "5k-conditioning": "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=85"
};

export default function WorkoutsScreen() {
  const { isPremium } = useSubscription();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<TrainingMode>("home");
  const [category, setCategory] = useState("Full Body");
  const activeCategories = mode === "walk" ? walkCategories : categories;
  const selectedCategory = activeCategories.includes(category) ? category : activeCategories[0];

  const modePrograms = useMemo(() => workoutPrograms.filter((program) => matchesMode(program, mode)), [mode]);
  const visiblePrograms = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return modePrograms.filter((program) => {
      const matchesCategory = matchesProgramCategory(program, selectedCategory);
      const matchesQuery =
        !cleanQuery ||
        program.name.toLowerCase().includes(cleanQuery) ||
        program.category.toLowerCase().includes(cleanQuery) ||
        program.description.toLowerCase().includes(cleanQuery);
      return matchesCategory && matchesQuery;
    });
  }, [modePrograms, query, selectedCategory]);

  const featuredPrograms = useMemo(() => {
    const preferred = modePrograms.filter((program) => (
      program.name.toLowerCase().includes("full body") ||
      program.name.toLowerCase().includes("upper") ||
      program.name.toLowerCase().includes("fat") ||
      program.category.toLowerCase().includes("conditioning")
    ));
    return (preferred.length ? preferred : modePrograms).slice(0, 4);
  }, [modePrograms]);

  const quickPrograms = visiblePrograms.slice(0, 5);
  const freshPrograms = modePrograms
    .filter((program) => !quickPrograms.some((quick) => quick.id === program.id))
    .slice(0, 4);

  return (
    <AppLayout scroll contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>FITNEO TRAINING</Text>
          <Text style={styles.screenTitle}>Workouts</Text>
        </View>
        <TouchableOpacity activeOpacity={0.78} style={styles.historyButton} onPress={() => router.push("/active-workout")}>
          <Ionicons name="time-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeTabs}>
        {modes.map((item) => {
          const active = item.key === mode;
          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.78}
              style={styles.modeTab}
              onPress={() => {
                if (item.key === "sports") {
                  router.push("/sports-mode");
                  return;
                }
                setMode(item.key);
                setCategory(item.key === "walk" ? "Walking" : "Full Body");
              }}
            >
              <Text style={[styles.modeText, active && styles.modeTextActive]}>{item.label}</Text>
              {active ? <View style={styles.modeUnderline} /> : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          placeholder="Search workouts, plans..."
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          underlineColorAndroid="transparent"
        />
      </View>

      <AdaptiveBanner enabled={!isPremium} label="Sponsored training plan" />

      {featuredPrograms.length > 0 ? (
        <EditorialRow title={mode === "walk" ? "Training plans" : mode === "gym" ? "Gym Programs" : "Classic Plan"} action="See All">
          {featuredPrograms.map((program) => (
            <FeaturedPlanCard key={program.id} program={program} mode={mode} />
          ))}
        </EditorialRow>
      ) : null}

      <View style={styles.categorySection}>
        <Text style={styles.sectionKicker}>QUICK START</Text>
        <Text style={styles.sectionTitle}>{mode === "walk" ? "Walk & Run Workouts" : "Classic Workouts"}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChips}>
          {activeCategories.map((item) => {
            const active = selectedCategory === item;
            return (
              <TouchableOpacity key={item} activeOpacity={0.78} style={[styles.categoryChip, active && styles.categoryChipActive]} onPress={() => setCategory(item)}>
                <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.quickList}>
        {quickPrograms.map((program) => <QuickWorkoutRow key={program.id} program={program} />)}
        {quickPrograms.length === 0 ? <Text style={styles.emptyText}>No programs match that search yet.</Text> : null}
      </View>

      {freshPrograms.length > 0 ? (
        <View style={styles.freshSection}>
          <Text style={styles.sectionKicker}>FRESH CHOICES · {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase()}</Text>
          <Text style={styles.sectionTitle}>Picks for Today</Text>
          <View style={styles.freshCard}>
            {freshPrograms.map((program) => <FreshPickRow key={program.id} program={program} />)}
          </View>
        </View>
      ) : null}

      <View style={styles.aiSection}>
        <Text style={styles.sectionKicker}>CREATE YOUR OWN</Text>
        <Text style={styles.sectionTitle}>AI Workout</Text>
        <View style={styles.creatorGrid}>
          <CreatorTile
            title="Daily AI Workout"
            subtitle="Fresh plan tuned to today"
            icon="sparkles"
            image={programImages.run}
            onPress={() => router.push("/(tabs)/coach")}
          />
          <CreatorTile
            title="Custom by AI Creator"
            subtitle="Pick focus, gear, duration"
            icon="grid"
            image={programImages.custom}
            onPress={() => router.push("/custom-workout")}
          />
        </View>
      </View>

      <EmptySpacer />
    </AppLayout>
  );
}

function matchesMode(program: WorkoutProgram, mode: TrainingMode) {
  const category = program.category.toLowerCase();
  const isWalkRunProgram = category.includes("walk");
  const isSportsProgram = category.includes("sports");
  if (mode === "home") return program.equipmentTier !== "full" && !isWalkRunProgram && !isSportsProgram;
  if (mode === "gym") return program.equipmentTier !== "none" && !isWalkRunProgram && !isSportsProgram;
  return category.includes("walk");
}

function matchesProgramCategory(program: WorkoutProgram, selectedCategory: string) {
  if (selectedCategory === "Beginner") return program.difficulty === "Beginner";
  return getWorkoutProgramCatalogCategory(program) === selectedCategory;
}

function getProgramImage(program: WorkoutProgram, mode?: TrainingMode) {
  const category = program.category.toLowerCase();
  const catalogCategory = getWorkoutProgramCatalogCategory(program);
  if (programImageById[program.id]) return programImageById[program.id];
  if (catalogCategory === "Walking") return programImages.walking;
  if (catalogCategory === "Running") return programImages.run;
  if (catalogCategory === "Endurance") return programImages.runEndurance;
  if (mode === "walk" || category.includes("walk")) return programImages.runMobility;
  if (mode === "gym" || program.equipmentTier === "full") return programImages.gym;
  if (program.equipmentTier === "few") return programImages.homeGear;
  if (program.equipmentTier === "none") return programImages.homeNoEquipment;
  if (category.includes("conditioning")) return programImages.conditioning;
  if (category.includes("mobility")) return programImages.mobility;
  if (category.includes("core")) return programImages.core;
  return programImages.strength;
}

function getProgramTint(program: WorkoutProgram) {
  const category = program.category.toLowerCase();
  if (category.includes("conditioning") || category.includes("cardio")) return colors.coral;
  if (category.includes("mobility") || category.includes("recovery")) return colors.teal;
  if (category.includes("nutrition")) return colors.success;
  return colors.accent;
}

function getModeCopy(mode: TrainingMode) {
  if (mode === "gym") return "Progressive gym plans with strength-focused programming.";
  if (mode === "walk") return "Conditioning blocks for running, walking, and fat-loss stamina.";
  return "Bodyweight and home-gear plans you can start anywhere.";
}

function EditorialRow({ action, children, title }: { action: string; children: React.ReactNode; title: string }) {
  return (
    <View style={styles.editorialRow}>
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.seeAll}>{action}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRail}>
        {children}
      </ScrollView>
    </View>
  );
}

function FeaturedPlanCard({ mode, program }: { mode: TrainingMode; program: WorkoutProgram }) {
  const tint = getProgramTint(program);
  const badgeColor = getEquipmentTierBadgeColor(program.equipmentTier);
  const exercises = getWorkoutProgramExercises(program.id);

  return (
    <TouchableOpacity
      activeOpacity={0.84}
      style={styles.featuredCard}
      onPress={() => router.push({ pathname: "/workout-preview", params: { programId: program.id, programName: program.name } })}
    >
      <ImageBackground source={{ uri: getProgramImage(program, mode) }} resizeMode="cover" style={StyleSheet.absoluteFillObject} imageStyle={styles.featuredImage}>
        <LinearGradient colors={[`${tint}BB`, "rgba(0,0,0,0.36)", "rgba(0,0,0,0.88)"]} style={StyleSheet.absoluteFillObject} />
      </ImageBackground>
      <Text style={styles.featuredDays}>{program.durationMinutes <= 20 ? "Quick Start" : "28 Days"}</Text>
      <Text style={styles.featuredTitle}>{program.name.toUpperCase()}</Text>
      <Text style={styles.featuredCopy} numberOfLines={2}>{program.description}</Text>
      <Text style={[styles.featuredBadge, { color: badgeColor }]}>{getCleanEquipmentTierLabel(program.equipmentTier)}</Text>
      <View style={styles.featuredButton}>
        <Text style={[styles.featuredButtonText, { color: tint }]}>Start</Text>
        <View style={[styles.featuredArrow, { backgroundColor: tint }]}>
          <Ionicons name="arrow-forward" size={18} color={colors.textPrimary} />
        </View>
      </View>
      <View style={styles.featuredMeta}>
        <MetaItem icon="time" text={`${program.durationMinutes}m`} />
        <MetaItem icon="layers" text={`${exercises.length || program.exerciseIds.length} ex`} />
      </View>
    </TouchableOpacity>
  );
}

function QuickWorkoutRow({ program }: { program: WorkoutProgram }) {
  const tint = getProgramTint(program);
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={styles.quickRow}
      onPress={() => router.push({ pathname: "/workout-preview", params: { programId: program.id, programName: program.name } })}
    >
      <ImageBackground source={{ uri: getProgramImage(program) }} resizeMode="cover" style={styles.quickThumb} imageStyle={styles.quickThumbImage}>
        <LinearGradient colors={["rgba(0,0,0,0.06)", "rgba(0,0,0,0.35)"]} style={StyleSheet.absoluteFillObject} />
      </ImageBackground>
      <View style={styles.quickBody}>
        <Text style={styles.quickTitle}>{program.name} · {program.difficulty}</Text>
        <Text style={styles.quickMeta}>{program.durationMinutes} mins · {program.category}</Text>
      </View>
      <View style={[styles.quickArrow, { backgroundColor: `${tint}22` }]}>
        <Ionicons name="arrow-forward" size={15} color={tint} />
      </View>
    </TouchableOpacity>
  );
}

function FreshPickRow({ program }: { program: WorkoutProgram }) {
  const tint = getProgramTint(program);
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={styles.freshRow}
      onPress={() => router.push({ pathname: "/workout-preview", params: { programId: program.id, programName: program.name } })}
    >
      <ImageBackground source={{ uri: getProgramImage(program) }} resizeMode="cover" style={styles.freshThumb} imageStyle={styles.freshThumbImage} />
      <View style={styles.freshCopy}>
        <Text style={styles.freshTitle}>{program.name}</Text>
        <Text style={styles.freshMeta}><Text style={{ color: tint }}>{program.durationMinutes} mins</Text> | {program.difficulty}</Text>
      </View>
    </TouchableOpacity>
  );
}

function CreatorTile({
  icon,
  image,
  onPress,
  subtitle,
  title
}: {
  icon: keyof typeof Ionicons.glyphMap;
  image: string;
  onPress: () => void;
  subtitle: string;
  title: string;
}) {
  return (
    <TouchableOpacity activeOpacity={0.84} style={styles.creatorTile} onPress={onPress}>
      <ImageBackground source={{ uri: image }} resizeMode="cover" style={StyleSheet.absoluteFillObject} imageStyle={styles.creatorImage}>
        <LinearGradient colors={["rgba(0,217,178,0.75)", "rgba(7,91,255,0.62)", "rgba(0,0,0,0.70)"]} style={StyleSheet.absoluteFillObject} />
      </ImageBackground>
      <Ionicons name={icon} size={24} color={colors.textPrimary} style={styles.creatorIcon} />
      <Text style={styles.creatorTitle}>{title}</Text>
      <Text style={styles.creatorSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.sm
  },
  kicker: {
    color: colors.accent,
    fontSize: typography.label.size,
    fontWeight: typography.label.weight,
    letterSpacing: typography.label.letterSpacing
  },
  screenTitle: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.1,
    marginTop: spacing.xs
  },
  historyButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.cardStroke,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  modeTabs: {
    alignItems: "center",
    gap: spacing.xl,
    paddingRight: spacing.screen
  },
  modeTab: {
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.xs,
    paddingTop: spacing.sm
  },
  modeText: {
    color: colors.textTertiary,
    fontSize: 22,
    fontWeight: "800"
  },
  modeTextActive: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "900"
  },
  modeUnderline: {
    backgroundColor: colors.textPrimary,
    borderRadius: radii.pill,
    height: 4,
    width: 54
  },
  search: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg
  },
  searchInput: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 16,
    fontWeight: "700"
  },
  editorialRow: {
    gap: spacing.md
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sectionKicker: {
    color: colors.accent,
    fontSize: typography.label.size,
    fontWeight: typography.label.weight,
    letterSpacing: typography.label.letterSpacing
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.55
  },
  seeAll: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: "800"
  },
  featuredRail: {
    gap: spacing.md,
    paddingRight: spacing.screen
  },
  featuredCard: {
    borderRadius: 28,
    height: 360,
    justifyContent: "flex-end",
    overflow: "hidden",
    padding: spacing.xl,
    width: 318
  },
  featuredImage: {
    borderRadius: 28
  },
  featuredDays: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: spacing.lg
  },
  featuredTitle: {
    color: colors.textPrimary,
    fontSize: 33,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 36,
    maxWidth: 240
  },
  featuredCopy: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: spacing.xl
  },
  featuredBadge: {
    backgroundColor: "rgba(0,0,0,0.44)",
    borderRadius: radii.pill,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: spacing.sm,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
    textTransform: "uppercase"
  },
  featuredButton: {
    alignItems: "center",
    backgroundColor: colors.textPrimary,
    borderRadius: radii.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xl,
    minHeight: 54,
    paddingHorizontal: spacing.lg
  },
  featuredButtonText: {
    fontSize: 18,
    fontWeight: "900"
  },
  featuredArrow: {
    alignItems: "center",
    borderRadius: radii.pill,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  featuredMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.md
  },
  categorySection: {
    gap: spacing.sm
  },
  categoryChips: {
    gap: spacing.md,
    paddingRight: spacing.screen,
    paddingTop: spacing.sm
  },
  categoryChip: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  categoryChipActive: {
    backgroundColor: colors.appBlue
  },
  categoryChipText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "900"
  },
  categoryChipTextActive: {
    color: colors.textPrimary
  },
  quickList: {
    gap: spacing.sm
  },
  quickRow: {
    alignItems: "center",
    borderBottomColor: colors.cardStroke,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 86,
    paddingVertical: spacing.sm
  },
  quickThumb: {
    borderRadius: radii.md,
    height: 70,
    overflow: "hidden",
    width: 70
  },
  quickThumbImage: {
    borderRadius: radii.md
  },
  quickBody: {
    flex: 1,
    gap: spacing.xs
  },
  quickTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "900"
  },
  quickMeta: {
    color: colors.textTertiary,
    fontSize: 15,
    fontWeight: "700"
  },
  quickArrow: {
    alignItems: "center",
    borderRadius: radii.pill,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  freshSection: {
    gap: spacing.sm
  },
  freshCard: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 26,
    gap: spacing.md,
    padding: spacing.lg
  },
  freshRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  freshThumb: {
    borderRadius: radii.md,
    height: 82,
    overflow: "hidden",
    width: 104
  },
  freshThumbImage: {
    borderRadius: radii.md
  },
  freshCopy: {
    flex: 1,
    gap: spacing.xs
  },
  freshTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 21
  },
  freshMeta: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: "700"
  },
  aiSection: {
    gap: spacing.md
  },
  creatorGrid: {
    flexDirection: "row",
    gap: spacing.md
  },
  creatorTile: {
    borderRadius: 24,
    flex: 1,
    height: 150,
    justifyContent: "flex-end",
    overflow: "hidden",
    padding: spacing.lg
  },
  creatorImage: {
    borderRadius: 24
  },
  creatorIcon: {
    position: "absolute",
    right: spacing.lg,
    top: spacing.lg
  },
  creatorTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 20
  },
  creatorSubtitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
    marginTop: spacing.xs
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: spacing.xxl,
    textAlign: "center"
  }
});
