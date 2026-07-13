import OpenAI from "openai";
import { exerciseCatalog, ExerciseEquipmentTier } from "@/lib/exercises";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type GeneratedDay = {
  dayNumber: number;
  title: string;
  focus: string;
  exerciseIds: string[];
  isRest: boolean;
  motivationalNote: string;
};

export type GeneratedWeek = {
  weekNumber: number;
  theme: string;
  days: GeneratedDay[];
};

export type GeneratedPlan = {
  planTitle: string;
  planDescription: string;
  tagline: string;
  sportColor: string;
  weeks: GeneratedWeek[];
};

export type GeneratedPlanRecord = {
  plan: GeneratedPlan;
  generatedAt: string | null;
};

type PlanContext = {
  answers: Record<string, unknown>;
  profile: Record<string, unknown>;
};

const openAiApiKey = (
  process.env.EXPO_PUBLIC_OPENAI_API_KEY ??
  process.env.EXPO_PUBLIC_OPENAI_KEY ??
  ""
).trim();

const validExerciseIds = new Set(exerciseCatalog.map((exercise) => exercise.id));

const exercisePromptList = exerciseCatalog
  .map((exercise) => `${exercise.id} | ${exercise.name} | ${exercise.muscleGroup} | ${exercise.equipmentTier}`)
  .join("\n");

const fallbackPalettes: Record<string, string> = {
  "Football (Soccer)": "#22C55E",
  Basketball: "#F97316",
  Tennis: "#A3E635",
  Swimming: "#06B6D4",
  Running: "#A855F7",
  Rugby: "#EF4444",
  Boxing: "#DC2626",
  Cricket: "#EAB308",
  Volleyball: "#EC4899"
};

function getOpenAiClient() {
  if (!openAiApiKey) return null;
  return new OpenAI({
    apiKey: openAiApiKey,
    dangerouslyAllowBrowser: true
  });
}

function cleanString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeEquipmentPreference(answers: Record<string, unknown>): ExerciseEquipmentTier {
  const raw = JSON.stringify(answers).toLowerCase();
  if (raw.includes("no equipment") || raw.includes("0 equipment") || raw.includes("bodyweight")) return "none";
  if (raw.includes("full gym") || raw.includes("gym")) return "full";
  if (raw.includes("dumbbell") || raw.includes("home gear") || raw.includes("some gear")) return "few";
  return "none";
}

function filterValidExerciseIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  return ids
    .filter((id): id is string => typeof id === "string" && validExerciseIds.has(id))
    .slice(0, 8);
}

function pickValid(ids: string[], preferredTier: ExerciseEquipmentTier) {
  const direct = ids.filter((id) => {
    const exercise = exerciseCatalog.find((item) => item.id === id);
    if (!exercise) return false;
    if (preferredTier === "none") return exercise.equipmentTier === "none";
    if (preferredTier === "few") return exercise.equipmentTier !== "full";
    return true;
  });
  if (direct.length >= 4) return direct.slice(0, 8);
  return exerciseCatalog
    .filter((exercise) => preferredTier === "full" ? true : exercise.equipmentTier === preferredTier)
    .slice(0, 6)
    .map((exercise) => exercise.id);
}

