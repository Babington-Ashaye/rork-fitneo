import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { getEquipmentTierLabel, workoutPrograms } from "@/lib/exercises";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

const SPORT_ONBOARDING_KEY = "fitneo.sports.onboarding.v2";
const TOTAL_STEPS = 4;

const sports = [
  { name: "Football (Soccer)", label: "Football", emoji: "⚽", programId: "sport-football", tint: "#22C55E" },
  { name: "Basketball", label: "Basketball", emoji: "🏀", programId: "sport-basketball", tint: "#F59E0B" },
  { name: "Tennis", label: "Tennis", emoji: "🎾", programId: "sport-tennis", tint: "#84CC16" },
  { name: "Swimming", label: "Swimming", emoji: "🏊", programId: "sport-swimming", tint: "#06B6D4" },
  { name: "Running", label: "Running", emoji: "🏃", programId: "sport-running", tint: "#3B82F6" },
  { name: "Rugby", label: "Rugby", emoji: "🏉", programId: "sport-rugby", tint: "#F43F5E" },
  { name: "Boxing", label: "Boxing", emoji: "🥊", programId: "sport-boxing", tint: "#F97316" },
  { name: "Cricket", label: "Cricket", emoji: "🏏", programId: "sport-cricket", tint: "#38BDF8" },
  { name: "Volleyball", label: "Volleyball", emoji: "🏐", programId: "sport-volleyball", tint: "#FB7185" },
  { name: "Other", label: "Other", emoji: "🎯", programId: "sport-football", tint: colors.accent }
];

const levels = [
  { title: "Recreational", description: "I play for fun and fitness" },
  { title: "Amateur", description: "I train regularly and compete locally" },
  { title: "Semi-Professional", description: "I train seriously and compete at high level" },
  { title: "Professional", description: "This is my career" }
];

const frequencies = [
  { title: "1-2x per week", description: "Light schedule" },
  { title: "3-4x per week", description: "Moderate schedule" },
  { title: "5x per week", description: "High commitment" },
  { title: "Daily", description: "Elite training load" }
];

const calibrationSteps = [
  "Analyzing sport demands",
  "Evaluating position needs",
  "Building sport-specific drills",
  "Calibrating intensity",
  "Finalizing your sports plan"
];

const positions: Record<string, string[]> = {
  "Football (Soccer)": ["Goalkeeper", "Centre Back", "Full Back", "Defensive Midfielder", "Central Midfielder", "Attacking Midfielder", "Left Winger", "Right Winger", "Striker"],
  Basketball: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
  Rugby: ["Prop", "Hooker", "Lock", "Flanker", "Number 8", "Scrum Half", "Fly Half", "Centre", "Wing", "Fullback"],
  Volleyball: ["Setter", "Outside Hitter", "Opposite Hitter", "Middle Blocker", "Libero"],
  Boxing: ["Orthodox", "Southpaw", "Switch"],
  Tennis: ["Right Hand", "Left Hand", "Ambidextrous"],
  Swimming: ["Right Hand", "Left Hand", "Ambidextrous"],
  Running: ["Right Hand", "Left Hand", "Ambidextrous"],
  Cricket: ["Right Hand", "Left Hand", "Ambidextrous"]
};

type SportAnswers = {
  sport: string;
  sport_level: string;
  sport_frequency: string;
  sport_position: string;
};

type SportStats = {
  workouts: number;
  xp: number;
  streak: number;
};

type ScreenMode = "onboarding" | "completion" | "dashboard";

function getSportProgramId(sportName: string) {
  return sports.find((sport) => sport.name === sportName)?.programId ?? "sport-football";
}

function getSportMeta(sportName: string) {
  return sports.find((sport) => sport.name === sportName) ?? sports[0];
}

function needsDominantHand(sportName: string) {
  return ["Tennis", "Swimming", "Running", "Cricket"].includes(sportName);
}

function getPositionQuestion(sportName: string) {
  if (needsDominantHand(sportName)) return "What is your dominant hand?";
  if (sportName === "Other") return "Tell us your sport";
  return "What position do you play?";
}

