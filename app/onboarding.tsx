import { Ionicons } from "@expo/vector-icons";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { saveOnboardingProfile } from "@/lib/api";
import { generatePersonalizedPlan } from "@/lib/generateAiPlan";
import { setNotificationPreference } from "@/lib/notifications";
import { colors } from "@/lib/theme";

type ScreenKey =
  | "welcome"
  | "focus"
  | "currentShape"
  | "desiredShape"
  | "goal"
  | "role"
  | "level"
  | "microWorkout"
  | "birthYear"
  | "pastExperience"
  | "statementOne"
  | "statementTwo"
  | "matchingScore"
  | "timeline"
  | "feelings"
  | "reward"
  | "metrics"
  | "ready"
  | "notifications";

const onboardingScreens: ScreenKey[] = [
  "welcome",
  "focus",
  "currentShape",
  "desiredShape",
  "goal",
  "role",
  "level",
  "microWorkout",
  "birthYear",
  "pastExperience",
  "statementOne",
  "statementTwo",
  "matchingScore",
  "timeline",
  "feelings",
  "reward",
  "metrics",
  "ready",
  "notifications"
];

const focusAreas = ["Arm", "Shoulder", "Chest", "Abs", "Leg", "Full Body"];
const bodyShapes = ["Medium", "Soft", "Lean", "Muscular"];
const desiredShapes = ["Cut", "Athletic", "Strong", "Muscular", "Elite"];
const goals = ["Lose Weight", "Build Muscle", "Improve Endurance", "Athletic Performance", "Stay Active"];
const roles = ["Student", "Office worker", "Parent", "Athlete", "Busy professional", "Other"];
const levels = ["Beginner", "Intermediate", "Advanced"];
const equipmentOptions = ["No Equipment", "Dumbbells", "Full Gym", "Yoga & Mobility"];
const timelines = ["4 weeks", "8 weeks", "12 weeks", "6 months", "No rush"];
const feelings = ["Confident", "Stronger", "Lighter", "Athletic", "Disciplined", "Energized"];
const rewards = [
  { id: "beach", title: "Beach ready", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80" },
  { id: "mirror", title: "Mirror confidence", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&q=80" },
  { id: "sports", title: "Sport performance", image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&q=80" }
];

const coachImage = "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80";
const focusImage = "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=600&q=80";
const successImage = "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80";

export default function OnboardingScreen() {
  const { profile, markLocalOnboardingComplete, refreshProfile, session } = useAuth();
  const params = useLocalSearchParams<{ mode?: string }>();
  const isEditing = params.mode === "edit";
  const savedAnswers = profile?.onboarding_answers ?? {};
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(profile?.display_name ?? "");
  const [birthYear, setBirthYear] = useState(Number(savedAnswers.birthYear ?? new Date().getFullYear() - (profile?.age ?? 25)));
  const [gender, setGender] = useState(profile?.gender ?? "male");
  const [weight, setWeight] = useState(String(profile?.weight_kg ?? 70));
  const [targetWeight, setTargetWeight] = useState(String(savedAnswers.targetWeight ?? Math.max(50, Math.round((profile?.weight_kg ?? 70) * 0.94))));
  const [weightUnit, setWeightUnit] = useState("kg");
  const [height, setHeight] = useState(String(profile?.height_cm ?? 175));
  const [focusArea, setFocusArea] = useState(String(savedAnswers.focusArea ?? "Full Body"));
  const [currentBodyShape, setCurrentBodyShape] = useState(String(savedAnswers.currentBodyShape ?? "Medium"));
  const [desiredBodyShape, setDesiredBodyShape] = useState(String(savedAnswers.desiredBodyShape ?? "Athletic"));
  const [goal, setGoal] = useState(profile?.primary_goal ?? "Build Muscle");
  const [role, setRole] = useState(String(savedAnswers.role ?? "Busy professional"));
  const [level, setLevel] = useState(profile?.fitness_level ?? "Beginner");
  const [equipment, setEquipment] = useState<string[]>(Array.isArray(savedAnswers.equipment) ? savedAnswers.equipment as string[] : ["No Equipment"]);
  const [days, setDays] = useState(Number(savedAnswers.days ?? 3));
  const [duration, setDuration] = useState(String(savedAnswers.duration ?? "20-30 min"));
  const [pastExperience, setPastExperience] = useState(String(savedAnswers.pastExperience ?? ""));
  const [statementOne, setStatementOne] = useState(String(savedAnswers.statementOne ?? ""));
  const [statementTwo, setStatementTwo] = useState(String(savedAnswers.statementTwo ?? ""));
  const [timeline, setTimeline] = useState(String(savedAnswers.timeline ?? "12 weeks"));
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>(Array.isArray(savedAnswers.feelings) ? savedAnswers.feelings as string[] : ["Confident"]);
  const [reward, setReward] = useState(String(savedAnswers.reward ?? "mirror"));

  const screen = onboardingScreens[step];
  const progress = (step + 1) / onboardingScreens.length;
  const age = Math.max(13, new Date().getFullYear() - birthYear);
  const tdee = useMemo(() => calculateTdee({ age, gender, goal, height, weight, weightUnit }), [age, gender, goal, height, weight, weightUnit]);
  const matchScore = useMemo(() => {
    const equipmentBoost = equipment.includes("No Equipment") ? 8 : equipment.includes("Full Gym") ? 14 : 11;
    const consistencyBoost = Math.min(18, days * 3);
    return Math.min(97, 62 + equipmentBoost + consistencyBoost + (selectedFeelings.length * 2));
  }, [days, equipment, selectedFeelings.length]);

  if (!session) {
    return <Redirect href="/auth/sign-in" />;
  }

  function toggleMulti(value: string, list: string[], setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function canContinue() {
    if (screen === "focus") return Boolean(focusArea);
    if (screen === "currentShape") return Boolean(currentBodyShape);
    if (screen === "desiredShape") return Boolean(desiredBodyShape);
    if (screen === "goal") return Boolean(goal);
    if (screen === "role") return Boolean(role);
    if (screen === "level") return Boolean(level);
    if (screen === "pastExperience") return Boolean(pastExperience);
    if (screen === "statementOne") return Boolean(statementOne);
    if (screen === "statementTwo") return Boolean(statementTwo);
    if (screen === "timeline") return Boolean(timeline);
    if (screen === "feelings") return selectedFeelings.length > 0;
    if (screen === "metrics") return Number(weight) > 0 && Number(height) > 0 && Number(targetWeight) > 0;
    return true;
  }

  function buildOnboardingPayload() {
    const dailyProteinTarget = Math.round((tdee * 0.3) / 4);
    const dailyCarbsTarget = Math.round((tdee * 0.4) / 4);
    const dailyFatTarget = Math.round((tdee * 0.3) / 9);

    return {
      displayName: name.trim() || "Athlete",
      age,
      gender,
      weightKg: weightUnit === "lbs" ? Number(weight) * 0.453592 : Number(weight),
      heightCm: Number(height) || 175,
      primaryGoal: goal,
      fitnessLevel: level,
      activityLevel: days >= 5 ? "Very active" : days >= 3 ? "Moderately active" : "Lightly active",
      dietaryPreference: "Standard",
      dailyCalorieTarget: tdee,
      dailyProteinTarget,
      dailyCarbsTarget,
      dailyFatTarget,
      answers: {
        birthYear,
        focusArea,
        currentBodyShape,
        desiredBodyShape,
        goal,
        role,
        level,
        equipment,
        days,
        duration,
        pastExperience,
        statementOne,
        statementTwo,
        matchScore,
        timeline,
        feelings: selectedFeelings,
        reward,
        targetWeight,
        onboardingStyle: "premium-visual-v2",
        source: isEditing ? "edit-profile" : "signup"
      }
    };
  }

  async function finish() {
    setError(null);
    setIsSaving(true);
    try {
      const userId = session?.user?.id;
      await Promise.all([
        saveOnboardingProfile(buildOnboardingPayload()),
        new Promise((resolve) => setTimeout(resolve, 1200))
      ]);
      await markLocalOnboardingComplete();
      await refreshProfile();
      try {
        if (userId) await generatePersonalizedPlan(userId);
      } catch {
        // Plan generation must never block entry into the app.
      }
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save onboarding. Please try again.");
      setIsSaving(false);
    }
  }

  function next() {
    if (!canContinue()) {
      setError("Complete this step to continue");
      return;
    }
    setError(null);
    if (screen === "notifications") {
      void finish();
      return;
    }
    setStep((current) => Math.min(onboardingScreens.length - 1, current + 1));
  }

  async function skipOnboarding() {
    setError(null);
    try {
      await saveOnboardingProfile(buildOnboardingPayload());
      await markLocalOnboardingComplete();
      await refreshProfile();
    } catch {
      try {
        await markLocalOnboardingComplete();
      } catch {
        // Skip should never block navigation.
      }
    } finally {
      router.replace("/(tabs)");
    }
  }

  async function enableNotificationsAndFinish() {
    try {
      await Promise.all([
        setNotificationPreference("workout", true),
        setNotificationPreference("streak", true)
      ]);
    } catch {
      // Permission can be denied; onboarding still completes.
    }
    await finish();
  }

  if (isSaving) {
    return <GenerationScreen matchScore={matchScore} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboard}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.74} style={styles.navButton} onPress={() => step > 0 ? setStep((current) => current - 1) : router.back()}>
            <Ionicons name="chevron-back" size={24} color="#0B0B0D" />
          </TouchableOpacity>
          <View style={styles.progressRail}>
            {[0, 1, 2].map((item) => (
              <View key={item} style={styles.progressSegment}>
                <View style={[styles.progressSegmentFill, { width: `${getSegmentProgress(progress, item) * 100}%` }]} />
              </View>
            ))}
          </View>
          {screen !== "notifications" ? (
            <TouchableOpacity activeOpacity={0.74} style={styles.skipButton} onPress={() => void skipOnboarding()}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          ) : <View style={styles.skipButton} />}
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.watermark}>F</Text>
          {screen === "welcome" ? (
            <HeroIntro onNameChange={setName} name={name} />
          ) : null}

          {screen === "focus" ? (
            <Question title="What's your focus area?" accent="focus" image={focusImage}>
              <View style={styles.optionStackOverlay}>
                {focusAreas.map((item) => <WhiteOption key={item} title={item} selected={focusArea === item} onPress={() => setFocusArea(item)} />)}
              </View>
            </Question>
          ) : null}

          {screen === "currentShape" ? (
            <Question title="What's your current body shape?" accent="current">
              <View style={styles.largeCardStack}>
                {bodyShapes.map((item, index) => (
                  <ShapeCard key={item} title={item} selected={currentBodyShape === item} index={index} onPress={() => setCurrentBodyShape(item)} />
                ))}
              </View>
            </Question>
          ) : null}

          {screen === "desiredShape" ? (
            <Question title="What's your desired body shape?" accent="desired">
              <View style={styles.bodyPreview}>
                <Ionicons name="body" size={118} color="#101014" />
                <Text style={styles.bodyPreviewText}>{desiredBodyShape}</Text>
              </View>
              <View style={styles.scaleRow}>
                {desiredShapes.map((item) => (
                  <TouchableOpacity key={item} activeOpacity={0.78} style={[styles.scaleDot, desiredBodyShape === item && styles.scaleDotActive]} onPress={() => setDesiredBodyShape(item)} />
                ))}
              </View>
              <View style={styles.helperCard}>
                <Text style={styles.helperKicker}>FITNEO AI</Text>
                <Text style={styles.helperTitle}>7%~12% body recomposition target</Text>
                <Text style={styles.helperCopy}>Practical, progressive, and friendly for your current level.</Text>
              </View>
            </Question>
          ) : null}

          {screen === "goal" ? (
            <Question title="What's your main goal?" accent="goal">
              <CardGrid options={goals} selected={goal} onSelect={setGoal} icons={["trending-down", "barbell", "heart", "football", "walk"]} />
            </Question>
          ) : null}

          {screen === "role" ? (
            <Question title="What best describes you?" accent="you">
              <CardGrid options={roles} selected={role} onSelect={setRole} icons={["school", "briefcase", "people", "trophy", "rocket", "person"]} />
            </Question>
          ) : null}

          {screen === "level" ? (
            <Question title="What's your training level?" accent="level">
              {levels.map((item) => (
                <WhiteOption key={item} title={item} subtitle={getLevelSubtitle(item)} selected={level === item} onPress={() => setLevel(item)} />
              ))}
              <View style={styles.selectorBlock}>
                <Text style={styles.selectorTitle}>Available equipment</Text>
                {equipmentOptions.map((item) => (
                  <WhiteOption key={item} title={item} selected={equipment.includes(item)} onPress={() => toggleMulti(item, equipment, setEquipment)} compact />
                ))}
              </View>
            </Question>
          ) : null}

          {screen === "microWorkout" ? (
            <Interstitial
              icon="flash"
              image={successImage}
              title="No stress. We can start with tiny wins."
              copy="Even 7 minutes counts. FITNEO will scale intensity only when your consistency catches up."
            />
          ) : null}

          {screen === "birthYear" ? (
            <Question title="What's your birth year?" accent="birth">
              <View style={styles.helperCard}>
                <Text style={styles.helperKicker}>SAFETY CALIBRATION</Text>
                <Text style={styles.helperCopy}>This helps us tailor workouts to your body's current capabilities.</Text>
              </View>
              <YearDrum value={birthYear} onChange={setBirthYear} />
            </Question>
          ) : null}

          {screen === "pastExperience" ? (
            <Question title="Have you trained before?" accent="trained">
              {["Never seriously", "A few times", "I train sometimes", "I am consistent"].map((item) => (
                <WhiteOption key={item} title={item} selected={pastExperience === item} onPress={() => setPastExperience(item)} />
              ))}
            </Question>
          ) : null}

          {screen === "statementOne" ? (
            <Question title="Which sounds most like you?" accent="you">
              {["I get busy and miss workouts", "I start strong then stop", "I need structure", "I only need better exercises"].map((item) => (
                <WhiteOption key={item} title={item} selected={statementOne === item} onPress={() => setStatementOne(item)} />
              ))}
            </Question>
          ) : null}

          {screen === "statementTwo" ? (
            <Question title="What usually blocks progress?" accent="progress">
              {["Boring plans", "No equipment", "Low energy", "Unclear nutrition", "No accountability"].map((item) => (
                <WhiteOption key={item} title={item} selected={statementTwo === item} onPress={() => setStatementTwo(item)} />
              ))}
            </Question>
          ) : null}

          {screen === "matchingScore" ? (
            <ScoreScreen score={matchScore} goal={goal} level={level} />
          ) : null}

          {screen === "timeline" ? (
            <Question title="When do you want to feel the change?" accent="when">
              {timelines.map((item) => <WhiteOption key={item} title={item} selected={timeline === item} onPress={() => setTimeline(item)} />)}
            </Question>
          ) : null}

          {screen === "feelings" ? (
            <Question title="How should your plan make you feel?" accent="feel">
              <View style={styles.wrapGrid}>
                {feelings.map((item) => (
                  <TouchableOpacity key={item} activeOpacity={0.78} style={[styles.feelingChip, selectedFeelings.includes(item) && styles.feelingChipActive]} onPress={() => toggleMulti(item, selectedFeelings, setSelectedFeelings)}>
                    <Text style={[styles.feelingText, selectedFeelings.includes(item) && styles.feelingTextActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Question>
          ) : null}

          {screen === "reward" ? (
            <Question title="Pick your reward vision" accent="reward">
              <View style={styles.rewardGrid}>
                {rewards.map((item) => (
                  <TouchableOpacity key={item.id} activeOpacity={0.78} style={[styles.rewardCard, reward === item.id && styles.rewardCardActive]} onPress={() => setReward(item.id)}>
                    <Image source={{ uri: item.image }} style={styles.rewardImage} />
                    <Text style={styles.rewardTitle}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Question>
          ) : null}

          {screen === "metrics" ? (
            <Question title="Let's size your plan accurately" accent="metrics">
              <UnitToggle value={weightUnit} values={["kg", "lbs"]} onChange={setWeightUnit} />
              <View style={styles.metricGrid}>
                <MetricInput label="Current weight" value={weight} onChangeText={setWeight} unit={weightUnit} />
                <MetricInput label="Target weight" value={targetWeight} onChangeText={setTargetWeight} unit={weightUnit} />
              </View>
              <MetricInput label="Height" value={height} onChangeText={setHeight} unit="cm" />
              <View style={styles.helperCard}>
                <Text style={styles.helperKicker}>Reasonable target</Text>
                <Text style={styles.helperCopy}>Estimated daily target: {tdee.toLocaleString()} kcal with progressive training.</Text>
              </View>
            </Question>
          ) : null}

          {screen === "ready" ? (
            <Interstitial
              icon="sparkles"
              image={successImage}
              title={`For ${gender === "female" ? "women" : "men"} in their ${Math.floor(age / 10) * 10}s`}
              copy={`With your ${goal.toLowerCase()} goal, ${level.toLowerCase()} level, and ${focusArea.toLowerCase()} focus, FITNEO will build a balanced plan that feels personal instead of random.`}
            />
          ) : null}

          {screen === "notifications" ? (
            <NotificationScreen />
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity activeOpacity={0.86} disabled={!canContinue()} style={[styles.nextButton, !canContinue() && styles.nextButtonDisabled]} onPress={screen === "notifications" ? () => void enableNotificationsAndFinish() : next}>
            <Text style={styles.nextText}>{screen === "welcome" ? "I'M READY" : screen === "notifications" ? "Allow and build my plan" : "Next"}</Text>
          </TouchableOpacity>
          {screen === "notifications" ? (
            <TouchableOpacity activeOpacity={0.74} onPress={() => void finish()} style={styles.notNowButton}>
              <Text style={styles.notNowText}>Not now</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function HeroIntro({ name, onNameChange }: { name: string; onNameChange: (value: string) => void }) {
  return (
    <View style={styles.welcomeWrap}>
      <View style={styles.coachBubble}>
        <Image source={{ uri: coachImage }} style={styles.coachImage} />
      </View>
      <Text style={styles.welcomeEmoji}>👋</Text>
      <Text style={styles.welcomeTitle}>Hello!</Text>
      <Text style={styles.welcomeCopy}>
        I'm your personal coach. Answer a few sharp questions and I’ll tailor a plan that feels built for you.
      </Text>
      <TextInput
        placeholder="What should FITNEO call you?"
        placeholderTextColor="#9CA3AF"
        style={styles.nameInput}
        value={name}
        onChangeText={onNameChange}
        underlineColorAndroid="transparent"
      />
    </View>
  );
}

function Question({ accent, children, image, title }: { accent: string; children: ReactNode; image?: string; title: string }) {
  const parts = title.split(accent);
  return (
    <View style={styles.questionWrap}>
      <Text style={styles.questionTitle}>
        {parts[0]}
        <Text style={styles.accentWord}>{accent}</Text>
        {parts.slice(1).join(accent)}
      </Text>
      {image ? <Image source={{ uri: image }} style={styles.questionImage} /> : null}
      <View style={styles.questionBody}>{children}</View>
    </View>
  );
}

function WhiteOption({ compact, onPress, selected, subtitle, title }: { compact?: boolean; onPress: () => void; selected: boolean; subtitle?: string; title: string }) {
  return (
    <TouchableOpacity activeOpacity={0.78} onPress={onPress} style={[styles.whiteOption, compact && styles.whiteOptionCompact, selected && styles.whiteOptionActive]}>
      <View style={styles.optionTextBlock}>
        <Text style={[styles.whiteOptionTitle, selected && styles.whiteOptionTitleActive]}>{title}</Text>
        {subtitle ? <Text style={styles.whiteOptionSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={22} color={selected ? "#0A84FF" : "#CBD5E1"} />
    </TouchableOpacity>
  );
}

function ShapeCard({ index, onPress, selected, title }: { index: number; onPress: () => void; selected: boolean; title: string }) {
  const icons = ["accessibility", "body", "walk", "barbell"] as const;
  return (
    <TouchableOpacity activeOpacity={0.78} onPress={onPress} style={[styles.shapeCard, selected && styles.shapeCardActive]}>
      <Text style={styles.shapeTitle}>{title}</Text>
      <View style={styles.shapeIcon}>
        <Ionicons name={icons[index] ?? "body"} size={56} color={selected ? "#0A84FF" : "#111827"} />
      </View>
    </TouchableOpacity>
  );
}

function CardGrid({ icons, onSelect, options, selected }: { icons: Array<keyof typeof Ionicons.glyphMap>; onSelect: (value: string) => void; options: string[]; selected: string }) {
  return (
    <View style={styles.cardGrid}>
      {options.map((item, index) => (
        <TouchableOpacity key={item} activeOpacity={0.78} style={[styles.gridCard, selected === item && styles.gridCardActive]} onPress={() => onSelect(item)}>
          <Ionicons name={icons[index] ?? "sparkles"} size={24} color={selected === item ? "#FFFFFF" : "#0A84FF"} />
          <Text style={[styles.gridCardText, selected === item && styles.gridCardTextActive]}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Interstitial({ copy, icon, image, title }: { copy: string; icon: keyof typeof Ionicons.glyphMap; image: string; title: string }) {
  return (
    <View style={styles.interstitial}>
      <Image source={{ uri: image }} style={styles.interstitialImage} />
      <View style={styles.interstitialIcon}>
        <Ionicons name={icon} size={24} color="#0A84FF" />
      </View>
      <Text style={styles.interstitialTitle}>{title}</Text>
      <Text style={styles.interstitialCopy}>{copy}</Text>
    </View>
  );
}

function YearDrum({ onChange, value }: { onChange: (value: number) => void; value: number }) {
  const scrollRef = useRef<ScrollView>(null);
  const didInitialScroll = useRef(false);
  const lastScrolledYear = useRef(value);
  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 73 }, (_, index) => currentYear - 13 - index),
    [currentYear]
  );
  const selectedIndex = Math.max(0, years.findIndex((year) => year === value));

  useEffect(() => {
    if (didInitialScroll.current) return;
    didInitialScroll.current = true;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ animated: false, y: Math.max(0, selectedIndex * 74 - 148) });
    }, 50);
    return () => clearTimeout(timer);
  }, [selectedIndex]);

  function snapToNearest(offsetY: number) {
    const nextIndex = Math.max(0, Math.min(years.length - 1, Math.round(offsetY / 74)));
    onChange(years[nextIndex]);
  }

  function selectWhileScrolling(offsetY: number) {
    const nextIndex = Math.max(0, Math.min(years.length - 1, Math.round(offsetY / 74)));
    const nextYear = years[nextIndex];
    if (nextYear !== lastScrolledYear.current) {
      lastScrolledYear.current = nextYear;
      onChange(nextYear);
    }
  }

  return (
    <View style={styles.yearWrap}>
      <View pointerEvents="none" style={styles.yearCenterRail} />
      <ScrollView
        ref={scrollRef}
        decelerationRate="fast"
        nestedScrollEnabled
        onMomentumScrollEnd={(event) => snapToNearest(event.nativeEvent.contentOffset.y)}
        onScroll={(event) => selectWhileScrolling(event.nativeEvent.contentOffset.y)}
        onScrollEndDrag={(event) => snapToNearest(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={32}
        showsVerticalScrollIndicator={false}
        snapToInterval={74}
        style={styles.yearScroller}
        contentContainerStyle={styles.yearScrollContent}
      >
        {years.map((year) => (
          <TouchableOpacity key={year} activeOpacity={0.78} onPress={() => onChange(year)} style={[styles.yearRow, year === value && styles.yearRowActive]}>
            <Text style={[styles.yearText, year === value && styles.yearTextActive]}>{year}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function ScoreScreen({ goal, level, score }: { goal: string; level: string; score: number }) {
  return (
    <View style={styles.scoreScreen}>
      <View style={styles.scoreOrb}>
        <Text style={styles.scoreNumber}>{score}%</Text>
        <Text style={styles.scoreLabel}>MATCH</Text>
      </View>
      <Text style={styles.scoreTitle}>Great fit. We can build this.</Text>
      <Text style={styles.scoreCopy}>Your {goal.toLowerCase()} goal and {level.toLowerCase()} starting point match a progressive plan with visible weekly wins.</Text>
      <View style={styles.scoreList}>
        {["Smart exercise selection", "Equipment-safe workouts", "Calories and macros calibrated"].map((item) => (
          <View key={item} style={styles.scoreItem}>
            <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
            <Text style={styles.scoreItemText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function MetricInput({ label, onChangeText, unit, value }: { label: string; onChangeText: (value: string) => void; unit: string; value: string }) {
  return (
    <View style={styles.metricInputWrap}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricInputRow}>
        <TextInput keyboardType="decimal-pad" value={value} onChangeText={onChangeText} style={styles.metricInput} underlineColorAndroid="transparent" />
        <Text style={styles.metricUnit}>{unit}</Text>
      </View>
    </View>
  );
}

function UnitToggle({ onChange, value, values }: { onChange: (next: string) => void; value: string; values: string[] }) {
  return (
    <View style={styles.unitToggle}>
      {values.map((item) => (
        <TouchableOpacity key={item} activeOpacity={0.78} onPress={() => onChange(item)} style={[styles.unitOption, value === item && styles.unitOptionActive]}>
          <Text style={[styles.unitText, value === item && styles.unitTextActive]}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function NotificationScreen() {
  return (
    <View style={styles.notificationScreen}>
      <View style={styles.notificationIcon}>
        <Ionicons name="notifications" size={34} color="#0A84FF" />
      </View>
      <Text style={styles.interstitialTitle}>Want me to keep you on track?</Text>
      <Text style={styles.interstitialCopy}>FITNEO can remind you before workouts, protect your streak, and nudge you when momentum slips.</Text>
      <View style={styles.scoreList}>
        {["Workout reminders", "Streak alerts", "AI daily check-ins"].map((item) => (
          <View key={item} style={styles.scoreItem}>
            <Ionicons name="checkmark-circle" size={18} color="#0A84FF" />
            <Text style={styles.scoreItemText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function GenerationScreen({ matchScore }: { matchScore: number }) {
  return (
    <SafeAreaView style={styles.generationSafe}>
      <View style={styles.generationCenter}>
        <View style={styles.generationLogo}>
          <Ionicons name="sparkles" size={34} color="#FFFFFF" />
        </View>
        <Text style={styles.generationKicker}>FITNEO AI CALIBRATION</Text>
        <Text style={styles.generationTitle}>Building your personal plan</Text>
        <View style={styles.generationCard}>
          {[
            "Reading onboarding answers",
            "Selecting suitable workout style",
            "Calibrating calories and macros",
            "Preparing your plan"
          ].map((item, index) => (
            <View key={item} style={styles.generationRow}>
              <Ionicons name={index < 3 ? "checkmark-circle" : "radio-button-on"} size={17} color={index < 3 ? "#FFFFFF" : "#7DD3FC"} />
              <Text style={styles.generationStep}>{item}</Text>
            </View>
          ))}
        </View>
        <View style={styles.generationTrack}>
          <View style={[styles.generationFill, { width: `${matchScore}%` }]} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function getLevelSubtitle(level: string) {
  if (level === "Beginner") return "Simple sessions, form-first progress.";
  if (level === "Intermediate") return "More structure, supersets, and weekly push.";
  return "Performance blocks with harder intensity.";
}

function getSegmentProgress(progress: number, segment: number) {
  const start = segment / 3;
  const end = (segment + 1) / 3;
  if (progress >= end) return 1;
  if (progress <= start) return 0;
  return (progress - start) / (end - start);
}

function calculateTdee({
  age,
  gender,
  goal,
  height,
  weight,
  weightUnit
}: {
  age: number;
  gender: string;
  goal: string;
  height: string;
  weight: string;
  weightUnit: string;
}) {
  const weightKg = weightUnit === "lbs" ? Number(weight) * 0.453592 : Number(weight);
  const heightCm = Number(height);
  const bmr = gender === "male" ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5 : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  const goalMultiplier = goal === "Lose Weight" ? 0.85 : goal === "Build Muscle" ? 1.1 : 1;
  return Math.max(1200, Math.round(bmr * 1.45 * goalMultiplier));
}

const styles = StyleSheet.create({
  safe: { backgroundColor: "#F5F7FF", flex: 1 },
  keyboard: { flex: 1 },
  header: { alignItems: "center", flexDirection: "row", gap: 12, paddingHorizontal: 24, paddingTop: 6 },
  navButton: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  progressRail: { flex: 1, flexDirection: "row", gap: 8 },
  progressSegment: { backgroundColor: "#E5E7EB", borderRadius: 999, flex: 1, height: 4, overflow: "hidden" },
  progressSegmentFill: { backgroundColor: "#0A84FF", borderRadius: 999, height: 4 },
  skipButton: { alignItems: "flex-end", justifyContent: "center", minWidth: 44 },
  skipText: { color: "#94A3B8", fontSize: 14, fontWeight: "800" },
  content: { flexGrow: 1, paddingBottom: 120, paddingHorizontal: 30, paddingTop: 28 },
  watermark: { color: "#E8F0FF", fontSize: 170, fontWeight: "900", left: -8, lineHeight: 170, position: "absolute", top: 54, zIndex: -1 },
  footer: { backgroundColor: "#F5F7FF", bottom: 0, left: 0, paddingBottom: 24, paddingHorizontal: 30, paddingTop: 12, position: "absolute", right: 0 },
  nextButton: { alignItems: "center", backgroundColor: "#050505", borderRadius: 999, justifyContent: "center", minHeight: 62, shadowColor: "#000", shadowOpacity: 0.16, shadowRadius: 18 },
  nextButtonDisabled: { backgroundColor: "#C9CDD4" },
  nextText: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", letterSpacing: 0.4 },
  notNowButton: { alignItems: "center", marginTop: 12 },
  notNowText: { color: "#64748B", fontSize: 14, fontWeight: "800" },
  welcomeWrap: { flex: 1, justifyContent: "center", minHeight: 540 },
  coachBubble: { alignSelf: "flex-end", borderRadius: 55, height: 110, overflow: "hidden", width: 110 },
  coachImage: { height: "100%", width: "100%" },
  welcomeEmoji: { fontSize: 26, marginTop: 28 },
  welcomeTitle: { color: "#050505", fontSize: 54, fontWeight: "900", letterSpacing: -2, marginTop: 8 },
  welcomeCopy: { color: "#111827", fontSize: 25, fontWeight: "500", lineHeight: 34, marginTop: 14 },
  nameInput: { backgroundColor: "#FFFFFF", borderRadius: 22, color: "#0F172A", fontSize: 16, fontWeight: "800", marginTop: 24, minHeight: 58, paddingHorizontal: 18, shadowColor: "#94A3B8", shadowOpacity: 0.12, shadowRadius: 18 },
  questionWrap: { minHeight: 540 },
  questionTitle: { color: "#050505", fontSize: 40, fontWeight: "900", letterSpacing: -1.4, lineHeight: 48, marginBottom: 26 },
  accentWord: { color: "#0A84FF" },
  questionImage: { alignSelf: "flex-end", borderRadius: 28, height: 250, opacity: 0.94, position: "absolute", right: -70, top: 108, width: 230 },
  questionBody: { gap: 14 },
  optionStackOverlay: { marginTop: 118, width: "64%" },
  whiteOption: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "rgba(10,132,255,0)", borderRadius: 20, borderWidth: 2, flexDirection: "row", gap: 12, justifyContent: "space-between", minHeight: 74, paddingHorizontal: 20, shadowColor: "#94A3B8", shadowOpacity: 0.12, shadowRadius: 18 },
  whiteOptionCompact: { minHeight: 56 },
  whiteOptionActive: { borderColor: "#0A84FF", shadowColor: "#0A84FF", shadowOpacity: 0.2 },
  optionTextBlock: { flex: 1 },
  whiteOptionTitle: { color: "#0F172A", fontSize: 21, fontWeight: "800" },
  whiteOptionTitleActive: { color: "#0A84FF" },
  whiteOptionSubtitle: { color: "#64748B", fontSize: 13, fontWeight: "600", lineHeight: 18, marginTop: 4 },
  largeCardStack: { gap: 16 },
  shapeCard: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "transparent", borderRadius: 22, borderWidth: 2, flexDirection: "row", justifyContent: "space-between", minHeight: 112, overflow: "hidden", paddingLeft: 24, shadowColor: "#CBD5E1", shadowOpacity: 0.24, shadowRadius: 20 },
  shapeCardActive: { borderColor: "#0A84FF" },
  shapeTitle: { color: "#050505", fontSize: 26, fontWeight: "900" },
  shapeIcon: { alignItems: "center", backgroundColor: "#F1F5F9", height: 112, justifyContent: "center", width: 130 },
  bodyPreview: { alignItems: "center", gap: 10, justifyContent: "center", marginTop: 8 },
  bodyPreviewText: { color: "#0A84FF", fontSize: 18, fontWeight: "900" },
  scaleRow: { backgroundColor: "#EAF1FF", borderRadius: 999, flexDirection: "row", justifyContent: "space-between", marginTop: 24, padding: 10 },
  scaleDot: { backgroundColor: "#BFD7FF", borderRadius: 10, height: 20, width: 20 },
  scaleDotActive: { backgroundColor: "#0A84FF", transform: [{ scale: 1.45 }] },
  helperCard: { backgroundColor: "#EAF4FF", borderRadius: 22, gap: 5, marginTop: 20, padding: 20 },
  helperKicker: { color: "#0A84FF", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  helperTitle: { color: "#16A34A", fontSize: 19, fontWeight: "900" },
  helperCopy: { color: "#334155", fontSize: 16, lineHeight: 23 },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridCard: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 22, gap: 12, minHeight: 120, padding: 18, width: "47%" },
  gridCardActive: { backgroundColor: "#0A84FF" },
  gridCardText: { color: "#111827", fontSize: 15, fontWeight: "900", textAlign: "center" },
  gridCardTextActive: { color: "#FFFFFF" },
  selectorBlock: { gap: 10, marginTop: 12 },
  selectorTitle: { color: "#64748B", fontSize: 13, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  interstitial: { alignItems: "center", flex: 1, justifyContent: "center", minHeight: 540 },
  interstitialImage: { borderRadius: 44, height: 220, marginBottom: 28, width: 220 },
  interstitialIcon: { alignItems: "center", backgroundColor: "#EAF4FF", borderRadius: 24, height: 48, justifyContent: "center", marginBottom: 16, width: 48 },
  interstitialTitle: { color: "#050505", fontSize: 34, fontWeight: "900", letterSpacing: -1, lineHeight: 40, textAlign: "center" },
  interstitialCopy: { color: "#475569", fontSize: 18, lineHeight: 27, marginTop: 16, textAlign: "center" },
  yearWrap: { alignItems: "center", height: 370, justifyContent: "center", marginTop: 18, overflow: "hidden", position: "relative" },
  yearScroller: { width: "100%" },
  yearScrollContent: { alignItems: "center", paddingVertical: 148 },
  yearCenterRail: { backgroundColor: "#D7E9FF", borderColor: "#0A84FF", borderRadius: 999, borderWidth: 2, height: 66, position: "absolute", width: "92%", zIndex: 0 },
  yearRow: { alignItems: "center", borderRadius: 999, minHeight: 74, justifyContent: "center", width: "92%", zIndex: 1 },
  yearRowActive: { backgroundColor: "transparent" },
  yearText: { color: "#CBD5E1", fontSize: 38, fontWeight: "900" },
  yearTextActive: { color: "#0A84FF", fontSize: 42 },
  scoreScreen: { alignItems: "center", flex: 1, justifyContent: "center", minHeight: 540 },
  scoreOrb: { alignItems: "center", backgroundColor: "#0A84FF", borderRadius: 72, height: 144, justifyContent: "center", shadowColor: "#0A84FF", shadowOpacity: 0.36, shadowRadius: 28, width: 144 },
  scoreNumber: { color: "#FFFFFF", fontSize: 42, fontWeight: "900" },
  scoreLabel: { color: "rgba(255,255,255,0.82)", fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  scoreTitle: { color: "#050505", fontSize: 34, fontWeight: "900", letterSpacing: -1, lineHeight: 40, marginTop: 28, textAlign: "center" },
  scoreCopy: { color: "#475569", fontSize: 17, lineHeight: 25, marginTop: 12, textAlign: "center" },
  scoreList: { gap: 12, marginTop: 24, width: "100%" },
  scoreItem: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 18, flexDirection: "row", gap: 10, minHeight: 54, paddingHorizontal: 16 },
  scoreItemText: { color: "#111827", flex: 1, fontSize: 16, fontWeight: "800" },
  wrapGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  feelingChip: { backgroundColor: "#FFFFFF", borderColor: "transparent", borderRadius: 999, borderWidth: 2, paddingHorizontal: 18, paddingVertical: 14 },
  feelingChipActive: { backgroundColor: "#0A84FF", borderColor: "#0A84FF" },
  feelingText: { color: "#111827", fontSize: 15, fontWeight: "900" },
  feelingTextActive: { color: "#FFFFFF" },
  rewardGrid: { gap: 14 },
  rewardCard: { backgroundColor: "#FFFFFF", borderColor: "transparent", borderRadius: 24, borderWidth: 2, minHeight: 116, overflow: "hidden" },
  rewardCardActive: { borderColor: "#0A84FF" },
  rewardImage: { height: 126, width: "100%" },
  rewardTitle: { color: "#111827", fontSize: 18, fontWeight: "900", padding: 16 },
  unitToggle: { alignSelf: "center", backgroundColor: "#ECEFF4", borderRadius: 999, flexDirection: "row", marginBottom: 18, padding: 4 },
  unitOption: { borderRadius: 999, minWidth: 82, paddingHorizontal: 20, paddingVertical: 11 },
  unitOptionActive: { backgroundColor: "#050505" },
  unitText: { color: "#94A3B8", fontSize: 18, fontWeight: "900", textAlign: "center" },
  unitTextActive: { color: "#FFFFFF" },
  metricGrid: { flexDirection: "row", gap: 12 },
  metricInputWrap: { backgroundColor: "#FFFFFF", borderRadius: 22, flex: 1, gap: 8, padding: 16 },
  metricLabel: { color: "#64748B", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  metricInputRow: { alignItems: "flex-end", flexDirection: "row", gap: 5 },
  metricInput: { color: "#050505", flex: 1, fontSize: 32, fontWeight: "900", padding: 0 },
  metricUnit: { color: "#0A84FF", fontSize: 16, fontWeight: "900", paddingBottom: 5 },
  notificationScreen: { alignItems: "center", flex: 1, justifyContent: "center", minHeight: 540 },
  notificationIcon: { alignItems: "center", backgroundColor: "#EAF4FF", borderRadius: 44, height: 88, justifyContent: "center", marginBottom: 22, width: 88 },
  error: { color: "#EF4444", fontSize: 13, fontWeight: "800", marginTop: 12, textAlign: "center" },
  generationSafe: { backgroundColor: "#0566FF", flex: 1 },
  generationCenter: { alignItems: "center", flex: 1, justifyContent: "center", paddingHorizontal: 34 },
  generationLogo: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 38, height: 76, justifyContent: "center", marginBottom: 24, width: 76 },
  generationKicker: { color: "#BFE7FF", fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  generationTitle: { color: "#FFFFFF", fontSize: 30, fontWeight: "900", lineHeight: 36, marginTop: 10, textAlign: "center" },
  generationCard: { backgroundColor: "rgba(0,0,0,0.18)", borderColor: "rgba(255,255,255,0.20)", borderRadius: 24, borderWidth: 1, gap: 14, marginTop: 28, padding: 20, width: "100%" },
  generationRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  generationStep: { color: "#FFFFFF", flex: 1, fontSize: 15, fontWeight: "800" },
  generationTrack: { backgroundColor: "rgba(255,255,255,0.20)", borderRadius: 999, height: 6, marginTop: 26, overflow: "hidden", width: "100%" },
  generationFill: { backgroundColor: "#7DD3FC", borderRadius: 999, height: 6 }
});