function buildFallbackPlan(context?: Partial<PlanContext>): GeneratedPlan {
  const answers = context?.answers ?? {};
  const profile = context?.profile ?? {};
  const sport = cleanString(answers.sport, "Performance");
  const position = cleanString(answers.sport_position, cleanString(answers.position, "Athlete"));
  const goal = cleanString(profile.primary_goal, cleanString(answers.primaryGoal, "Athletic Performance"));
  const level = cleanString(profile.fitness_level, cleanString(answers.sport_level, "Beginner"));
  const tier = normalizeEquipmentPreference(answers);
  const color = fallbackPalettes[sport] ?? "#0A84FF";

  const pools = [
    pickValid(["push_ups", "squats", "glute_bridges", "mountain_climbers", "dead_bug", "side_plank", "jumping_jacks"], tier),
    pickValid(["pike_push_ups", "lunges", "single_leg_glute_bridge", "calf_raises", "plank", "bicycle_crunches"], tier),
    pickValid(["high_knees", "burpees", "bear_crawl", "shadow_boxing", "jumping_jacks", "mountain_climbers"], tier),
    pickValid(["cat_cow", "downward_dog", "hamstring_stretch", "hip_flexor_stretch", "cobra_stretch", "childs_pose"], "none"),
    pickValid(["wide_push_ups", "wall_sit", "bird_dogs", "reverse_crunches", "v_ups", "supermans"], tier)
  ];

  const themes = ["Foundation", "Progressive Power", "Peak Conditioning", "Performance Polish"];

  return {
    planTitle: `${sport === "Performance" ? goal : sport} Training Plan`,
    planDescription: `A personalized ${level.toLowerCase()} plan for ${position}, built around ${goal.toLowerCase()} and your available equipment.`,
    tagline: `Power, consistency, and sport-specific conditioning for ${position}.`,
    sportColor: color,
    weeks: Array.from({ length: 4 }).map((_, weekIndex) => ({
      weekNumber: weekIndex + 1,
      theme: themes[weekIndex],
      days: Array.from({ length: 7 }).map((__, dayIndex) => {
        const dayNumber = dayIndex + 1;
        const isRest = dayNumber === 5 || dayNumber === 7;
        const poolIndex = dayNumber === 6 ? 4 : Math.min(dayIndex, 3);
        return {
          dayNumber,
          title: isRest ? "Rest + Recovery" : ["Athletic Base", "Lower Body", "HIIT & Cardio", "Mobility Reset", "Rest + Recovery", "Full Body Control", "Rest + Recovery"][dayIndex],
          focus: isRest ? "Recovery, walking, hydration, and light mobility." : `Week ${weekIndex + 1} ${themes[weekIndex].toLowerCase()} work for ${position}.`,
          exerciseIds: isRest ? [] : pools[poolIndex],
          isRest,
          motivationalNote: isRest ? "Recovery is training too. Let your body adapt." : "Keep the reps clean and finish with confidence."
        };
      })
    }))
  };
}

function validatePlan(value: unknown, fallback: GeneratedPlan): GeneratedPlan {
  if (!value || typeof value !== "object") return fallback;
  const raw = value as Partial<GeneratedPlan>;
  const weeks = Array.isArray(raw.weeks) ? raw.weeks : [];
  const cleanedWeeks = weeks.slice(0, 4).map((week, weekIndex) => {
    const rawWeek = week as Partial<GeneratedWeek>;
    const days = Array.isArray(rawWeek.days) ? rawWeek.days : [];
    return {
      weekNumber: Number(rawWeek.weekNumber ?? weekIndex + 1),
      theme: cleanString(rawWeek.theme, fallback.weeks[weekIndex]?.theme ?? `Week ${weekIndex + 1}`),
      days: days.slice(0, 7).map((day, dayIndex) => {
        const rawDay = day as Partial<GeneratedDay>;
        const isRest = Boolean(rawDay.isRest);
        return {
          dayNumber: Number(rawDay.dayNumber ?? dayIndex + 1),
          title: cleanString(rawDay.title, isRest ? "Rest + Recovery" : "Training Day"),
          focus: cleanString(rawDay.focus, isRest ? "Recover and prepare for the next session." : "Build controlled athletic capacity."),
          exerciseIds: isRest ? [] : filterValidExerciseIds(rawDay.exerciseIds),
          isRest,
          motivationalNote: cleanString(rawDay.motivationalNote, "Stay consistent. Small wins stack up.")
        };
      })
    };
  });

  const normalizedWeeks = cleanedWeeks.length === 4 ? cleanedWeeks : fallback.weeks;
  return {
    planTitle: cleanString(raw.planTitle, fallback.planTitle),
    planDescription: cleanString(raw.planDescription, fallback.planDescription),
    tagline: cleanString(raw.tagline, fallback.tagline),
    sportColor: cleanString(raw.sportColor, fallback.sportColor),
    weeks: normalizedWeeks.map((week, index) => ({
      ...week,
      days: week.days.length === 7 ? week.days : fallback.weeks[index]?.days ?? week.days
    }))
  };
}

