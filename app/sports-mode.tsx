import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AdaptiveBanner } from "@/components/AdaptiveBanner";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { GeneratedDay, GeneratedPlan, generatePersonalizedPlan, loadExistingPlan } from "@/lib/generateAiPlan";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

const SPORT_ONBOARDING_KEY = "fitneo.sports.onboarding.v2";
const TOTAL_STEPS = 4;

const sports = [
  {
    name: "Football (Soccer)",
    label: "Football",
    icon: "football" as const,
    glyph: "⚽",
    accent: "#22C55E",
    secondary: "#052E16",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=85",
    mood: "Pitch speed · first step · match engine"
  },
  {
    name: "Basketball",
    label: "Basketball",
    icon: "basketball" as const,
    glyph: "🏀",
    accent: "#F97316",
    secondary: "#431407",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=85",
    mood: "Court bounce · vertical pop · lateral lock"
  },
  {
    name: "Tennis",
    label: "Tennis",
    icon: "tennisball" as const,
    glyph: "🎾",
    accent: "#A3E635",
    secondary: "#1A2E05",
    image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1200&q=85",
    mood: "Split-step rhythm · rotation · recovery"
  },
  {
    name: "Swimming",
    label: "Swimming",
    icon: "accessibility" as const,
    glyph: "🏊",
    accent: "#06B6D4",
    secondary: "#083344",
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1200&q=85",
    mood: "Pool power · streamline · shoulder durability"
  },
  {
    name: "Running",
    label: "Running",
    icon: "walk" as const,
    glyph: "🏃",
    accent: "#A855F7",
    secondary: "#3B0764",
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=85",
    mood: "Cadence · pace · aerobic engine"
  },
  {
    name: "Rugby",
    label: "Rugby",
    icon: "american-football" as const,
    glyph: "🏉",
    accent: "#16A34A",
    secondary: "#052E16",
    image: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=85",
    mood: "Collision-ready · repeat power · pitch grit"
  },
  {
    name: "Boxing",
    label: "Boxing",
    icon: "fitness" as const,
    glyph: "🥊",
    accent: "#EF4444",
    secondary: "#450A0A",
    image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=85",
    mood: "Footwork · rotation · punch endurance"
  },
  {
    name: "Cricket",
    label: "Cricket",
    icon: "baseball" as const,
    glyph: "🏏",
    accent: "#EAB308",
    secondary: "#422006",
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=85",
    mood: "Crease speed · shoulder rhythm · field reaction"
  },
  {
    name: "Volleyball",
    label: "Volleyball",
    icon: "ellipse" as const,
    glyph: "🏐",
    accent: "#EC4899",
    secondary: "#500724",
    image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1200&q=85",
    mood: "Approach jump · block timing · floor defense"
  },
  {
    name: "Other",
    label: "Other",
    icon: "sparkles" as const,
    glyph: "✦",
    accent: "#0A84FF",
    secondary: "#082F49",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=85",
    mood: "Custom athletic profile"
  }
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

const positions: Record<string, string[]> = {
  "Football (Soccer)": ["Goalkeeper", "Centre Back", "Full Back", "Defensive Midfielder", "Central Midfielder", "Attacking Midfielder", "Left Winger", "Right Winger", "Striker"],
  Basketball: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
  Rugby: ["Prop", "Hooker", "Lock", "Flanker", "Number 8", "Scrum Half", "Fly Half", "Centre", "Wing", "Fullback"],
  Volleyball: ["Setter", "Outside Hitter", "Opposite Hitter", "Middle Blocker", "Libero"],
  Boxing: ["Orthodox", "Southpaw", "Switch", "Out-boxer", "Pressure Fighter", "Counter Puncher"],
  Tennis: ["Baseline Player", "Serve-and-Volley", "All-Court Player", "Doubles Specialist"],
  Swimming: ["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "Individual Medley", "Open Water"],
  Running: ["First 5K", "Weight-loss Walking", "10K Base", "Speed / Pace", "Endurance"],
  Cricket: ["Batter", "Bowler", "All-rounder", "Wicketkeeper", "Fielder"]
};

const calibrationSteps = [
  "Analyzing sport demands",
  "Evaluating position needs",
  "Building your AI training plan",
  "Calibrating weekly intensity",
  "Finalizing your sports plan"
];

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

type ScreenMode = "empty" | "onboarding" | "completion" | "dashboard";

function getSportMeta(sportName: string) {
  return sports.find((sport) => sport.name === sportName) ?? sports[0];
}

function getPositionQuestion(sportName: string) {
  if (sportName === "Other") return "Tell us your sport";
  if (sportName === "Swimming") return "What swim focus are you training?";
  if (sportName === "Running") return "What running goal are you chasing?";
  if (sportName === "Tennis") return "What playing style fits you?";
  if (sportName === "Cricket") return "What cricket role do you play?";
  if (sportName === "Boxing") return "What boxing style do you train?";
  return "What position do you play?";
}

function getRoleLabel(sportName: string) {
  if (sportName === "Swimming") return "Focus";
  if (sportName === "Running") return "Goal";
  if (sportName === "Tennis") return "Style";
  if (sportName === "Cricket") return "Role";
  if (sportName === "Boxing") return "Style";
  return sportName === "Other" ? "Sport" : "Position";
}

type SportMeta = (typeof sports)[number];

const sportGlyphs: Record<string, string> = {
  "Football (Soccer)": "\u26BD",
  Basketball: "\uD83C\uDFC0",
  Tennis: "\uD83C\uDFBE",
  Swimming: "\uD83C\uDFCA",
  Running: "\uD83C\uDFC3",
  Rugby: "\uD83C\uDFC9",
  Boxing: "\uD83E\uDD4A",
  Cricket: "\uD83C\uDFCF",
  Volleyball: "\uD83C\uDFD0",
  Other: "\u2726"
};

function getSportGlyph(sport: SportMeta) {
  return sportGlyphs[sport.name] ?? sport.glyph ?? "\u2726";
}

function formatSportMood(value: string) {
  return value.replace(/Â·/g, "·").replace(/â€”/g, "—");
}

function SportGlyph({ sport, size = 28, selected = false }: { sport: SportMeta; size?: number; selected?: boolean }) {
  return (
    <Text
      style={{
        color: selected ? "#FFFFFF" : sport.accent,
        fontSize: size,
        lineHeight: size + 4,
        textAlign: "center"
      }}
    >
      {getSportGlyph(sport)}
    </Text>
  );
}

function getShortLevel(level: string) {
  if (level === "Semi-Professional") return "Semi-Pro";
  return level;
}

function getPlanSessionName(plan: GeneratedPlan | null, selectedSport: string, day: GeneratedDay) {
  return `${plan?.planTitle ?? selectedSport} · Day ${day.dayNumber} · ${day.title}`;
}

export default function SportsModeScreen() {
  const { profile, refreshProfile, user } = useAuth();
  const { isPremium } = useSubscription();
  const savedAnswers = profile?.onboarding_answers ?? {};
  const savedSport = typeof savedAnswers.sport === "string" ? savedAnswers.sport : "";
  const [selected, setSelected] = useState(savedSport || "Football (Soccer)");
  const [level, setLevel] = useState(typeof savedAnswers.sport_level === "string" ? savedAnswers.sport_level : "Recreational");
  const [frequency, setFrequency] = useState(typeof savedAnswers.sport_frequency === "string" ? savedAnswers.sport_frequency : "3-4x per week");
  const [position, setPosition] = useState(typeof savedAnswers.sport_position === "string" ? savedAnswers.sport_position : "");
  const [customSport, setCustomSport] = useState(savedSport === "Other" && typeof savedAnswers.sport_position === "string" ? savedAnswers.sport_position : "");
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<ScreenMode>(savedSport ? "dashboard" : "empty");
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationIndex, setCalibrationIndex] = useState(0);
  const [stats, setStats] = useState<SportStats>({ workouts: 0, xp: 0, streak: 0 });
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const selectedSport = getSportMeta(selected);
  const positionOptions = positions[selected] ?? [];
  const finalPosition = useMemo(() => {
    if (selected === "Other") return customSport.trim() || "Custom sport";
    return position || positionOptions[0] || "General athlete";
  }, [customSport, position, positionOptions, selected]);
  const isContinueEnabled = step !== 3 || selected !== "Other" || customSport.trim().length > 1;
  const displayColor = plan?.sportColor ?? selectedSport.accent;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(slideAnim, { duration: 0, toValue: 18, useNativeDriver: true }),
      Animated.timing(slideAnim, { duration: 220, toValue: 0, useNativeDriver: true })
    ]).start();
  }, [slideAnim, step]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { duration: 850, toValue: 1.12, useNativeDriver: true }),
        Animated.timing(pulseAnim, { duration: 850, toValue: 1, useNativeDriver: true })
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

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
          }, 520);
          return current;
        }
        return current + 1;
      });
    }, 560);
    return () => clearInterval(timer);
  }, [isCalibrating]);

  useEffect(() => {
    if (mode !== "dashboard") return;
    void loadSportStats();
    void loadAiPlan(false);
  }, [mode, selected, user?.id]);

  async function loadAiPlan(forceRegenerate: boolean) {
    if (!user?.id || isPlanLoading) return;
    setPlanError(null);
    setIsPlanLoading(true);
    try {
      const existing = forceRegenerate ? null : await loadExistingPlan(user.id);
      const nextPlan = existing ?? await generatePersonalizedPlan(user.id);
      setPlan(nextPlan);
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Could not load your AI plan.");
    } finally {
      setIsPlanLoading(false);
    }
  }

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
          .ilike("session_name", `%${selectedSport.label}%`),
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
      if (!error) await refreshProfile();
      try {
        const nextPlan = await generatePersonalizedPlan(user.id);
        setPlan(nextPlan);
      } catch (err) {
        setPlanError(err instanceof Error ? err.message : "Could not generate your sports plan yet.");
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

  function confirmRegeneratePlan() {
    Alert.alert(
      "Regenerate AI plan?",
      "FITNEO will rebuild your 4-week plan from your latest sport profile.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Regenerate", onPress: () => void loadAiPlan(true) }
      ]
    );
  }

  function startDay(day: GeneratedDay, weekNumber: number) {
    if (day.isRest || day.exerciseIds.length === 0) return;
    router.push({
      pathname: "/active-workout",
      params: {
        mode: selected,
        programId: `ai-${selected.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        programName: `${getPlanSessionName(plan, selectedSport.label, day)} · Week ${weekNumber}`,
        exerciseIds: JSON.stringify(day.exerciseIds)
      }
    });
  }

  if (isCalibrating) {
    return (
      <AppLayout contentContainerStyle={styles.calibrationScreen}>
        <Animated.View style={[styles.aiOrb, { borderColor: displayColor, transform: [{ scale: pulseAnim }] }]}>
          <SportGlyph sport={selectedSport} size={44} selected />
        </Animated.View>
        <Text style={styles.aiTitle}>FITNEO AI</Text>
        <Text style={styles.aiSubtitle}>Sports Mode</Text>
        <View style={styles.calibrationCard}>
          {calibrationSteps.map((item, index) => {
            const active = index <= calibrationIndex;
            return (
              <View key={item} style={styles.calibrationRow}>
                <View style={[styles.stepDot, active && { backgroundColor: displayColor, borderColor: displayColor }]}>
                  {active ? <Ionicons name="checkmark" size={10} color="#FFFFFF" /> : null}
                </View>
                <Text style={[styles.stepText, active && { color: displayColor }]}>{item}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { backgroundColor: displayColor, width: `${((calibrationIndex + 1) / calibrationSteps.length) * 100}%` }]} />
        </View>
      </AppLayout>
    );
  }

  if (mode === "empty") {
    return (
      <AppLayout contentContainerStyle={styles.emptyScreen}>
        <SportsHeader />
        <View style={styles.emptyHalo}>
          <Ionicons name="trophy" size={34} color={colors.gold} />
        </View>
        <View style={styles.emptySportGrid}>
          {sports.slice(0, 9).map((sport) => (
            <View key={sport.name} style={[styles.emptySportTile, { borderColor: `${sport.accent}44` }]}>
              <SportGlyph sport={sport} size={28} />
            </View>
          ))}
        </View>
        <Text style={styles.emptyTitle}>Choose Your Sport</Text>
        <Text style={styles.emptySubtitle}>FITNEO AI builds a 4-week plan around your sport, position, level, schedule, and equipment.</Text>
        <View style={styles.emptyFeatureRow}>
          <Text style={styles.emptyFeature}>Position-based drills</Text>
          <Text style={styles.emptyFeature}>AI weekly plan</Text>
        </View>
        <TouchableOpacity activeOpacity={0.86} style={styles.primaryButton} onPress={() => setMode("onboarding")}>
          <Text style={styles.primaryButtonText}>Set Up My Sport Profile</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </AppLayout>
    );
  }

  if (mode === "completion") {
    return (
      <AppLayout contentContainerStyle={styles.completionScreen}>
        <SportsHeader />
        <View style={[styles.completionIcon, { borderColor: displayColor }]}>
          <SportGlyph sport={selectedSport} size={48} selected />
        </View>
        <Text style={styles.completionTitle}>You're all set</Text>
        <Text style={[styles.completionSubtitle, { color: displayColor }]}>{level} {selectedSport.label} Player</Text>
        <View style={styles.answerSummaryGrid}>
          <SummaryTile label="Sport" value={selectedSport.label} />
          <SummaryTile label="Level" value={level} />
          <SummaryTile label={getRoleLabel(selected)} value={finalPosition} />
        </View>
        <TouchableOpacity activeOpacity={0.86} style={[styles.primaryButton, { backgroundColor: displayColor }]} onPress={() => setMode("dashboard")}>
          <Text style={styles.primaryButtonText}>Open Sports Plan</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </AppLayout>
    );
  }

  if (mode === "dashboard") {
    const visibleWeeks = plan?.weeks ?? [];
    const previewWeeks = visibleWeeks;
    return (
      <AppLayout scroll contentContainerStyle={styles.dashboardScreen}>
        <SportsHeader />
        <ImageBackground source={{ uri: selectedSport.image }} resizeMode="cover" style={[styles.heroCard, { borderLeftColor: displayColor }]} imageStyle={styles.heroImage}>
          <LinearGradient colors={[`${selectedSport.secondary}DD`, "rgba(6,6,8,0.84)", "rgba(6,6,8,0.98)"]} style={StyleSheet.absoluteFillObject} />
          <View style={[styles.heroDiagonal, { backgroundColor: `${displayColor}38` }]} />
          <View style={styles.heroTop}>
            <View style={styles.heroIdentity}>
              <View style={[styles.heroIcon, { backgroundColor: `${displayColor}22` }]}>
                <SportGlyph sport={selectedSport} size={26} />
              </View>
              <View style={styles.heroTextBlock}>
                <Text style={styles.heroSport}>{plan?.planTitle ?? `${selectedSport.label} Training Plan`}</Text>
                <Text style={[styles.heroPosition, { color: displayColor }]}>{finalPosition}</Text>
              </View>
            </View>
            <View style={styles.heroActions}>
              <Text style={styles.levelBadge}>{getShortLevel(level)}</Text>
              <TouchableOpacity activeOpacity={0.82} style={styles.editButton} onPress={() => { setStep(0); setMode("onboarding"); }}>
                <Ionicons name="create-outline" size={15} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.82} style={styles.editButton} onPress={confirmRegeneratePlan}>
                <Ionicons name="refresh" size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.sportMood, { color: displayColor }]}>{formatSportMood(selectedSport.mood)}</Text>
          <Text style={styles.tagline}>{plan?.tagline ?? "Your AI plan is calibrating around your sport profile."}</Text>
          <Text style={styles.description}>{plan?.planDescription ?? "FITNEO is preparing a personalized training block for you."}</Text>
          <View style={styles.heroStatRow}>
            <HeroStat value={String(stats.workouts)} label="This week" />
            <View style={styles.statDivider} />
            <HeroStat value={String(stats.streak)} label="Streak" />
            <View style={styles.statDivider} />
            <HeroStat value={String(stats.xp)} label="Sport XP" />
          </View>
        </ImageBackground>

        <AdaptiveBanner enabled={!isPremium} label="Sponsored sports recovery" />

        {isPlanLoading ? (
          <View style={styles.loadingPlanCard}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons name="hardware-chip" size={34} color={displayColor} />
            </Animated.View>
            <ActivityIndicator color={displayColor} />
            <Text style={styles.loadingPlanTitle}>Building your AI training plan</Text>
            <Text style={styles.loadingPlanCopy}>Reading your sport profile and matching valid exercises from the FITNEO catalog.</Text>
          </View>
        ) : null}

        {planError ? <Text style={styles.planError}>{planError}</Text> : null}

        {previewWeeks.map((week) => (
          <View key={week.weekNumber} style={styles.weekBlock}>
            <View style={styles.weekHeader}>
              <Text style={styles.weekTitle}>Week {week.weekNumber}</Text>
              <Text style={[styles.weekBadge, { backgroundColor: `${displayColor}24`, color: displayColor }]}>{week.theme}</Text>
            </View>
            <View style={styles.dayList}>
              {week.days.map((day) => (
                <TouchableOpacity
                  activeOpacity={day.isRest ? 1 : 0.84}
                  key={`${week.weekNumber}-${day.dayNumber}`}
                  onPress={() => startDay(day, week.weekNumber)}
                  style={[
                    styles.dayCard,
                    day.isRest ? styles.restDayCard : { borderLeftColor: displayColor }
                  ]}
                >
                  <View style={[styles.dayIcon, day.isRest ? styles.restIcon : { backgroundColor: `${displayColor}22` }]}>
                    <Ionicons name={day.isRest ? "moon" : "walk"} size={18} color={day.isRest ? "#6B7280" : displayColor} />
                  </View>
                  <View style={styles.dayCopy}>
                    <Text style={[styles.dayTitle, day.isRest && styles.restText]}>Day {day.dayNumber} · {day.title}</Text>
                    <Text style={styles.daySubtitle}>{day.focus}</Text>
                    <Text style={styles.dayNote}>{day.motivationalNote}</Text>
                  </View>
                  {!day.isRest ? (
                    <View style={[styles.playCircle, { backgroundColor: displayColor }]}>
                      <Ionicons name="play" size={14} color="#FFFFFF" />
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

      </AppLayout>
    );
  }

  return (
    <AppLayout scroll contentContainerStyle={styles.onboardingScreen}>
      <SportsHeader />
      <LinearGradient
        colors={[`${displayColor}42`, "rgba(8,8,8,0.98)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.onboardingHero}
      >
        <View style={styles.heroGlowDot} />
        <View style={styles.onboardingHeroTop}>
          <View style={[styles.onboardingSportOrb, { borderColor: displayColor, shadowColor: displayColor }]}>
            <SportGlyph sport={selectedSport} size={30} />
          </View>
          <View style={styles.onboardingHeroCopy}>
            <Text style={styles.onboardingKicker}>FITNEO AI SPORTS</Text>
            <Text style={styles.onboardingHeroTitle}>Build a plan like a real athlete</Text>
          </View>
        </View>
        <Text style={styles.onboardingHeroText}>
          Pick your sport profile and FITNEO will calibrate drills, intensity, rest days, and position work around you.
        </Text>
        <View style={styles.onboardingHeroPills}>
          <Text style={styles.onboardingHeroPill}>Position aware</Text>
          <Text style={styles.onboardingHeroPill}>4-week block</Text>
          <Text style={styles.onboardingHeroPill}>AI tuned</Text>
        </View>
      </LinearGradient>

      <View style={styles.topProgressRow}>
        <Text style={styles.progressText}>Step {step + 1} of {TOTAL_STEPS}</Text>
        <Text style={styles.largeStep}>{String(step + 1).padStart(2, "0")}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { backgroundColor: displayColor, width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
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
                  style={[styles.sportCard, selected === sport.name && { borderColor: sport.accent, shadowColor: sport.accent }]}
                >
                  <ImageBackground source={{ uri: sport.image }} resizeMode="cover" style={StyleSheet.absoluteFillObject} imageStyle={styles.sportCardImage}>
                    <LinearGradient colors={selected === sport.name ? [`${sport.accent}D9`, `${sport.secondary}E6`] : ["rgba(7,7,9,0.60)", "rgba(7,7,9,0.94)"]} style={StyleSheet.absoluteFillObject} />
                  </ImageBackground>
                  {selected === sport.name ? (
                    <View style={styles.checkBadge}><Ionicons name="checkmark" size={13} color="#FFFFFF" /></View>
                  ) : null}
                  <View style={[styles.sportIconRing, { backgroundColor: selected === sport.name ? "rgba(255,255,255,0.18)" : `${sport.accent}18` }]}>
                    <SportGlyph sport={sport} size={32} selected={selected === sport.name} />
                  </View>
                  <Text style={styles.sportName}>{sport.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </QuestionScreen>
        ) : null}

        {step === 1 ? (
          <QuestionScreen question="What is your level?">
            {levels.map((item) => (
              <OptionRow key={item.title} active={level === item.title} accent={displayColor} title={item.title} description={item.description} onPress={() => setLevel(item.title)} />
            ))}
          </QuestionScreen>
        ) : null}

        {step === 2 ? (
          <QuestionScreen question="How often do you train?">
            {frequencies.map((item) => (
              <OptionRow key={item.title} active={frequency === item.title} accent={displayColor} title={item.title} description={item.description} onPress={() => setFrequency(item.title)} />
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
                <OptionRow key={item} active={(position || positionOptions[0]) === item} accent={displayColor} title={item} onPress={() => setPosition(item)} />
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
        <TouchableOpacity activeOpacity={0.86} disabled={!isContinueEnabled} style={[styles.continueButton, { backgroundColor: displayColor }, !isContinueEnabled && styles.continueDisabled]} onPress={advance}>
          <Text style={styles.continueText}>{step === TOTAL_STEPS - 1 ? "Calibrate Plan" : "Continue"}</Text>
        </TouchableOpacity>
      </View>
    </AppLayout>
  );
}

function SportsHeader() {
  return (
    <View style={styles.screenHeader}>
      <TouchableOpacity activeOpacity={0.78} style={styles.screenBackButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={styles.screenHeaderTitle}>Sports Mode</Text>
      <View style={styles.screenBackSpacer} />
    </View>
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

function OptionRow({ accent, active, description, onPress, title }: { accent: string; active: boolean; description?: string; onPress: () => void; title: string }) {
  return (
    <TouchableOpacity activeOpacity={0.84} onPress={onPress} style={[styles.optionRow, active && { backgroundColor: accent, borderColor: accent }]}>
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

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenHeader: { alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "space-between", width: "100%" },
  screenBackButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.14)", borderRadius: 18, borderWidth: 1, height: 40, justifyContent: "center", width: 40 },
  screenBackSpacer: { height: 40, width: 40 },
  screenHeaderTitle: { color: "#FFFFFF", flex: 1, fontSize: 18, fontWeight: "900", textAlign: "center" },
  emptyScreen: { alignItems: "center", backgroundColor: "#080808", gap: 18, justifyContent: "center", paddingHorizontal: 24 },
  emptyHalo: { alignItems: "center", backgroundColor: "rgba(255,199,51,0.12)", borderColor: "rgba(255,199,51,0.28)", borderRadius: 34, borderWidth: 1, height: 68, justifyContent: "center", shadowColor: colors.gold, shadowOpacity: 0.28, shadowRadius: 18, width: 68 },
  emptySportGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 260 },
  emptySportTile: { alignItems: "center", backgroundColor: "#111114", borderRadius: 18, borderWidth: 1, height: 70, justifyContent: "center", width: 70 },
  emptyTitle: { color: "#FFFFFF", fontSize: 34, fontWeight: "900", letterSpacing: -1, textAlign: "center" },
  emptySubtitle: { color: "#9CA3AF", fontSize: 14, lineHeight: 21, maxWidth: 340, textAlign: "center" },
  emptyFeatureRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  emptyFeature: { backgroundColor: "rgba(10,132,255,0.12)", borderColor: "rgba(10,132,255,0.28)", borderRadius: 999, borderWidth: 1, color: colors.accent, fontSize: 11, fontWeight: "900", overflow: "hidden", paddingHorizontal: 10, paddingVertical: 6 },
  onboardingScreen: { backgroundColor: "#080808", gap: 16 },
  onboardingHero: { borderColor: "rgba(255,255,255,0.10)", borderRadius: 26, borderWidth: 1, gap: 14, overflow: "hidden", padding: 18, position: "relative" },
  heroGlowDot: { backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 92, height: 184, position: "absolute", right: -82, top: -88, width: 184 },
  onboardingHeroTop: { alignItems: "center", flexDirection: "row", gap: 13 },
  onboardingSportOrb: { alignItems: "center", backgroundColor: "rgba(5,5,6,0.74)", borderRadius: 22, borderWidth: 1, height: 54, justifyContent: "center", shadowOpacity: 0.42, shadowRadius: 18, width: 54 },
  onboardingHeroCopy: { flex: 1 },
  onboardingKicker: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.9 },
  onboardingHeroTitle: { color: "#FFFFFF", fontSize: 23, fontWeight: "900", letterSpacing: -0.6, lineHeight: 27, marginTop: 4 },
  onboardingHeroText: { color: "#D1D5DB", fontSize: 13, fontWeight: "700", lineHeight: 19 },
  onboardingHeroPills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  onboardingHeroPill: { backgroundColor: "rgba(255,255,255,0.10)", borderColor: "rgba(255,255,255,0.14)", borderRadius: 999, borderWidth: 1, color: "#FFFFFF", fontSize: 10, fontWeight: "900", overflow: "hidden", paddingHorizontal: 9, paddingVertical: 6 },
  topProgressRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  progressText: { color: "#9CA3AF", fontSize: 12, fontWeight: "800" },
  largeStep: { color: "#4B5563", fontSize: 34, fontWeight: "900" },
  progressTrack: { backgroundColor: "#1A1A1F", borderRadius: 999, height: 5, overflow: "hidden", width: "100%" },
  progressFill: { borderRadius: 999, height: 5 },
  questionScreen: { gap: 20 },
  questionText: { color: "#FFFFFF", fontSize: 28, fontWeight: "800", lineHeight: 35, paddingHorizontal: 8, paddingVertical: 14, textAlign: "center" },
  optionsWrap: { gap: 10 },
  sportGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sportCard: { alignItems: "center", aspectRatio: 1, backgroundColor: "#1A1A1F", borderColor: "#2A2A35", borderRadius: 20, borderWidth: 1, gap: 10, justifyContent: "center", overflow: "hidden", position: "relative", shadowOpacity: 0.24, shadowRadius: 15, width: "48%" },
  sportIconRing: { alignItems: "center", borderRadius: 24, height: 56, justifyContent: "center", width: 56 },
  sportName: { color: "#FFFFFF", fontSize: 13, fontWeight: "800", textAlign: "center" },
  checkBadge: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.25)", borderRadius: 11, height: 22, justifyContent: "center", position: "absolute", right: 10, top: 10, width: 22 },
  optionRow: { alignItems: "center", backgroundColor: "#1A1A1F", borderColor: "#2A2A35", borderRadius: 14, borderWidth: 1, flexDirection: "row", minHeight: 56, paddingHorizontal: 14 },
  optionTextBlock: { flex: 1, gap: 3 },
  optionTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  optionTitleActive: { fontWeight: "900" },
  optionDescription: { color: "#9CA3AF", fontSize: 12, fontWeight: "500" },
  optionDescriptionActive: { color: "rgba(255,255,255,0.86)" },
  input: { backgroundColor: "#1A1A1F", borderColor: "#2A2A35", borderRadius: 14, borderWidth: 1, color: "#FFFFFF", fontSize: 15, minHeight: 56, paddingHorizontal: 14 },
  skipText: { color: "#9CA3AF", fontSize: 13, fontWeight: "800", textAlign: "center" },
  onboardingFooter: { alignItems: "center", flexDirection: "row", gap: 10, marginTop: "auto" },
  backButton: { alignItems: "center", backgroundColor: "#1A1A1F", borderColor: "#2A2A35", borderRadius: 16, borderWidth: 1, height: 56, justifyContent: "center", width: 56 },
  continueButton: { alignItems: "center", borderRadius: 16, flex: 1, height: 56, justifyContent: "center" },
  continueDisabled: { opacity: 0.45 },
  continueText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  calibrationScreen: { alignItems: "center", backgroundColor: "#080808", gap: 16, justifyContent: "center", paddingHorizontal: 26 },
  aiOrb: { alignItems: "center", backgroundColor: "#101015", borderRadius: 48, borderWidth: 1, height: 96, justifyContent: "center", shadowColor: colors.accent, shadowOpacity: 0.42, shadowRadius: 22, width: 96 },
  aiTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "900", letterSpacing: 4, marginTop: 8 },
  aiSubtitle: { color: "#9CA3AF", fontSize: 12, marginTop: -10 },
  calibrationCard: { backgroundColor: "#1A1A1F", borderColor: "#2A2A35", borderRadius: 18, borderWidth: 1, gap: 11, marginTop: 10, padding: 18, width: "100%" },
  calibrationRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  stepDot: { alignItems: "center", borderColor: "#4B5563", borderRadius: 8, borderWidth: 1, height: 16, justifyContent: "center", width: 16 },
  stepText: { color: "#9CA3AF", fontSize: 13, fontWeight: "700" },
  completionScreen: { alignItems: "center", backgroundColor: "#080808", gap: 18, justifyContent: "center", paddingHorizontal: 22 },
  completionIcon: { alignItems: "center", backgroundColor: "#101015", borderRadius: 42, borderWidth: 1, height: 84, justifyContent: "center", width: 84 },
  completionTitle: { color: "#FFFFFF", fontSize: 36, fontWeight: "900", textAlign: "center" },
  completionSubtitle: { fontSize: 16, fontWeight: "900", textAlign: "center" },
  answerSummaryGrid: { gap: 10, width: "100%" },
  summaryTile: { backgroundColor: "#1A1A1F", borderColor: "#2A2A35", borderRadius: 14, borderWidth: 1, padding: 14 },
  summaryLabel: { color: "#9CA3AF", fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  summaryValue: { color: "#FFFFFF", fontSize: 16, fontWeight: "900", marginTop: 4 },
  primaryButton: { alignItems: "center", backgroundColor: "#3B82F6", borderRadius: 16, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 56, paddingHorizontal: 18, width: "100%" },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  dashboardScreen: { backgroundColor: "#080808", gap: 18 },
  heroCard: { borderColor: "rgba(255,255,255,0.08)", borderLeftWidth: 4, borderRadius: 22, borderTopColor: "rgba(59,130,246,0.35)", borderTopWidth: 1, gap: 14, overflow: "hidden", padding: 16 },
  heroTop: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", gap: 10 },
  heroIdentity: { alignItems: "center", flexDirection: "row", flex: 1, gap: 12 },
  heroIcon: { alignItems: "center", borderRadius: 18, height: 46, justifyContent: "center", width: 46 },
  heroTextBlock: { flex: 1 },
  heroSport: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" },
  heroPosition: { fontSize: 14, fontWeight: "900", marginTop: 2 },
  heroActions: { alignItems: "flex-end", gap: 8 },
  levelBadge: { backgroundColor: "rgba(234,179,8,0.16)", borderColor: "rgba(234,179,8,0.38)", borderRadius: 999, borderWidth: 1, color: "#FACC15", fontSize: 11, fontWeight: "900", overflow: "hidden", paddingHorizontal: 10, paddingVertical: 6 },
  editButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.14)", borderRadius: 16, borderWidth: 1, height: 36, justifyContent: "center", width: 36 },
  tagline: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", lineHeight: 20 },
  description: { color: "#A1A1AA", fontSize: 12, fontWeight: "600", lineHeight: 18 },
  heroStatRow: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.045)", borderRadius: 16, flexDirection: "row", paddingVertical: 12 },
  heroStat: { alignItems: "center", flex: 1, gap: 3 },
  heroStatValue: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  heroStatLabel: { color: "#9CA3AF", fontSize: 10, fontWeight: "800" },
  statDivider: { backgroundColor: "rgba(255,255,255,0.10)", height: 28, width: 1 },
  loadingPlanCard: { alignItems: "center", backgroundColor: "#111114", borderColor: "rgba(255,255,255,0.10)", borderRadius: 20, borderWidth: 1, gap: 10, padding: 22 },
  loadingPlanTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", textAlign: "center" },
  loadingPlanCopy: { color: "#A1A1AA", fontSize: 12, lineHeight: 18, textAlign: "center" },
  planError: { color: colors.danger, fontSize: 12, lineHeight: 18, textAlign: "center" },
  weekBlock: { gap: 10 },
  heroImage: { borderRadius: 22 },
  heroDiagonal: { borderRadius: 90, height: 180, position: "absolute", right: -70, top: -70, transform: [{ rotate: "-18deg" }], width: 180 },
  sportMood: { fontSize: 11, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase" },
  sportCardImage: { borderRadius: 20 },
  lockedPreview: { opacity: 0.3 },
  weekHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  weekTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  weekBadge: { borderRadius: 999, fontSize: 11, fontWeight: "900", overflow: "hidden", paddingHorizontal: 10, paddingVertical: 6 },
  dayList: { gap: 9 },
  dayCard: { alignItems: "center", backgroundColor: "#1A1A1F", borderColor: "rgba(255,255,255,0.06)", borderLeftWidth: 3, borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 12, minHeight: 74, padding: 12 },
  restDayCard: { backgroundColor: "#111114", borderLeftColor: "#2B2B31", opacity: 0.72 },
  dayIcon: { alignItems: "center", borderRadius: 17, height: 38, justifyContent: "center", width: 38 },
  restIcon: { backgroundColor: "rgba(255,255,255,0.045)" },
  dayCopy: { flex: 1, gap: 3 },
  dayTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  daySubtitle: { color: "#A1A1AA", fontSize: 11, fontWeight: "800", lineHeight: 16 },
  dayNote: { color: "#71717A", fontSize: 10, fontWeight: "700", lineHeight: 14 },
  restText: { color: "#9CA3AF" },
  playCircle: { alignItems: "center", borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  unlockOverlay: { alignItems: "center", backgroundColor: "rgba(5,5,6,0.94)", borderColor: "rgba(255,199,51,0.28)", borderRadius: 22, borderWidth: 1, gap: 10, marginTop: -10, padding: 20 },
  unlockTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", textAlign: "center" },
  unlockCopy: { color: "#A1A1AA", fontSize: 13, lineHeight: 19, textAlign: "center" },
  unlockButton: { alignItems: "center", backgroundColor: colors.gold, borderRadius: 14, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 50, paddingHorizontal: 18, width: "100%" },
  unlockButtonText: { color: "#050506", fontSize: 14, fontWeight: "900" }
});