export default function SportsModeScreen() {
  const { profile, refreshProfile, user } = useAuth();
  const savedAnswers = profile?.onboarding_answers ?? {};
  const savedSport = typeof savedAnswers.sport === "string" ? savedAnswers.sport : "";
  const [selected, setSelected] = useState(savedSport || "Football (Soccer)");
  const [level, setLevel] = useState(typeof savedAnswers.sport_level === "string" ? savedAnswers.sport_level : "Recreational");
  const [frequency, setFrequency] = useState(typeof savedAnswers.sport_frequency === "string" ? savedAnswers.sport_frequency : "3-4x per week");
  const [position, setPosition] = useState(typeof savedAnswers.sport_position === "string" ? savedAnswers.sport_position : "");
  const [customSport, setCustomSport] = useState(savedSport === "Other" && typeof savedAnswers.sport_position === "string" ? savedAnswers.sport_position : "");
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<ScreenMode>(savedSport ? "dashboard" : "onboarding");
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationIndex, setCalibrationIndex] = useState(0);
  const [stats, setStats] = useState<SportStats>({ workouts: 0, xp: 0, streak: 0 });
  const slideAnim = useRef(new Animated.Value(0)).current;

  const selectedSport = getSportMeta(selected);
  const programId = getSportProgramId(selected);
  const program = workoutPrograms.find((item) => item.id === programId) ?? workoutPrograms.find((item) => item.id === "home-no-equipment") ?? workoutPrograms[0];
  const positionOptions = positions[selected] ?? [];
  const finalPosition = useMemo(() => {
    if (selected === "Other") return customSport.trim() || "Custom sport";
    return position || positionOptions[0] || "General athlete";
  }, [customSport, position, positionOptions, selected]);
  const isContinueEnabled = step !== 3 || selected !== "Other" || customSport.trim().length > 1;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(slideAnim, { duration: 0, toValue: 18, useNativeDriver: true }),
      Animated.timing(slideAnim, { duration: 220, toValue: 0, useNativeDriver: true })
    ]).start();
  }, [slideAnim, step]);

  useEffect(() => {
    if (savedSport) return;
    void AsyncStorage.getItem(SPORT_ONBOARDING_KEY).then((raw) => {
      if (!raw) return;
      try {
        const local = JSON.parse(raw) as Partial<SportAnswers>;
        if (typeof local.sport === "string") {
          setSelected(local.sport);
          setLevel(local.sport_level ?? "Recreational");
          setFrequency(local.sport_frequency ?? "3-4x per week");
          setPosition(local.sport_position ?? "");
          setMode("dashboard");
        }
      } catch {
        // Ignore old or malformed local sports onboarding data.
      }
    });
  }, [savedSport]);

  useEffect(() => {
    if (!isCalibrating) return;
    setCalibrationIndex(0);
    const timer = setInterval(() => {
      setCalibrationIndex((current) => {
        if (current >= calibrationSteps.length - 1) {
          clearInterval(timer);
          setTimeout(() => {
            setIsCalibrating(false);
            setMode("completion");
          }, 500);
          return current;
        }
        return current + 1;
      });
    }, 520);
    return () => clearInterval(timer);
  }, [isCalibrating]);

  useEffect(() => {
    if (mode !== "dashboard") return;
    void loadSportStats();
  }, [mode, selected, user?.id]);

  async function loadSportStats() {
    if (!isSupabaseConfigured || !user?.id) {
      setStats({ workouts: 0, xp: 0, streak: 0 });
      return;
    }
    try {
      const [workoutRes, profileRes] = await Promise.all([
        supabase
          .from("workout_sessions")
          .select("session_name,xp_earned")
          .eq("user_id", user.id)
          .ilike("session_name", `%${programId}%`),
        supabase
          .from("user_profiles")
          .select("current_streak,total_xp")
          .eq("id", user.id)
          .maybeSingle()
      ]);
      const workoutRows = (workoutRes.data ?? []) as Array<{ xp_earned?: number | null }>;
      setStats({
        workouts: workoutRows.length,
        xp: workoutRows.reduce((sum, row) => sum + Number(row.xp_earned ?? 0), 0),
        streak: Number((profileRes.data as { current_streak?: number | null } | null)?.current_streak ?? 0)
      });
    } catch {
      setStats({ workouts: 0, xp: 0, streak: 0 });
    }
  }

  async function saveAnswersAndCalibrate() {
    const answers: SportAnswers = {
      sport: selected,
      sport_level: level,
      sport_frequency: frequency,
      sport_position: finalPosition
    };
    await AsyncStorage.setItem(SPORT_ONBOARDING_KEY, JSON.stringify(answers));
    if (isSupabaseConfigured && user?.id) {
      const mergedAnswers = { ...(profile?.onboarding_answers ?? {}), ...answers };
      const { error } = await supabase
        .from("user_profiles")
        .update({ onboarding_answers: mergedAnswers })
        .eq("id", user.id);
      if (!error) {
        void refreshProfile();
      }
    }
    setIsCalibrating(true);
  }

  function advance() {
    if (!isContinueEnabled) return;
    if (step === 0) {
      setPosition("");
      setCustomSport("");
    }
    if (step < TOTAL_STEPS - 1) {
      setStep((current) => current + 1);
      return;
    }
    void saveAnswersAndCalibrate();
  }

  function startWorkout() {
    router.push({
      pathname: "/active-workout",
      params: {
        mode: selected,
        programId,
        programName: `${selectedSport.label} Athletic Session`
      }
    });
  }

  if (isCalibrating) {
    return (
      <AppLayout contentContainerStyle={styles.calibrationScreen}>
        <Text style={styles.calibrationEmoji}>{selectedSport.emoji}</Text>
        <Text style={styles.aiTitle}>FITNEO AI</Text>
        <Text style={styles.aiSubtitle}>Sports Mode</Text>
        <View style={styles.calibrationCard}>
          {calibrationSteps.map((item, index) => {
            const active = index <= calibrationIndex;
            return (
              <View key={item} style={styles.calibrationRow}>
                <View style={[styles.stepDot, active && styles.stepDotActive]}>
                  {active ? <Ionicons name="checkmark" size={10} color="#FFFFFF" /> : null}
                </View>
                <Text style={[styles.stepText, active && styles.stepTextActive]}>{item}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((calibrationIndex + 1) / calibrationSteps.length) * 100}%` }]} />
        </View>
      </AppLayout>
    );
  }

  if (mode === "completion") {
    return (
      <AppLayout contentContainerStyle={styles.completionScreen}>
        <Text style={styles.completionEmoji}>{selectedSport.emoji}</Text>
        <Text style={styles.completionTitle}>You're all set</Text>
        <Text style={styles.completionSubtitle}>{level} {selectedSport.label} Player</Text>
        <View style={styles.answerSummaryGrid}>
          <SummaryTile label="Sport" value={selectedSport.label} />
          <SummaryTile label="Level" value={level} />
          <SummaryTile label={needsDominantHand(selected) ? "Hand" : "Position"} value={finalPosition} />
        </View>
        <TouchableOpacity activeOpacity={0.86} style={styles.primaryButton} onPress={() => setMode("dashboard")}>
          <Text style={styles.primaryButtonText}>Start Training</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </AppLayout>
    );
  }

  if (mode === "dashboard") {
    return (
      <AppLayout scroll contentContainerStyle={styles.dashboardScreen}>
        <View style={styles.dashboardHeader}>
          <View>
            <Text style={styles.dashboardKicker}>{selectedSport.emoji} {selectedSport.label} · {level}</Text>
            <Text style={styles.dashboardTitle}>Sports Mode</Text>
            <Text style={styles.dashboardSubtitle}>{finalPosition}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.82} style={styles.editButton} onPress={() => { setStep(0); setMode("onboarding"); }}>
            <Ionicons name="create-outline" size={16} color="#FFFFFF" />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatTile value={String(stats.workouts)} label="Sport workouts" />
          <StatTile value={`${stats.xp}`} label="Sport XP" />
          <StatTile value={`${stats.streak}`} label="Streak" />
        </View>

        <View style={styles.programCard}>
          <Text style={styles.sectionLabel}>Your Training Program</Text>
          <View style={styles.programTopRow}>
            <View style={[styles.programIcon, { backgroundColor: `${selectedSport.tint}22` }]}>
              <Text style={styles.programEmoji}>{selectedSport.emoji}</Text>
            </View>
            <View style={styles.programTextBlock}>
              <Text style={styles.programTitle}>{program?.name ?? `${selectedSport.label} Athletic Session`}</Text>
              <Text style={styles.programDescription}>{program?.description ?? "Sport-specific speed, power, stamina, and movement quality."}</Text>
            </View>
          </View>
          {program ? (
            <Text style={styles.equipmentBadge}>{getEquipmentTierLabel(program.equipmentTier)}</Text>
          ) : null}
          <TouchableOpacity activeOpacity={0.86} style={styles.primaryButton} onPress={startWorkout}>
            <Ionicons name="play" size={17} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Start Workout</Text>
          </TouchableOpacity>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout scroll contentContainerStyle={styles.onboardingScreen}>
      <View style={styles.topProgressRow}>
        <Text style={styles.progressText}>Step {step + 1} of {TOTAL_STEPS}</Text>
        <Text style={styles.largeStep}>{String(step + 1).padStart(2, "0")}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
        {step === 0 ? (
          <QuestionScreen question="Which sport do you play?">
            <View style={styles.sportGrid}>
              {sports.map((sport) => (
                <TouchableOpacity
                  activeOpacity={0.84}
                  key={sport.name}
                  onPress={() => setSelected(sport.name)}
                  style={[styles.sportCard, selected === sport.name && styles.optionSelected]}
                >
                  {selected === sport.name ? (
                    <View style={styles.checkBadge}><Ionicons name="checkmark" size={13} color="#FFFFFF" /></View>
                  ) : null}
                  <Text style={styles.sportEmoji}>{sport.emoji}</Text>
                  <Text style={styles.sportName}>{sport.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </QuestionScreen>
        ) : null}

        {step === 1 ? (
          <QuestionScreen question="What is your level?">
            {levels.map((item) => (
              <OptionRow key={item.title} active={level === item.title} title={item.title} description={item.description} onPress={() => setLevel(item.title)} />
            ))}
          </QuestionScreen>
        ) : null}

        {step === 2 ? (
          <QuestionScreen question="How often do you train?">
            {frequencies.map((item) => (
              <OptionRow key={item.title} active={frequency === item.title} title={item.title} description={item.description} onPress={() => setFrequency(item.title)} />
            ))}
          </QuestionScreen>
        ) : null}

        {step === 3 ? (
          <QuestionScreen question={getPositionQuestion(selected)}>
            {selected === "Other" ? (
              <TextInput
                placeholder="Example: Badminton, Martial Arts, Cycling..."
                placeholderTextColor="#6B7280"
                style={styles.input}
                value={customSport}
                onChangeText={setCustomSport}
                underlineColorAndroid="transparent"
              />
            ) : (
              (positionOptions.length > 0 ? positionOptions : ["General athlete"]).map((item) => (
                <OptionRow key={item} active={(position || positionOptions[0]) === item} title={item} onPress={() => setPosition(item)} />
              ))
            )}
          </QuestionScreen>
        ) : null}
      </Animated.View>

      {step === 3 ? (
        <TouchableOpacity onPress={() => { setPosition("General athlete"); void saveAnswersAndCalibrate(); }}>
          <Text style={styles.skipText}>Skip this question</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.onboardingFooter}>
        {step > 0 ? (
          <TouchableOpacity activeOpacity={0.82} style={styles.backButton} onPress={() => setStep((current) => Math.max(0, current - 1))}>
            <Ionicons name="chevron-back" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity activeOpacity={0.86} disabled={!isContinueEnabled} style={[styles.continueButton, !isContinueEnabled && styles.continueDisabled]} onPress={advance}>
          <Text style={styles.continueText}>{step === TOTAL_STEPS - 1 ? "Calibrate Plan" : "Continue"}</Text>
        </TouchableOpacity>
      </View>
    </AppLayout>
  );
}

function QuestionScreen({ children, question }: { children: ReactNode; question: string }) {
  return (
    <View style={styles.questionScreen}>
      <Text style={styles.questionText}>{question}</Text>
      <View style={styles.optionsWrap}>{children}</View>
    </View>
  );
}

function OptionRow({ active, description, onPress, title }: { active: boolean; description?: string; onPress: () => void; title: string }) {
  return (
    <TouchableOpacity activeOpacity={0.84} onPress={onPress} style={[styles.optionRow, active && styles.optionSelected]}>
      <View style={styles.optionTextBlock}>
        <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>{title}</Text>
        {description ? <Text style={[styles.optionDescription, active && styles.optionDescriptionActive]}>{description}</Text> : null}
      </View>
      {active ? <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" /> : null}
    </TouchableOpacity>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  onboardingScreen: { backgroundColor: "#080808", gap: 16 },
  topProgressRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  progressText: { color: "#9CA3AF", fontSize: 12, fontWeight: "800" },
  largeStep: { color: "#4B5563", fontSize: 34, fontWeight: "900" },
  progressTrack: { backgroundColor: "#1A1A1F", borderRadius: 999, height: 5, overflow: "hidden", width: "100%" },
  progressFill: { backgroundColor: "#3B82F6", borderRadius: 999, height: 5 },
  questionScreen: { gap: 20 },
  questionText: { color: "#FFFFFF", fontSize: 28, fontWeight: "800", lineHeight: 35, paddingHorizontal: 8, paddingVertical: 14, textAlign: "center" },
  optionsWrap: { gap: 10 },
  sportGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sportCard: { alignItems: "center", aspectRatio: 1, backgroundColor: "#1A1A1F", borderColor: "#2A2A35", borderRadius: 14, borderWidth: 1, justifyContent: "center", position: "relative", width: "48%" },
  sportEmoji: { fontSize: 36, marginBottom: 8 },
  sportName: { color: "#FFFFFF", fontSize: 13, fontWeight: "800", textAlign: "center" },
  checkBadge: { alignItems: "center", backgroundColor: "#2563EB", borderRadius: 11, height: 22, justifyContent: "center", position: "absolute", right: 10, top: 10, width: 22 },
  optionRow: { alignItems: "center", backgroundColor: "#1A1A1F", borderColor: "#2A2A35", borderRadius: 14, borderWidth: 1, flexDirection: "row", minHeight: 56, paddingHorizontal: 14 },
  optionSelected: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  optionTextBlock: { flex: 1, gap: 3 },
  optionTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  optionTitleActive: { fontWeight: "900" },
  optionDescription: { color: "#9CA3AF", fontSize: 12, fontWeight: "500" },
  optionDescriptionActive: { color: "rgba(255,255,255,0.86)" },
  input: { backgroundColor: "#1A1A1F", borderColor: "#2A2A35", borderRadius: 14, borderWidth: 1, color: "#FFFFFF", fontSize: 15, minHeight: 56, paddingHorizontal: 14 },
  skipText: { color: "#9CA3AF", fontSize: 13, fontWeight: "800", textAlign: "center" },
  onboardingFooter: { alignItems: "center", flexDirection: "row", gap: 10, marginTop: "auto" },
  backButton: { alignItems: "center", backgroundColor: "#1A1A1F", borderColor: "#2A2A35", borderRadius: 16, borderWidth: 1, height: 56, justifyContent: "center", width: 56 },
  continueButton: { alignItems: "center", backgroundColor: "#3B82F6", borderRadius: 16, flex: 1, height: 56, justifyContent: "center" },
  continueDisabled: { opacity: 0.45 },
  continueText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  calibrationScreen: { alignItems: "center", backgroundColor: "#080808", justifyContent: "center", gap: 16, paddingHorizontal: 26 },
  calibrationEmoji: { fontSize: 80, textShadowColor: "rgba(59,130,246,0.45)", textShadowRadius: 28 },
  aiTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "900", letterSpacing: 4, marginTop: 8 },
  aiSubtitle: { color: "#9CA3AF", fontSize: 12, marginTop: -10 },
  calibrationCard: { backgroundColor: "#1A1A1F", borderColor: "#2A2A35", borderRadius: 18, borderWidth: 1, gap: 11, marginTop: 10, padding: 18, width: "100%" },
  calibrationRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  stepDot: { alignItems: "center", borderColor: "#4B5563", borderRadius: 8, borderWidth: 1, height: 16, justifyContent: "center", width: 16 },
  stepDotActive: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  stepText: { color: "#9CA3AF", fontSize: 13, fontWeight: "700" },
  stepTextActive: { color: "#3B82F6" },
  completionScreen: { alignItems: "center", backgroundColor: "#080808", justifyContent: "center", gap: 18, paddingHorizontal: 22 },
  completionEmoji: { fontSize: 80 },
  completionTitle: { color: "#FFFFFF", fontSize: 36, fontWeight: "900", textAlign: "center" },
  completionSubtitle: { color: "#3B82F6", fontSize: 16, fontWeight: "900", textAlign: "center" },
  answerSummaryGrid: { gap: 10, width: "100%" },
  summaryTile: { backgroundColor: "#1A1A1F", borderColor: "#2A2A35", borderRadius: 14, borderWidth: 1, padding: 14 },
  summaryLabel: { color: "#9CA3AF", fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  summaryValue: { color: "#FFFFFF", fontSize: 16, fontWeight: "900", marginTop: 4 },
  primaryButton: { alignItems: "center", backgroundColor: "#3B82F6", borderRadius: 16, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 56, paddingHorizontal: 18, width: "100%" },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  dashboardScreen: { backgroundColor: "#080808", gap: 16 },
  dashboardHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", gap: 12 },
  dashboardKicker: { color: "#3B82F6", fontSize: 12, fontWeight: "900" },
  dashboardTitle: { color: "#FFFFFF", fontSize: 33, fontWeight: "900", letterSpacing: -1.2, marginTop: 4 },
  dashboardSubtitle: { color: "#9CA3AF", fontSize: 14, marginTop: 2 },
  editButton: { alignItems: "center", backgroundColor: "#1A1A1F", borderColor: "#2A2A35", borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 6, paddingHorizontal: 12, paddingVertical: 10 },
  editText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  statsRow: { flexDirection: "row", gap: 8 },
  statTile: { alignItems: "center", backgroundColor: "#1A1A1F", borderColor: "#2A2A35", borderRadius: 14, borderWidth: 1, flex: 1, padding: 12 },
  statValue: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  statLabel: { color: "#9CA3AF", fontSize: 10, fontWeight: "800", marginTop: 4, textAlign: "center" },
  programCard: { backgroundColor: "#1A1A1F", borderColor: "#2A2A35", borderRadius: 20, borderWidth: 1, gap: 14, padding: 16 },
  sectionLabel: { color: "#3B82F6", fontSize: 11, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase" },
  programTopRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  programIcon: { alignItems: "center", borderRadius: 22, height: 58, justifyContent: "center", width: 58 },
  programEmoji: { fontSize: 30 },
  programTextBlock: { flex: 1, gap: 4 },
  programTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "900" },
  programDescription: { color: "#9CA3AF", fontSize: 12, lineHeight: 18 },
  equipmentBadge: { alignSelf: "flex-start", backgroundColor: "rgba(59,130,246,0.16)", borderColor: "rgba(59,130,246,0.35)", borderRadius: 999, borderWidth: 1, color: "#3B82F6", fontSize: 11, fontWeight: "900", overflow: "hidden", paddingHorizontal: 10, paddingVertical: 6 }
});
