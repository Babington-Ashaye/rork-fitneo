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

const sportFallbackPools: Record<string, string[][]> = {
  "Football (Soccer)": [
    ["football_acceleration_starts", "football_lateral_cuts", "football_close_control_feet", "single_leg_glute_bridge", "side_plank", "runner_calf_mobility"],
    ["football_backpedal_turns", "football_single_leg_bounds", "sprint_intervals", "jump_lunges", "calf_raises", "plank"],
    ["football_lateral_cuts", "side_shuffles", "fast_feet", "mountain_climbers", "russian_twists", "walk_run_cooldown"],
    ["leg_swings", "runner_lunge_stretch", "post_run_hamstring", "runner_calf_mobility", "cat_cow", "recovery_walk"]
  ],
  Basketball: [
    ["basketball_defensive_slides", "basketball_closeout_sprints", "basketball_crossover_footwork", "side_plank", "calf_raises", "ankle_bounces"],
    ["basketball_rebound_jumps", "tuck_jumps", "jump_lunges", "wall_sit", "single_leg_glute_bridge", "plank"],
    ["basketball_defensive_slides", "fast_feet", "mountain_climbers", "high_knees", "russian_twists", "walk_run_cooldown"],
    ["leg_swings", "hip_flexor_stretch", "hamstring_stretch", "runner_calf_mobility", "cat_cow", "childs_pose"]
  ],
  Rugby: [
    ["rugby_get_up_sprints", "rugby_lateral_bound", "rugby_bear_crawl_drive", "push_ups", "side_plank", "calf_raises"],
    ["rugby_sprawl_recoveries", "bear_crawl", "burpees", "jump_lunges", "plank", "mountain_climbers"],
    ["sprint_intervals", "rugby_lateral_bound", "fast_feet", "push_ups", "russian_twists", "walk_run_cooldown"],
    ["cat_cow", "childs_pose", "runner_lunge_stretch", "post_run_hamstring", "runner_calf_mobility", "recovery_walk"]
  ],
  Boxing: [
    ["boxing_jab_cross_rounds", "boxing_slip_roll_drills", "boxing_l_step_footwork", "shadow_boxing", "side_plank", "calf_raises"],
    ["boxing_pivot_drills", "high_knees", "mountain_climbers", "push_ups", "russian_twists", "plank"],
    ["boxing_jab_cross_rounds", "boxing_l_step_footwork", "burpees", "bicycle_crunches", "fast_feet", "walk_run_cooldown"],
    ["cat_cow", "cobra_stretch", "childs_pose", "hip_flexor_stretch", "hamstring_stretch", "recovery_walk"]
  ],
  Tennis: [
    ["tennis_split_step_shuffles", "tennis_lateral_recovery", "tennis_shadow_swings", "side_plank", "calf_raises", "ankle_bounces"],
    ["tennis_lateral_recovery", "sprint_intervals", "jump_lunges", "russian_twists", "plank", "runner_calf_mobility"],
    ["tennis_split_step_shuffles", "fast_feet", "side_shuffles", "mountain_climbers", "dead_bug", "walk_run_cooldown"],
    ["cat_cow", "cobra_stretch", "hip_flexor_stretch", "post_run_hamstring", "runner_lunge_stretch", "recovery_walk"]
  ],
  Swimming: [
    ["swimmer_streamline_plank", "swimmer_dryland_kicks", "dead_bug", "plank", "cat_cow", "cobra_stretch"],
    ["swimmer_streamline_plank", "push_ups", "supermans", "side_plank", "bird_dogs", "downward_dog"],
    ["swimmer_dryland_kicks", "mountain_climbers", "russian_twists", "bicycle_crunches", "glute_bridges", "walk_run_cooldown"],
    ["cat_cow", "childs_pose", "cobra_stretch", "downward_dog", "hamstring_stretch", "recovery_walk"]
  ],
  Running: [
    ["brisk_walk_intervals", "easy_jog_intervals", "cadence_drills", "ankle_bounces", "leg_swings", "runner_calf_mobility"],
    ["walk_jog_repeats", "running_strides", "butt_kicks", "a_skips", "single_leg_glute_bridge", "plank"],
    ["easy_jog_intervals", "fast_feet", "side_shuffles", "hill_walk_march", "post_run_hamstring", "walk_run_cooldown"],
    ["recovery_walk", "runner_lunge_stretch", "runner_calf_mobility", "post_run_hamstring", "cat_cow", "childs_pose"]
  ],
  Cricket: [
    ["cricket_shadow_bowling", "cricket_lateral_pickups", "tennis_shadow_swings", "side_plank", "lunges", "calf_raises"],
    ["cricket_lateral_pickups", "sprint_intervals", "jump_lunges", "russian_twists", "plank", "push_ups"],
    ["cricket_shadow_bowling", "side_shuffles", "fast_feet", "mountain_climbers", "dead_bug", "walk_run_cooldown"],
    ["cat_cow", "cobra_stretch", "hip_flexor_stretch", "post_run_hamstring", "runner_calf_mobility", "recovery_walk"]
  ],
  Volleyball: [
    ["volleyball_approach_jumps", "volleyball_block_jumps", "basketball_defensive_slides", "side_plank", "calf_raises", "ankle_bounces"],
    ["volleyball_sprawl_recoveries", "tuck_jumps", "jump_lunges", "push_ups", "plank", "mountain_climbers"],
    ["volleyball_approach_jumps", "fast_feet", "side_shuffles", "burpees", "russian_twists", "walk_run_cooldown"],
    ["cat_cow", "childs_pose", "hip_flexor_stretch", "hamstring_stretch", "runner_calf_mobility", "recovery_walk"]
  ]
};