async function loadPlanContext(userId: string): Promise<PlanContext> {
  const context: PlanContext = { answers: {}, profile: {} };
  if (!isSupabaseConfigured) return context;

  const [answersResult, profileResult] = await Promise.all([
    supabase.from("onboarding_answers").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("user_profiles").select("*").eq("id", userId).maybeSingle()
  ]);

  const profile = (profileResult.data ?? {}) as Record<string, unknown>;
  const profileAnswers =
    profile.onboarding_answers && typeof profile.onboarding_answers === "object"
      ? profile.onboarding_answers as Record<string, unknown>
      : {};
  const tableAnswers = (answersResult.data ?? {}) as Record<string, unknown>;

  context.profile = profile;
  context.answers = { ...profileAnswers, ...tableAnswers };
  return context;
}

async function saveGeneratedPlan(userId: string, plan: GeneratedPlan, context: PlanContext) {
  if (!isSupabaseConfigured) return;
  const sport = cleanString(context.answers.sport, "");
  const position = cleanString(context.answers.sport_position, cleanString(context.answers.position, ""));
  const level = cleanString(context.answers.sport_level, cleanString(context.profile.fitness_level, ""));

  const { error } = await supabase.from("ai_plans").upsert({
    user_id: userId,
    plan_data: plan,
    generated_at: new Date().toISOString(),
    sport,
    position,
    level
  }, { onConflict: "user_id" });

  if (error) {
    throw error;
  }
}

export async function generatePersonalizedPlan(userId: string): Promise<GeneratedPlan> {
  let context: PlanContext = { answers: {}, profile: {} };
  try {
    context = await loadPlanContext(userId);
    const fallback = buildFallbackPlan(context);
    const client = getOpenAiClient();

    if (!client) {
      try {
        await saveGeneratedPlan(userId, fallback, context);
      } catch {
        // Missing ai_plans table should not block the app.
      }
      return fallback;
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.55,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are FITNEO's elite workout planning engine. Return only valid JSON matching the requested schema. Use only exercise IDs from the provided catalog."
        },
        {
          role: "user",
          content: [
            "Create a personalized 4-week training plan with exactly 4 weeks and 7 days per week.",
            "Each day must include: dayNumber, title, focus, exerciseIds, isRest, motivationalNote.",
            "Use rest days when appropriate. Active days should use 4-8 exercise IDs.",
            "Never invent exercise IDs. Match exercises to equipment access, goal, injuries, sport, position, schedule, and level.",
            "Return JSON shape: { planTitle, planDescription, tagline, sportColor, weeks }.",
            "",
            `Profile: ${JSON.stringify(context.profile)}`,
            `Onboarding answers: ${JSON.stringify(context.answers)}`,
            "",
            `Available exercises:\n${exercisePromptList}`
          ].join("\n")
        }
      ]
    });

    const content = response.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(content) as unknown;
    const plan = validatePlan(parsed, fallback);

    try {
      await saveGeneratedPlan(userId, plan, context);
    } catch {
      // Plan still works locally even if cloud persistence is not ready.
    }

    return plan;
  } catch {
    return buildFallbackPlan(context);
  }
}

export async function loadExistingPlanWithMetadata(userId: string): Promise<GeneratedPlanRecord | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from("ai_plans")
      .select("plan_data,generated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data?.plan_data) return null;

    const generatedAt = typeof data.generated_at === "string" ? data.generated_at : null;
    if (generatedAt) {
      const ageMs = Date.now() - new Date(generatedAt).getTime();
      if (Number.isFinite(ageMs) && ageMs > 30 * 24 * 60 * 60 * 1000) return null;
    }

    const fallback = buildFallbackPlan();
    return {
      plan: validatePlan(data.plan_data, fallback),
      generatedAt
    };
  } catch {
    return null;
  }
}

export async function loadExistingPlan(userId: string): Promise<GeneratedPlan | null> {
  const record = await loadExistingPlanWithMetadata(userId);
  return record?.plan ?? null;
}

export function getPlanDayForDate(plan: GeneratedPlan, generatedAt?: string | null, date = new Date()): GeneratedDay | null {
  const days = plan.weeks.flatMap((week) => week.days);
  if (days.length === 0) return null;
  const start = generatedAt ? new Date(generatedAt) : date;
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const targetUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const dayIndex = Math.max(0, Math.floor((targetUtc - startUtc) / 86400000)) % Math.min(28, days.length);
  return days[dayIndex] ?? days[0] ?? null;
}

