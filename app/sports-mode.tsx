import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { colors, radii } from "@/lib/theme";

const SPORT_ONBOARDING_KEY = "fitneo.sports.onboarding.v1";

const sports = [
  { name: "Football (Soccer)", programId: "sport-football", icon: "football" as const, tint: "#22C55E" },
  { name: "Basketball", programId: "sport-basketball", icon: "basketball" as const, tint: "#F59E0B" },
  { name: "Tennis", programId: "sport-tennis", icon: "tennisball" as const, tint: "#84CC16" },
  { name: "Swimming", programId: "sport-swimming", icon: "water" as const, tint: "#06B6D4" },
  { name: "Running", programId: "sport-running", icon: "walk" as const, tint: "#3B82F6" },
  { name: "Rugby", programId: "sport-rugby", icon: "ellipse-outline" as const, tint: "#F43F5E" },
  { name: "Boxing", programId: "sport-boxing", icon: "accessibility" as const, tint: "#F97316" },
  { name: "Cricket", programId: "sport-cricket", icon: "baseball" as const, tint: "#38BDF8" },
  { name: "Volleyball", programId: "sport-volleyball", icon: "radio-button-off" as const, tint: "#FB7185" },
  { name: "Other", programId: "sport-football", icon: "sparkles" as const, tint: colors.accent }
];

const levels = ["Recreational", "Amateur", "Semi-Professional", "Professional"];
const frequencies = ["1-2x per week", "3-4x per week", "5x per week", "Daily"];
const calibrationSteps = [
  "Reading sport profile",
  "Analyzing sport demands",
  "Evaluating position needs",
  "Building sport-specific drills",
  "Finalizing your sports plan"
];

const positions: Record<string, string[]> = {
  "Football (Soccer)": ["Goalkeeper", "Centre Back", "Full Back", "Defensive Midfielder", "Central Midfielder", "Attacking Midfielder", "Left Winger", "Right Winger", "Striker"],
  Basketball: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
  Rugby: ["Prop", "Hooker", "Lock", "Flanker", "Number 8", "Scrum Half", "Fly Half", "Centre", "Wing", "Fullback"],
  Volleyball: ["Setter", "Outside Hitter", "Opposite Hitter", "Middle Blocker", "Libero"],
  Boxing: ["Orthodox", "Southpaw", "Switch"],
  Tennis: ["Right", "Left", "Ambidextrous"],
  Swimming: ["Right", "Left", "Ambidextrous"],
  Running: ["Right", "Left", "Ambidextrous"],
  Cricket: ["Right", "Left", "Ambidextrous"]
};

type SportAnswers = {
  sport: string;
  sport_level: string;
  sport_frequency: string;
  sport_position: string;
};

function getSportProgramId(sportName: string) {
  return sports.find((sport) => sport.name === sportName)?.programId ?? "sport-football";
}