const positionExerciseEmphasis: Record<string, Record<string, string[]>> = {
  "Football (Soccer)": {
    Goalkeeper: ["football_backpedal_turns", "football_lateral_cuts", "single_leg_glute_bridge", "side_plank"],
    "Centre Back": ["football_backpedal_turns", "rugby_lateral_bound", "sprint_intervals", "plank"],
    "Full Back": ["football_acceleration_starts", "football_lateral_cuts", "running_strides", "side_shuffles"],
    "Defensive Midfielder": ["football_close_control_feet", "football_lateral_cuts", "fast_feet", "russian_twists"],
    "Central Midfielder": ["brisk_walk_intervals", "cadence_drills", "football_close_control_feet", "runner_calf_mobility"],
    "Attacking Midfielder": ["football_close_control_feet", "football_acceleration_starts", "fast_feet", "side_plank"],
    "Left Winger": ["football_acceleration_starts", "running_strides", "football_lateral_cuts", "ankle_bounces"],
    "Right Winger": ["football_acceleration_starts", "running_strides", "football_lateral_cuts", "ankle_bounces"],
    Striker: ["football_acceleration_starts", "football_single_leg_bounds", "sprint_intervals", "calf_raises"]
  },
  Basketball: {
    "Point Guard": ["basketball_crossover_footwork", "basketball_defensive_slides", "fast_feet", "side_plank"],
    "Shooting Guard": ["basketball_closeout_sprints", "basketball_crossover_footwork", "tuck_jumps", "russian_twists"],
    "Small Forward": ["basketball_rebound_jumps", "basketball_defensive_slides", "jump_lunges", "plank"],
    "Power Forward": ["basketball_rebound_jumps", "wall_sit", "single_leg_glute_bridge", "push_ups"],
    Center: ["basketball_rebound_jumps", "wall_sit", "plank", "rugby_bear_crawl_drive"]
  },
  Rugby: {
    Prop: ["rugby_sprawl_recoveries", "rugby_bear_crawl_drive", "push_ups", "plank"],
    Hooker: ["rugby_get_up_sprints", "rugby_bear_crawl_drive", "side_plank", "calf_raises"],
    Lock: ["rugby_lateral_bound", "tuck_jumps", "push_ups", "plank"],
    Flanker: ["rugby_get_up_sprints", "rugby_sprawl_recoveries", "rugby_lateral_bound", "mountain_climbers"],
    "Number 8": ["rugby_get_up_sprints", "rugby_bear_crawl_drive", "burpees", "side_plank"],
    "Scrum Half": ["rugby_lateral_bound", "fast_feet", "side_shuffles", "russian_twists"],
    "Fly Half": ["rugby_lateral_bound", "sprint_intervals", "fast_feet", "side_plank"],
    Centre: ["rugby_get_up_sprints", "rugby_lateral_bound", "jump_lunges", "plank"],
    Wing: ["sprint_intervals", "running_strides", "rugby_lateral_bound", "ankle_bounces"],
    Fullback: ["rugby_get_up_sprints", "football_backpedal_turns", "side_shuffles", "runner_calf_mobility"]
  },
  Boxing: {
    Orthodox: ["boxing_jab_cross_rounds", "boxing_pivot_drills", "boxing_slip_roll_drills", "shadow_boxing"],
    Southpaw: ["boxing_jab_cross_rounds", "boxing_l_step_footwork", "boxing_slip_roll_drills", "russian_twists"],
    Switch: ["boxing_l_step_footwork", "boxing_pivot_drills", "fast_feet", "side_plank"],
    "Out-boxer": ["boxing_l_step_footwork", "fast_feet", "shadow_boxing", "walk_run_cooldown"],
    "Pressure Fighter": ["boxing_jab_cross_rounds", "mountain_climbers", "burpees", "plank"],
    "Counter Puncher": ["boxing_slip_roll_drills", "boxing_pivot_drills", "side_plank", "russian_twists"]
  },
  Swimming: {
    Freestyle: ["swimmer_streamline_plank", "swimmer_dryland_kicks", "supermans", "dead_bug"],
    Backstroke: ["swimmer_streamline_plank", "bird_dogs", "supermans", "side_plank"],
    Breaststroke: ["swimmer_dryland_kicks", "glute_bridges", "hip_flexor_stretch", "dead_bug"],
    Butterfly: ["swimmer_streamline_plank", "push_ups", "supermans", "plank"],
    "Individual Medley": ["swimmer_streamline_plank", "swimmer_dryland_kicks", "bird_dogs", "side_plank"],
    "Open Water": ["swimmer_streamline_plank", "brisk_walk_intervals", "dead_bug", "runner_calf_mobility"]
  },
  Running: {
    "First 5K": ["walk_jog_repeats", "easy_jog_intervals", "cadence_drills", "runner_calf_mobility"],
    "Weight-loss Walking": ["power_walk", "brisk_walk_intervals", "hill_walk_march", "recovery_walk"],
    "10K Base": ["easy_jog_intervals", "running_strides", "cadence_drills", "post_run_hamstring"],
    "Speed / Pace": ["running_strides", "fast_feet", "a_skips", "ankle_bounces"],
    Endurance: ["brisk_walk_intervals", "walk_jog_repeats", "easy_jog_intervals", "walk_run_cooldown"]
  },
  Cricket: {
    Batter: ["tennis_shadow_swings", "cricket_lateral_pickups", "russian_twists", "side_plank"],
    Bowler: ["cricket_shadow_bowling", "runner_lunge_stretch", "side_plank", "push_ups"],
    "All-rounder": ["cricket_shadow_bowling", "cricket_lateral_pickups", "sprint_intervals", "dead_bug"],
    Wicketkeeper: ["cricket_lateral_pickups", "side_shuffles", "wall_sit", "plank"],
    Fielder: ["cricket_lateral_pickups", "sprint_intervals", "fast_feet", "calf_raises"]
  },
  Volleyball: {
    Setter: ["volleyball_approach_jumps", "basketball_defensive_slides", "side_plank", "fast_feet"],
    "Outside Hitter": ["volleyball_approach_jumps", "volleyball_block_jumps", "jump_lunges", "plank"],
    "Opposite Hitter": ["volleyball_approach_jumps", "tuck_jumps", "push_ups", "russian_twists"],
    "Middle Blocker": ["volleyball_block_jumps", "wall_sit", "calf_raises", "plank"],
    Libero: ["volleyball_sprawl_recoveries", "side_shuffles", "fast_feet", "dead_bug"]
  }
};

