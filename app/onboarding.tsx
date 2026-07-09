import { Ionicons } from "@expo/vector-icons";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { ReactNode } from "react";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard, TouchableCard } from "@/components/ScreenKit";
import { useAuth } from "@/context/AuthContext";
import { saveOnboardingProfile } from "@/lib/api";
import { colors, radii } from "@/lib/theme";

const goals = ["Lose Weight", "Build Muscle", "Improve Endurance", "Athletic Performance", "Stay Active"];
const levels = ["Beginner", "Intermediate", "Advanced"];
const equipmentOptions = ["No Equipment", "Dumbbells", "Full Gym", "Yoga & Mobility"];
const trainingStyles = ["Strength Training", "HIIT", "Cardio", "Core & Abs", "Mobility", "Mixed"];
const injuries = ["No injuries or limitations", "Lower back", "Knee", "Shoulder", "Hip", "Wrist"];
const dietOptions = ["Standard", "High Protein", "Vegetarian", "Vegan", "Mediterranean", "Keto"];
const coachOptions = ["Supportive", "Motivational", "Data-driven", "Push me hard", "Mix of everything"];

export default function OnboardingScreen() {
  const { profile, markLocalOnboardingComplete, refreshProfile, session } = useAuth();
  const params = useLocalSearchParams<{ mode?: string }>();
  const isEditing = params.mode === "edit";
  const savedAnswers = profile?.onboarding_answers ?? {};
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(profile?.display_name ?? "");
  const [age, setAge] = useState(String(profile?.age ?? 25));
  const [gender, setGender] = useState(profile?.gender ?? "male");
  const [weight, setWeight] = useState(String(profile?.weight_kg ?? 70));
  const [weightUnit, setWeightUnit] = useState("kg");
  const [height, setHeight] = useState(String(profile?.height_cm ?? 175));
  const [goal, setGoal] = useState(profile?.primary_goal ?? "Build Muscle");
  const [level, setLevel] = useState(profile?.fitness_level ?? "Beginner");
  const [equipment, setEquipment] = useState<string[]>(Array.isArray(savedAnswers.equipment) ? savedAnswers.equipment as string[] : ["Dumbbells"]);
  const [days, setDays] = useState(Number(savedAnswers.days ?? 3));
  const [duration, setDuration] = useState(String(savedAnswers.duration ?? "30-45 min"));
  const [selectedStyles, setSelectedStyles] = useState<string[]>(Array.isArray(savedAnswers.trainingStyles) ? savedAnswers.trainingStyles as string[] : ["Strength Training"]);
  const [activity, setActivity] = useState(profile?.activity_level ?? "Moderately active");
  const [recovery, setRecovery] = useState(String(savedAnswers.recovery ?? "Average sleep and recovery"));
  const [selectedInjuries, setSelectedInjuries] = useState<string[]>(Array.isArray(savedAnswers.injuries) ? savedAnswers.injuries as string[] : ["No injuries or limitations"]);
  const [diet, setDiet] = useState(profile?.dietary_preference ?? "Standard");
  const [coach, setCoach] = useState(String(savedAnswers.coach ?? "Motivational"));

  const totalSteps = 8;
  const progress = (step + 1) / totalSteps;
  const tdee = useMemo(() => calculateTdee({ age, gender, weight, weightUnit, height, activity, goal }), [activity, age, gender, goal, height, weight, weightUnit]);

  if (!session) {
    return <Redirect href="/auth/sign-in" />;
  }

  function toggleMulti(value: string, list: string[], setter: (next: string[]) => void, exclusive?: string) {
    if (exclusive && value === exclusive) {
      setter([value]);
      return;
    }
    const cleaned = exclusive ? list.filter((item) => item !== exclusive) : list;
    setter(cleaned.includes(value) ? cleaned.filter((item) => item !== value) : [...cleaned, value]);
  }

  function canContinue() {
    if (step === 0) {
      return name.trim().length > 0 && Number(age) > 0 && Number(weight) > 0 && Number(height) > 0;
    }
    if (step === 2) {
      return equipment.length > 0;
    }
    if (step === 4) {
      return selectedStyles.length > 0;
    }
    if (step === 6) {
      return selectedInjuries.length > 0;
    }
    return true;
  }

  async function finish() {
    setError(null);
    setIsSaving(true);
    const dailyProteinTarget = Math.round((tdee * 0.3) / 4);
    const dailyCarbsTarget = Math.round((tdee * 0.4) / 4);
    const dailyFatTarget = Math.round((tdee * 0.3) / 9);

    try {
      await saveOnboardingProfile({
        displayName: name.trim() || "Athlete",
        age: Number(age) || 25,
        gender,
        weightKg: weightUnit === "lbs" ? Number(weight) * 0.453592 : Number(weight),
        heightCm: Number(height) || 175,
        primaryGoal: goal,
        fitnessLevel: level,
        activityLevel: activity,
        dietaryPreference: diet,
        dailyCalorieTarget: tdee,
        dailyProteinTarget,
        dailyCarbsTarget,
        dailyFatTarget,
        answers: {
          equipment,
          days,
          duration,
          trainingStyles: selectedStyles,
          recovery,
          injuries: selectedInjuries,
          coach
        }
      });
      await markLocalOnboardingComplete();
      await refreshProfile();
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save onboarding. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function next() {
    if (!canContinue()) {
      setError("Complete this step to continue.");
      return;
    }
    setError(null);
    if (step === totalSteps - 1) {
      void finish();
      return;
    }
    setStep((current) => Math.min(totalSteps - 1, current + 1));
  }

  return (
    <AppLayout scroll contentContainerStyle={styles.screen}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {step === 0 ? (
        <StepShell kicker={isEditing ? "EDIT PROFILE" : "ABOUT YOU"} title="Tell us about yourself">
          <TextInput placeholder="Your name" placeholderTextColor={colors.textTertiary} style={styles.input} value={name} onChangeText={setName} underlineColorAndroid="transparent" />
          <View style={styles.inputGrid}>
            <TextInput keyboardType="number-pad" placeholder="Age" placeholderTextColor={colors.textTertiary} style={styles.gridInput} value={age} onChangeText={setAge} underlineColorAndroid="transparent" />
            <UnitToggle value={gender} values={["male", "female"]} onChange={setGender} />
          </View>
          <View style={styles.inputGrid}>
            <TextInput keyboardType="decimal-pad" placeholder="Weight" placeholderTextColor={colors.textTertiary} style={styles.gridInput} value={weight} onChangeText={setWeight} underlineColorAndroid="transparent" />
            <UnitToggle value={weightUnit} values={["kg", "lbs"]} onChange={setWeightUnit} />
          </View>
          <TextInput keyboardType="decimal-pad" placeholder="Height in cm" placeholderTextColor={colors.textTertiary} style={styles.input} value={height} onChangeText={setHeight} underlineColorAndroid="transparent" />
        </StepShell>
      ) : null}

      {step === 1 ? (
        <StepShell kicker="GOALS" title="What do you want to achieve?">
          {goals.map((item) => <SelectCard key={item} title={item} selected={goal === item} onPress={() => setGoal(item)} />)}
        </StepShell>
      ) : null}

      {step === 2 ? (
        <StepShell kicker="EQUIPMENT" title="What do you have access to?">
          {equipmentOptions.map((item) => (
            <SelectCard key={item} title={item} selected={equipment.includes(item)} onPress={() => toggleMulti(item, equipment, setEquipment)} />
          ))}
        </StepShell>
      ) : null}

      {step === 3 ? (
        <StepShell kicker="SCHEDULE" title="How often will you train?">
          {[2, 3, 4, 5, 6].map((item) => <SelectCard key={item} title={`${item} days per week`} selected={days === item} onPress={() => setDays(item)} />)}
          {["15-20 min", "20-30 min", "30-45 min", "45-60 min", "60+ min"].map((item) => (
            <SelectCard key={item} title={item} selected={duration === item} onPress={() => setDuration(item)} />
          ))}
        </StepShell>
      ) : null}

      {step === 4 ? (
        <StepShell kicker="TRAINING STYLE" title="What type of training do you prefer?">
          {trainingStyles.map((item) => (
            <SelectCard key={item} title={item} selected={selectedStyles.includes(item)} onPress={() => toggleMulti(item, selectedStyles, setSelectedStyles)} />
          ))}
        </StepShell>
      ) : null}

      {step === 5 ? (
        <StepShell kicker="RECOVERY" title="How active and recovered are you?">
          {["Sedentary", "Lightly active", "Moderately active", "Very active"].map((item) => (
            <SelectCard key={item} title={item} selected={activity === item} onPress={() => setActivity(item)} />
          ))}
          {["I sleep well and recover fast", "Average sleep and recovery", "I often feel tired or sore", "I am recovering from an injury"].map((item) => (
            <SelectCard key={item} title={item} selected={recovery === item} onPress={() => setRecovery(item)} />
          ))}
        </StepShell>
      ) : null}

      {step === 6 ? (
        <StepShell kicker="HEALTH CHECK" title="Any injuries or limitations?">
          {injuries.map((item) => (
            <SelectCard
              key={item}
              title={item}
              selected={selectedInjuries.includes(item)}
              onPress={() => toggleMulti(item, selectedInjuries, setSelectedInjuries, "No injuries or limitations")}
            />
          ))}
        </StepShell>
      ) : null}

      {step === 7 ? (
        <StepShell kicker="NUTRITION & COACH" title="Final calibration">
          {dietOptions.map((item) => <SelectCard key={item} title={item} selected={diet === item} onPress={() => setDiet(item)} />)}
          {coachOptions.map((item) => <SelectCard key={item} title={item} selected={coach === item} onPress={() => setCoach(item)} />)}
          <GlassCard radius={radii.xl} style={styles.tdeeCard}>
            <Text style={styles.tdeeValue}>{tdee}</Text>
            <Text style={styles.tdeeLabel}>estimated daily calories</Text>
          </GlassCard>
        </StepShell>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.footer}>
        {step > 0 ? (
          <TouchableOpacity activeOpacity={0.78} onPress={() => setStep((current) => Math.max(0, current - 1))} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity activeOpacity={0.82} disabled={isSaving || !canContinue()} onPress={next} style={[styles.continueButton, (!canContinue() || isSaving) && styles.disabled]}>
          {isSaving ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.continueText}>{step === totalSteps - 1 ? "Finish" : "Continue"}</Text>}
        </TouchableOpacity>
      </View>
    </AppLayout>
  );
}

function StepShell({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return (
    <View style={styles.step}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.stepContent}>{children}</View>
    </View>
  );
}

function SelectCard({ title, selected, onPress }: { title: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableCard selected={selected} radius={radii.card} style={styles.selectCard} onPress={onPress}>
      <View style={styles.selectIcon}>
        <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={22} color={selected ? colors.accent : colors.textTertiary} />
      </View>
      <Text style={styles.selectTitle}>{title}</Text>
    </TouchableCard>
  );
}

function UnitToggle({ value, values, onChange }: { value: string; values: string[]; onChange: (next: string) => void }) {
  return (
    <View style={styles.unitToggle}>
      {values.map((item) => (
        <TouchableOpacity key={item} activeOpacity={0.78} onPress={() => onChange(item)} style={[styles.unitOption, value === item && styles.unitActive]}>
          <Text style={[styles.unitText, value === item && styles.unitActiveText]}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function calculateTdee({
  age,
  gender,
  weight,
  weightUnit,
  height,
  activity,
  goal
}: {
  age: string;
  gender: string;
  weight: string;
  weightUnit: string;
  height: string;
  activity: string;
  goal: string;
}) {
  const weightKg = weightUnit === "lbs" ? Number(weight) * 0.453592 : Number(weight);
  const heightCm = Number(height);
  const ageYears = Number(age);
  const bmr = gender === "male" ? 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5 : 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
  const activityMultiplier = activity === "Very active" ? 1.725 : activity === "Moderately active" ? 1.55 : activity === "Lightly active" ? 1.375 : 1.2;
  const goalMultiplier = goal === "Lose Weight" ? 0.85 : goal === "Build Muscle" ? 1.1 : 1;
  return Math.max(1200, Math.round(bmr * activityMultiplier * goalMultiplier));
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 24
  },
  progressTrack: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: radii.round,
    height: 6,
    marginTop: 12,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: colors.accent,
    height: 6
  },
  step: {
    gap: 8,
    paddingTop: 8
  },
  kicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34
  },
  stepContent: {
    gap: 14,
    marginTop: 10
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 15,
    minHeight: 54,
    paddingHorizontal: 16
  },
  inputGrid: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  gridInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.textPrimary,
    flex: 1,
    fontSize: 15,
    minHeight: 54,
    paddingHorizontal: 16
  },
  unitToggle: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radii.round,
    flexDirection: "row",
    padding: 3
  },
  unitOption: {
    borderRadius: radii.round,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  unitActive: {
    backgroundColor: colors.accent
  },
  unitText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "800"
  },
  unitActiveText: {
    color: colors.textPrimary
  },
  selectCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    minHeight: 68,
    padding: 16
  },
  selectIcon: {
    width: 24
  },
  selectTitle: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 16,
    fontWeight: "700"
  },
  tdeeCard: {
    alignItems: "center",
    gap: 2,
    marginTop: 6,
    padding: 18
  },
  tdeeValue: {
    color: colors.accent,
    fontSize: 32,
    fontWeight: "900"
  },
  tdeeLabel: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: "700"
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center"
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 24,
    paddingTop: 6
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: colors.cardStroke,
    borderRadius: 18,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  continueButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 18,
    flex: 1,
    minHeight: 56,
    justifyContent: "center"
  },
  disabled: {
    opacity: 0.45
  },
  continueText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800"
  }
});