function getPositionQuestion(sportName: string) {
  if (["Tennis", "Swimming", "Running", "Cricket"].includes(sportName)) return "Dominant hand?";
  if (sportName === "Other") return "Tell us your sport or position";
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
  const [customSport, setCustomSport] = useState("");
  const [step, setStep] = useState(savedSport ? 4 : 0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationIndex, setCalibrationIndex] = useState(0);
  const selectedSport = sports.find((sport) => sport.name === selected) ?? sports[0];
  const positionOptions = positions[selected] ?? [];
  const progress = isCalibrating ? (calibrationIndex + 1) / calibrationSteps.length : (step + 1) / 4;

  const finalPosition = useMemo(() => {
    if (selected === "Other") return customSport.trim() || position || "Custom sport";
    return position || positionOptions[0] || "General";
  }, [customSport, position, positionOptions, selected]);

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
          setStep(4);
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
            router.replace({
              pathname: "/active-workout",
              params: {
                mode: selected,
                programId: getSportProgramId(selected),
                programName: `${selected} Athletic Session`
              }
            });
          }, 450);
          return current;
        }
        return current + 1;
      });
    }, 560);
    return () => clearInterval(timer);
  }, [isCalibrating, selected]);

  async function saveAndCalibrate() {
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

  function nextStep() {
    if (step === 0) {
      setPosition("");
    }
    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }
    void saveAndCalibrate();
  }

  if (isCalibrating) {
    return (
      <AppLayout contentContainerStyle={styles.calibrationScreen}>
        <View style={[styles.calibrationOrb, { shadowColor: selectedSport.tint }]}>
          <Ionicons name={selectedSport.icon} size={42} color={selectedSport.tint} />
        </View>
        <Text style={styles.aiTitle}>FITNEO AI</Text>
        <Text style={styles.aiSubtitle}>Sports Mode</Text>
        <View style={styles.calibrationCard}>
          {calibrationSteps.map((item, index) => {
            const active = index <= calibrationIndex;
            return (
              <View key={item} style={styles.calibrationRow}>
                <View style={[styles.stepDot, active && styles.stepDotActive]}>
                  {active ? <Ionicons name="checkmark" size={10} color={colors.textPrimary} /> : null}
                </View>
                <Text style={[styles.stepText, active && styles.stepTextActive]}>{item}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout scroll>
      <View style={styles.segment}>
        <TouchableOpacity style={styles.segmentInactive} onPress={() => router.replace("/(tabs)/workouts")}>
          <Text style={styles.segmentInactiveText}>Normal</Text>
        </TouchableOpacity>
        <View style={styles.segmentActive}>
          <Text style={styles.segmentActiveText}>Sports</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <Text style={styles.heading}>{step === 4 ? "Your Sports Plan" : "Sports Calibration"}</Text>
      <Text style={styles.subheading}>
        {step === 4 ? `${selected} · ${level} · ${frequency}` : `Question ${step + 1} of 4`}
      </Text>

      {step === 0 ? (
        <QuestionBlock title="Which sport do you play?">
          <View style={styles.grid}>
            {sports.map((sport) => (
              <OptionCard
                key={sport.name}
                active={selected === sport.name}
                icon={sport.icon}
                label={sport.name}
                tint={sport.tint}
                onPress={() => setSelected(sport.name)}
              />
            ))}
          </View>
        </QuestionBlock>
      ) : null}

      {step === 1 ? (
        <QuestionBlock title="What is your level?">
          {levels.map((item) => <SelectRow key={item} active={level === item} label={item} onPress={() => setLevel(item)} />)}
        </QuestionBlock>
      ) : null}

      {step === 2 ? (
        <QuestionBlock title="How often do you train for your sport?">
          {frequencies.map((item) => <SelectRow key={item} active={frequency === item} label={item} onPress={() => setFrequency(item)} />)}
        </QuestionBlock>
      ) : null}

      {step === 3 ? (
        <QuestionBlock title={getPositionQuestion(selected)}>
          {selected === "Other" ? (
            <TextInput
              placeholder="Example: Badminton winger, martial arts, goalkeeper..."
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              value={customSport}
              onChangeText={setCustomSport}
              underlineColorAndroid="transparent"
            />
          ) : (
            (positionOptions.length > 0 ? positionOptions : ["General"]).map((item) => (
              <SelectRow key={item} active={(position || positionOptions[0]) === item} label={item} onPress={() => setPosition(item)} />
            ))
          )}
        </QuestionBlock>
      ) : null}

      {step === 4 ? (
        <View style={styles.summaryCard}>
          <View style={[styles.summaryOrb, { backgroundColor: `${selectedSport.tint}22` }]}>
            <Ionicons name={selectedSport.icon} size={30} color={selectedSport.tint} />
          </View>
          <Text style={styles.summaryTitle}>{selected} Athletic Session</Text>
          <Text style={styles.summaryCopy}>FITNEO will load drills for your sport, level, training frequency, and position.</Text>
          <View style={styles.summaryTags}>
            {[level, frequency, finalPosition].map((tag) => <Text key={tag} style={styles.summaryTag}>{tag}</Text>)}
          </View>
        </View>
      ) : null}

      <View style={styles.footerRow}>
        {step > 0 && step < 4 ? (
          <TouchableOpacity activeOpacity={0.82} style={styles.secondaryCta} onPress={() => setStep((current) => Math.max(0, current - 1))}>
            <Text style={styles.secondaryCtaText}>Back</Text>
          </TouchableOpacity>
        ) : null}
        {step === 4 ? (
          <TouchableOpacity activeOpacity={0.82} style={styles.secondaryCta} onPress={() => setStep(0)}>
            <Text style={styles.secondaryCtaText}>Edit answers</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity activeOpacity={0.86} style={styles.cta} onPress={step === 4 ? () => setIsCalibrating(true) : nextStep}>
          <Ionicons name={step >= 3 ? "sparkles" : "arrow-forward"} size={18} color={colors.textPrimary} />
          <Text style={styles.ctaText}>{step >= 3 ? `Calibrate ${selected}` : "Continue"}</Text>
        </TouchableOpacity>
      </View>
    </AppLayout>
  );
}

function QuestionBlock({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View style={styles.questionCard}>
      <Text style={styles.questionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function OptionCard({ active, icon, label, onPress, tint }: { active: boolean; icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; tint: string }) {
  return (
    <TouchableOpacity activeOpacity={0.82} onPress={onPress} style={[styles.card, active && styles.cardActive]}>
      <Ionicons name={icon} size={30} color={tint} />
      <Text style={styles.cardTitle}>{label}</Text>
    </TouchableOpacity>
  );
}

function SelectRow({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.82} onPress={onPress} style={[styles.selectRow, active && styles.selectRowActive]}>
      <Text style={[styles.selectText, active && styles.selectTextActive]}>{label}</Text>
      {active ? <Ionicons name="checkmark-circle" size={18} color={colors.accent} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  segment: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: radii.round, flexDirection: "row", gap: 4, padding: 4 },
  segmentActive: { alignItems: "center", backgroundColor: colors.coral, borderRadius: radii.round, flex: 1, justifyContent: "center", minHeight: 38 },
  segmentInactive: { alignItems: "center", borderRadius: radii.round, flex: 1, justifyContent: "center", minHeight: 38 },
  segmentActiveText: { color: colors.textPrimary, fontSize: 13, fontWeight: "900" },
  segmentInactiveText: { color: colors.textSecondary, fontSize: 13, fontWeight: "900" },
  heading: { color: colors.textPrimary, fontSize: 31, fontWeight: "900", letterSpacing: -1.1, marginTop: 8 },
  subheading: { color: colors.textSecondary, fontSize: 14, marginTop: -6 },
  questionCard: { backgroundColor: "rgba(255,255,255,0.045)", borderColor: "rgba(255,255,255,0.08)", borderRadius: 20, borderWidth: 1, gap: 12, padding: 14 },
  questionTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { alignItems: "center", backgroundColor: "#171923", borderColor: "rgba(255,255,255,0.07)", borderRadius: 17, borderWidth: 1, gap: 11, justifyContent: "center", minHeight: 104, padding: 12, width: "48%" },
  cardActive: { borderColor: "rgba(0,163,255,0.7)", shadowColor: colors.accent, shadowOpacity: 0.25, shadowRadius: 14 },
  cardTitle: { color: colors.textPrimary, fontSize: 12, fontWeight: "900", textAlign: "center" },
  selectRow: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.055)", borderColor: "rgba(255,255,255,0.08)", borderRadius: 15, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 50, paddingHorizontal: 14 },
  selectRowActive: { backgroundColor: "rgba(0,163,255,0.14)", borderColor: "rgba(0,163,255,0.55)" },
  selectText: { color: colors.textSecondary, fontSize: 14, fontWeight: "800" },
  selectTextActive: { color: colors.textPrimary },
  input: { backgroundColor: "#121214", borderColor: "rgba(0,163,255,0.32)", borderRadius: 15, borderWidth: 1, color: colors.textPrimary, fontSize: 14, minHeight: 52, paddingHorizontal: 14 },
  summaryCard: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.045)", borderColor: "rgba(0,163,255,0.20)", borderRadius: 22, borderWidth: 1, gap: 12, padding: 18 },
  summaryOrb: { alignItems: "center", borderRadius: 32, height: 64, justifyContent: "center", width: 64 },
  summaryTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: "900", textAlign: "center" },
  summaryCopy: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: "center" },
  summaryTags: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  summaryTag: { backgroundColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.10)", borderRadius: 999, borderWidth: 1, color: colors.textSecondary, fontSize: 10, fontWeight: "900", paddingHorizontal: 9, paddingVertical: 5 },
  footerRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  secondaryCta: { alignItems: "center", borderColor: "rgba(255,255,255,0.12)", borderRadius: 16, borderWidth: 1, justifyContent: "center", minHeight: 54, paddingHorizontal: 16 },
  secondaryCtaText: { color: colors.textSecondary, fontSize: 13, fontWeight: "900" },
  cta: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 16, flex: 1, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 56 },
  ctaText: { color: colors.textPrimary, fontSize: 15, fontWeight: "900" },
  calibrationScreen: { alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 26 },
  calibrationOrb: { alignItems: "center", backgroundColor: "rgba(0,217,178,0.10)", borderRadius: 60, height: 120, justifyContent: "center", shadowOpacity: 0.5, shadowRadius: 34, width: 120 },
  aiTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: "900", letterSpacing: 4, marginTop: 10 },
  aiSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: -10 },
  calibrationCard: { backgroundColor: "#1B1D28", borderColor: "rgba(255,255,255,0.08)", borderRadius: 18, borderWidth: 1, gap: 11, marginTop: 10, padding: 18, width: "100%" },
  calibrationRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  stepDot: { alignItems: "center", borderColor: "rgba(255,255,255,0.35)", borderRadius: 8, borderWidth: 1, height: 16, justifyContent: "center", width: 16 },
  stepDotActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  stepText: { color: colors.textTertiary, fontSize: 13, fontWeight: "700" },
  stepTextActive: { color: colors.accent },
  progressTrack: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 999, height: 5, marginTop: 8, overflow: "hidden", width: "100%" },
  progressFill: { backgroundColor: colors.coral, borderRadius: 999, height: 5 }
});