function blendPositionPool(baseIds: string[], sport: string, position: string, dayIndex: number) {
  const emphasis = positionExerciseEmphasis[sport]?.[position] ?? [];
  if (emphasis.length === 0) return baseIds;
  const rotated = emphasis.slice(dayIndex % emphasis.length).concat(emphasis.slice(0, dayIndex % emphasis.length));
  return Array.from(new Set([...rotated.slice(0, 3), ...baseIds])).slice(0, 8);
}

function buildSportPools(sport: string, position: string, tier: ExerciseEquipmentTier, fallback: string[][]) {
  const sourcePools = sportFallbackPools[sport] ?? fallback;
  return sourcePools.map((ids, index) => pickValid(blendPositionPool(ids, sport, position, index), tier));
}

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

function normalizeComparable(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getContextSport(context: PlanContext) {
  return cleanString(context.answers.sport, "");
}

function getContextPosition(context: PlanContext) {
  return cleanString(context.answers.sport_position, cleanString(context.answers.position, ""));
}

function getContextLevel(context: PlanContext) {
  return cleanString(context.answers.sport_level, cleanString(context.profile.fitness_level, ""));
}

function planMetadataMatchesContext(
  saved: { sport?: unknown; position?: unknown; level?: unknown },
  context: PlanContext
) {
  const currentSport = normalizeComparable(getContextSport(context));
  const currentPosition = normalizeComparable(getContextPosition(context));
  const currentLevel = normalizeComparable(getContextLevel(context));
  const savedSport = normalizeComparable(saved.sport);
  const savedPosition = normalizeComparable(saved.position);
  const savedLevel = normalizeComparable(saved.level);

  if (currentSport && savedSport && currentSport !== savedSport) return false;
  if (currentPosition && savedPosition && currentPosition !== savedPosition) return false;
  if (currentLevel && savedLevel && currentLevel !== savedLevel) return false;
  if (currentSport && !savedSport) return false;
  return true;
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

  const genericPools = [
    pickValid(["push_ups", "squats", "glute_bridges", "mountain_climbers", "dead_bug", "side_plank", "jumping_jacks"], tier),
    pickValid(["pike_push_ups", "lunges", "single_leg_glute_bridge", "calf_raises", "plank", "bicycle_crunches"], tier),
    pickValid(["high_knees", "burpees", "bear_crawl", "shadow_boxing", "jumping_jacks", "mountain_climbers"], tier),
    pickValid(["cat_cow", "downward_dog", "hamstring_stretch", "hip_flexor_stretch", "cobra_stretch", "childs_pose"], "none"),
    pickValid(["wide_push_ups", "wall_sit", "bird_dogs", "reverse_crunches", "v_ups", "supermans"], tier)
  ];
  const pools = buildSportPools(sport, position, tier, genericPools);

  const themes = ["Foundation", "Progressive Power", "Peak Conditioning", "Performance Polish"];
  const dayTitles = sport === "Running"
    ? ["Aerobic Base", "Stride Mechanics", "Tempo Prep", "Mobility Reset", "Rest + Recovery", "Cadence Builder", "Rest + Recovery"]
    : ["Athletic Base", "Position Power", "Speed + Skill", "Mobility Reset", "Rest + Recovery", "Game Conditioning", "Rest + Recovery"];

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
        const poolIndex = isRest ? 0 : (weekIndex + dayIndex) % pools.length;
        return {
          dayNumber,
          title: isRest ? "Rest + Recovery" : dayTitles[dayIndex],
          focus: isRest ? "Recovery, walking, hydration, and light mobility." : `Week ${weekIndex + 1} ${themes[weekIndex].toLowerCase()} work for ${position}.`,
          exerciseIds: isRest ? [] : pools[poolIndex],
          isRest,
          motivationalNote: isRest ? "Recovery is training too. Let your body adapt." : "Keep the reps clean and finish with confidence."
        };
      })
    }))
  };
}

export function previewGeneratedSportPlanForAudit(
  sport: string,
  position: string,
  equipment: ExerciseEquipmentTier = "none"
) {
  const plan = buildFallbackPlan({
    answers: {
      sport,
      sport_position: position,
      equipment
    },
    profile: {
      fitness_level: "Beginner",
      primary_goal: "Athletic Performance"
    }
  });

  return plan.weeks[0].days
    .filter((day) => !day.isRest)
    .slice(0, 4)
    .map((day) => ({
      day: day.dayNumber,
      title: day.title,
      exerciseIds: day.exerciseIds
    }));
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
    const context = await loadPlanContext(userId);
    const { data, error } = await supabase
      .from("ai_plans")
      .select("plan_data,generated_at,sport,position,level")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data?.plan_data) return null;
    if (!planMetadataMatchesContext(data, context)) return null;

    const generatedAt = typeof data.generated_at === "string" ? data.generated_at : null;
    if (generatedAt) {
      const ageMs = Date.now() - new Date(generatedAt).getTime();
      if (Number.isFinite(ageMs) && ageMs > 30 * 24 * 60 * 60 * 1000) return null;
    }

    const fallback = buildFallbackPlan(context);
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
