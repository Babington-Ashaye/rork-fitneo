import AsyncStorage from "@react-native-async-storage/async-storage";
import { exerciseCatalog } from "@/lib/exercises";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type DashboardData = {
  displayName: string;
  streak: number;
  level: number;
  xp: number;
  xpSpan: number;
  rankTitle: string;
  caloriesToday: number;
  activeMinutes: number;
  workoutsThisWeek: number;
  weeklyWorkoutGoal: number;
  calorieBurnGoal: number;
  caloriesEaten: number;
  calorieEatGoal: number;
  waterCurrent: number;
  waterGoal: number;
  todayWorkout: {
    name: string;
    category: string;
    durationMinutes: number;
    calories: number;
    difficulty: string;
  };
  recentActivity: string[];
};

export type WorkoutProgram = {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  calories: number;
  exercises: number;
  difficulty: number;
  isPremium?: boolean;
};

export type ProfileSummary = {
  displayName: string;
  email: string;
  level: number;
  xp: number;
  rankTitle: string;
  subscription: string;
  badgesEarned: number;
  badgesTotal: number;
};

export type FavoriteMuscleGroup = {
  name: string;
  count: number;
};

export type NutritionData = {
  dateLabel: string;
  calorieTarget: number;
  caloriesEaten: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: Array<{
    title: string;
    kcal: number;
  }>;
};

export type ProgressData = {
  streak: number;
  longestStreak: number;
  consistency: number;
  weeklyWorkouts: number[];
  totalWorkouts: number;
  totalSets: number;
  caloriesBurned: number;
  totalXp: number;
  bmi: number | null;
  goalPaceWeeks: number | null;
  favoriteMuscleGroups: FavoriteMuscleGroup[];
};

export type ChatSessionSummary = {
  id: string;
  title: string;
  createdAt: string;
  preview?: string;
};

export type ChatMessageRecord = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type LeaderboardEntry = {
  userId: string;
  displayName: string;
  avatarColor: string;
  totalXp: number;
  currentStreak: number;
  workoutsThisWeek: number;
  isCurrentUser: boolean;
};

export type EarnedBadge = {
  badgeId: string;
  badgeName: string;
  earnedAt: string;
};

export type NutritionLogInput = {
  mealType: string;
  foodName: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  scanMethod: "barcode" | "photo" | "manual";
};

export type CustomWorkoutInput = {
  name: string;
  exerciseIds: string[];
  durationMinutes?: number;
};

export type OnboardingPayload = {
  displayName: string;
  age: number;
  gender: string;
  weightKg: number;
  heightCm: number;
  primaryGoal: string;
  fitnessLevel: string;
  activityLevel: string;
  dietaryPreference: string;
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyCarbsTarget: number;
  dailyFatTarget: number;
  answers: Record<string, unknown>;
};

export function calculateXpProgress(totalXp: number) {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp));
  let xpSpan = 1000;

  while (remaining >= xpSpan) {
    remaining -= xpSpan;
    level += 1;
    xpSpan = level * 1000;
  }

  return {
    level,
    xpInto: remaining,
    xpSpan
  };
}

const fallbackDashboard: DashboardData = {
  displayName: "Athlete",
  streak: 0,
  level: 1,
  xp: 0,
  xpSpan: calculateXpProgress(0).xpSpan,
  rankTitle: "Foundation Builder",
  caloriesToday: 0,
  activeMinutes: 0,
  workoutsThisWeek: 0,
  weeklyWorkoutGoal: 5,
  calorieBurnGoal: 500,
  caloriesEaten: 0,
  calorieEatGoal: 2200,
  waterCurrent: 0,
  waterGoal: 8,
  todayWorkout: {
    name: "Full Body Strength",
    category: "Strength",
    durationMinutes: 45,
    calories: 420,
    difficulty: "Intermediate"
  },
  recentActivity: []
};

const fallbackPrograms: WorkoutProgram[] = [
  { id: "full-body-beginner", name: "Full Body Beginner", category: "Strength", durationMinutes: 30, calories: 255, exercises: 5, difficulty: 1 },
  { id: "upper-lower-split", name: "Upper / Lower Split", category: "Strength", durationMinutes: 45, calories: 382, exercises: 5, difficulty: 2 },
  { id: "push-pull-legs", name: "Push Pull Legs", category: "Strength", durationMinutes: 50, calories: 425, exercises: 6, difficulty: 2 },
  { id: "home-no-equipment", name: "Home No-Equipment", category: "Strength", durationMinutes: 30, calories: 255, exercises: 6, difficulty: 1 },
  { id: "hiit-burn", name: "HIIT Burn", category: "Conditioning", durationMinutes: 24, calories: 280, exercises: 6, difficulty: 2 },
  { id: "core-control", name: "Core Control", category: "Core", durationMinutes: 20, calories: 160, exercises: 7, difficulty: 1 },
  { id: "mobility-reset", name: "Mobility Reset", category: "Mobility", durationMinutes: 18, calories: 120, exercises: 7, difficulty: 1 },
  { id: "athletic-conditioning", name: "Athletic Conditioning", category: "Conditioning", durationMinutes: 36, calories: 360, exercises: 8, difficulty: 3 },
  { id: "leg-power", name: "Leg Power", category: "Strength", durationMinutes: 42, calories: 390, exercises: 7, difficulty: 2 },
  { id: "upper-body-pump", name: "Upper Body Pump", category: "Strength", durationMinutes: 38, calories: 330, exercises: 7, difficulty: 2 },
  { id: "fat-loss-circuit", name: "Fat Loss Circuit", category: "Conditioning", durationMinutes: 28, calories: 315, exercises: 8, difficulty: 2 },
  { id: "recovery-flow", name: "Recovery Flow", category: "Mobility", durationMinutes: 22, calories: 110, exercises: 8, difficulty: 1 }
];

const fallbackMeals = ["Breakfast", "Lunch", "Dinner", "Snacks"];

export async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session?.user.id ?? null;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  if (!isSupabaseConfigured) {
    return fallbackDashboard;
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return fallbackDashboard;
  }

  const today = new Date().toISOString().slice(0, 10);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const [profileRes, workoutRes, nutritionRes, xpRes] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("workout_sessions").select("*").eq("user_id", userId).gte("completed_at", weekStart.toISOString()).order("completed_at", { ascending: false }),
    supabase.from("nutrition_logs").select("*").eq("user_id", userId).eq("log_date", today),
    supabase.from("xp_transactions").select("amount").eq("user_id", userId)
  ]);

  if (profileRes.error) {
    throw profileRes.error;
  }

  const profile = (profileRes.data ?? {}) as Record<string, any>;
  const workouts = (workoutRes.data ?? []) as Record<string, any>[];
  const nutrition = (nutritionRes.data ?? []) as Record<string, any>[];
  const xpRows = (xpRes.data ?? []) as Record<string, any>[];
  const xp = xpRows.reduce((sum, row) => sum + Number(row.amount ?? 0), Number(profile.total_xp ?? 0));
  const xpProgress = calculateXpProgress(xp);
  const caloriesToday = workouts
    .filter((row) => String(row.completed_at ?? "").startsWith(today))
    .reduce((sum, row) => sum + Number(row.calories_burned ?? 0), 0);
  const activeMinutes = workouts
    .filter((row) => String(row.completed_at ?? "").startsWith(today))
    .reduce((sum, row) => sum + Math.round(Number(row.duration_seconds ?? 0) / 60), 0);
  const caloriesEaten = nutrition.reduce((sum, row) => sum + Number(row.calories ?? 0), 0);

  return {
    ...fallbackDashboard,
    displayName: profile.display_name || profile.email?.split("@")[0] || "Athlete",
    streak: Number(profile.current_streak ?? profile.streak ?? 0),
    level: xpProgress.level,
    xp,
    xpSpan: xpProgress.xpSpan,
    workoutsThisWeek: workouts.length,
    caloriesToday,
    activeMinutes,
    caloriesEaten,
    calorieEatGoal: Number(profile.daily_calorie_target ?? fallbackDashboard.calorieEatGoal),
    recentActivity: workouts.slice(0, 3).map((row) => String(row.session_name ?? "Workout complete"))
  };
}

export async function fetchWorkoutPrograms(): Promise<WorkoutProgram[]> {
  const localJson = await AsyncStorage.getItem("fitneo.custom_workouts");
  const localPrograms = localJson ? JSON.parse(localJson) as WorkoutProgram[] : [];
  if (!isSupabaseConfigured) {
    return [...localPrograms, ...fallbackPrograms];
  }

  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("workout_programs")
    .select("*")
    .or(userId ? `is_template.eq.true,is_template.is.null,user_id.eq.${userId}` : "is_template.eq.true,is_template.is.null")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, any>[];
  if (rows.length === 0) {
    return [...localPrograms, ...fallbackPrograms];
  }

  const remotePrograms = rows.map((row, index) => ({
    id: String(row.id ?? row.program_name ?? index),
    name: String(row.program_name ?? row.name ?? "Workout Program"),
    category: String(row.category ?? "Strength"),
    durationMinutes: Number(row.duration_minutes ?? 30),
    calories: Number(row.calories ?? row.estimated_calories ?? 250),
    exercises: Array.isArray(row.exercise_ids) ? row.exercise_ids.length : Number(row.exercise_count ?? 6),
    difficulty: Number(row.difficulty ?? 2),
    isPremium: Boolean(row.is_premium)
  }));
  const fallbackFill = remotePrograms.length < 8 ? fallbackPrograms.filter((program) => !remotePrograms.some((remote) => remote.id === program.id)) : [];
  return [...localPrograms, ...remotePrograms, ...fallbackFill];
}

export async function saveCustomWorkout(input: CustomWorkoutInput): Promise<WorkoutProgram> {
  const trimmedName = input.name.trim();
  if (!trimmedName || input.exerciseIds.length === 0) {
    throw new Error("Add a workout name and at least one exercise.");
  }

  const localProgram: WorkoutProgram = {
    id: `local-${Date.now()}`,
    name: trimmedName,
    category: "Custom",
    durationMinutes: input.durationMinutes ?? Math.max(15, input.exerciseIds.length * 7),
    calories: Math.max(80, input.exerciseIds.length * 55),
    exercises: input.exerciseIds.length,
    difficulty: 2
  };
  const storageKey = "fitneo.custom_workouts";
  const existing = await AsyncStorage.getItem(storageKey);
  const localRows = existing ? JSON.parse(existing) as WorkoutProgram[] : [];
  await AsyncStorage.setItem(storageKey, JSON.stringify([localProgram, ...localRows].slice(0, 50)));

  if (!isSupabaseConfigured) {
    return localProgram;
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return localProgram;
  }
  const { data, error } = await supabase
    .from("workout_programs")
    .insert({
      user_id: userId,
      name: trimmedName,
      program_name: trimmedName,
      category: "custom",
      difficulty: 2,
      duration_minutes: localProgram.durationMinutes,
      description: "Custom workout created in FITNEO",
      exercise_ids: input.exerciseIds,
      exercise_count: input.exerciseIds.length,
      calories: localProgram.calories,
      is_premium: false,
      is_template: false
    })
    .select("*")
    .single();
  if (error) {
    throw new Error(`Saved locally, but cloud sync failed: ${error.message}`);
  }
  return {
    ...localProgram,
    id: String(data.id)
  };
}

export async function fetchProfileSummary(): Promise<ProfileSummary> {
  if (!isSupabaseConfigured) {
    return {
      displayName: "Athlete",
      email: "",
      level: 1,
      xp: 0,
      rankTitle: "Foundation Builder",
      subscription: "free",
      badgesEarned: 0,
      badgesTotal: 50
    };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("You must be signed in.");
  }

  const [profileRes, xpRes, badgesRes] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("xp_transactions").select("amount").eq("user_id", userId),
    supabase.from("badges").select("badge_id").eq("user_id", userId)
  ]);

  if (profileRes.error) {
    throw profileRes.error;
  }

  const profile = (profileRes.data ?? {}) as Record<string, any>;
  const xp = ((xpRes.data ?? []) as Record<string, any>[]).reduce((sum, row) => sum + Number(row.amount ?? 0), Number(profile.total_xp ?? 0));
  const xpProgress = calculateXpProgress(xp);

  return {
    displayName: profile.display_name || profile.email?.split("@")[0] || "Athlete",
    email: profile.email ?? "",
    level: xpProgress.level,
    xp,
    rankTitle: "Foundation Builder",
    subscription: String(profile.subscription_status ?? "free"),
    badgesEarned: (badgesRes.data ?? []).length,
    badgesTotal: 50
  };
}

export async function fetchNutritionData(date = new Date()): Promise<NutritionData> {
  const isoDate = date.toISOString().slice(0, 10);
  const dateLabel = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  if (!isSupabaseConfigured) {
    return {
      dateLabel,
      calorieTarget: 2200,
      caloriesEaten: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      meals: fallbackMeals.map((title) => ({ title, kcal: 0 }))
    };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("You must be signed in.");
  }

  const [profileRes, logsRes] = await Promise.all([
    supabase.from("user_profiles").select("daily_calorie_target").eq("id", userId).maybeSingle(),
    supabase.from("nutrition_logs").select("*").eq("user_id", userId).eq("log_date", isoDate)
  ]);

  if (profileRes.error) {
    throw profileRes.error;
  }
  if (logsRes.error) {
    throw logsRes.error;
  }

  const logs = (logsRes.data ?? []) as Record<string, any>[];
  const meals = fallbackMeals.map((title) => {
    const kcal = logs
      .filter((row) => String(row.meal_type ?? "").toLowerCase() === title.toLowerCase())
      .reduce((sum, row) => sum + Number(row.calories ?? 0), 0);
    return { title, kcal };
  });

  return {
    dateLabel,
    calorieTarget: Number((profileRes.data as Record<string, any> | null)?.daily_calorie_target ?? 2200),
    caloriesEaten: logs.reduce((sum, row) => sum + Number(row.calories ?? 0), 0),
    protein: logs.reduce((sum, row) => sum + Number(row.protein_g ?? 0), 0),
    carbs: logs.reduce((sum, row) => sum + Number(row.carbs_g ?? 0), 0),
    fat: logs.reduce((sum, row) => sum + Number(row.fat_g ?? 0), 0),
    meals
  };
}

export async function fetchProgressData(): Promise<ProgressData> {
  if (!isSupabaseConfigured) {
    return {
      streak: 0,
      longestStreak: 0,
      consistency: 0,
      weeklyWorkouts: [0, 0, 0, 0, 0, 0, 0, 0],
      totalWorkouts: 0,
      totalSets: 0,
      caloriesBurned: 0,
      totalXp: 0,
      bmi: null,
      goalPaceWeeks: null,
      favoriteMuscleGroups: []
    };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("You must be signed in.");
  }

  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const [profileRes, workoutsRes, xpRes, metricsRes] = await Promise.all([
    supabase.from("user_profiles").select("current_streak,height_cm,goal_weight_kg,weight_kg").eq("id", userId).maybeSingle(),
    supabase.from("workout_sessions").select("*").eq("user_id", userId).gte("completed_at", eightWeeksAgo.toISOString()).order("completed_at", { ascending: true }),
    supabase.from("xp_transactions").select("amount").eq("user_id", userId),
    supabase.from("body_metrics").select("*").eq("user_id", userId).order("recorded_date", { ascending: false }).limit(8)
  ]);

  if (profileRes.error) {
    throw profileRes.error;
  }
  if (workoutsRes.error) {
    throw workoutsRes.error;
  }

  const profile = (profileRes.data ?? {}) as Record<string, any>;
  const workouts = (workoutsRes.data ?? []) as Record<string, any>[];
  const weeklyWorkouts = Array.from({ length: 8 }, () => 0);
  workouts.forEach((workout) => {
    const completed = new Date(String(workout.completed_at ?? workout.created_at ?? new Date().toISOString()));
    const diffDays = Math.max(0, Math.floor((Date.now() - completed.getTime()) / 86400000));
    const index = 7 - Math.min(7, Math.floor(diffDays / 7));
    weeklyWorkouts[index] += 1;
  });

  const latestWeight = Number(((metricsRes.data ?? []) as Record<string, any>[])[0]?.weight_kg ?? profile.weight_kg ?? 0);
  const heightMeters = Number(profile.height_cm ?? 0) / 100;
  const bmi = latestWeight > 0 && heightMeters > 0 ? Number((latestWeight / (heightMeters * heightMeters)).toFixed(1)) : null;
  const goalWeight = Number(profile.goal_weight_kg ?? 0);
  const goalPaceWeeks = latestWeight > 0 && goalWeight > 0 ? Math.max(1, Math.round(Math.abs(latestWeight - goalWeight) / 0.5)) : null;
  const sessionIds = workouts.map((row) => String(row.id)).filter(Boolean);
  let favoriteMuscleGroups: FavoriteMuscleGroup[] = [];

  if (sessionIds.length > 0) {
    try {
      const { data: setRows } = await supabase
        .from("session_sets_log")
        .select("exercise_name")
        .in("session_id", sessionIds);
      const counts = new Map<string, number>();
      ((setRows ?? []) as Array<{ exercise_name?: string | null }>).forEach((row) => {
        const exerciseName = String(row.exercise_name ?? "").trim().toLowerCase();
        const match = exerciseCatalog.find((exercise) =>
          exercise.name.toLowerCase() === exerciseName || exercise.id.toLowerCase() === exerciseName
        );
        const muscleGroup = match?.muscleGroup ?? (exerciseName ? "Mixed Training" : "");
        if (muscleGroup) {
          counts.set(muscleGroup, (counts.get(muscleGroup) ?? 0) + 1);
        }
      });
      favoriteMuscleGroups = [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    } catch {
      favoriteMuscleGroups = [];
    }
  }

  return {
    streak: Number(profile.current_streak ?? 0),
    longestStreak: Number(profile.longest_streak ?? profile.current_streak ?? 0),
    consistency: Math.min(100, Math.round((weeklyWorkouts.filter(Boolean).length / 8) * 100)),
    weeklyWorkouts,
    totalWorkouts: workouts.length,
    totalSets: workouts.reduce((sum, row) => sum + Number(row.total_sets_completed ?? 0), 0),
    caloriesBurned: workouts.reduce((sum, row) => sum + Number(row.calories_burned ?? 0), 0),
    totalXp: ((xpRes.data ?? []) as Record<string, any>[]).reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
    bmi,
    goalPaceWeeks,
    favoriteMuscleGroups
  };
}

export async function saveOnboardingProfile(payload: OnboardingPayload): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("You must be signed in to save onboarding.");
  }

  if (!isSupabaseConfigured) {
    return;
  }

  const row = {
    id: userId,
    display_name: payload.displayName,
    age: payload.age,
    gender: payload.gender,
    weight_kg: payload.weightKg,
    height_cm: payload.heightCm,
    primary_goal: payload.primaryGoal,
    fitness_level: payload.fitnessLevel,
    activity_level: payload.activityLevel,
    dietary_preference: payload.dietaryPreference,
    daily_calorie_target: payload.dailyCalorieTarget,
    daily_protein_target: payload.dailyProteinTarget,
    daily_carbs_target: payload.dailyCarbsTarget,
    daily_fat_target: payload.dailyFatTarget,
    onboarding_completed: true,
    onboarding_answers: payload.answers
  };

  const { error } = await supabase.from("user_profiles").upsert(row);
  if (error) {
    throw error;
  }
}

export async function fetchActiveWorkoutPlan(): Promise<WorkoutProgram | null> {
  if (!isSupabaseConfigured) {
    return fallbackPrograms[0];
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return fallbackPrograms[0];
  }

  const { data, error } = await supabase
    .from("workout_programs")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return fallbackPrograms[0];
  }
  const row = data as Record<string, any>;
  return {
    id: String(row.id),
    name: String(row.program_name ?? "My FITNEO Plan"),
    category: String(row.category ?? "Strength"),
    durationMinutes: Number(row.duration_minutes ?? 30),
    calories: Number(row.calories ?? 250),
    exercises: Array.isArray(row.exercise_ids) ? row.exercise_ids.length : Number(row.exercise_count ?? 6),
    difficulty: Number(row.difficulty ?? 2),
    isPremium: Boolean(row.is_premium)
  };
}

export async function createChatSession(title = "New Chat"): Promise<ChatSessionSummary> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("You must be signed in.");
  }
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ user_id: userId, title })
    .select("id,title,created_at")
    .single();
  if (error) {
    throw error;
  }
  return {
    id: String(data.id),
    title: String(data.title ?? title),
    createdAt: String(data.created_at ?? new Date().toISOString())
  };
}

export async function fetchChatSessions(): Promise<ChatSessionSummary[]> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return [];
  }
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id,title,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    throw error;
  }
  const sessions = (data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title ?? "FITNEO Chat"),
    createdAt: String(row.created_at)
  }));

  if (sessions.length === 0) return [];

  const sessionIds = sessions.map((session) => session.id);
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("session_id,role,content,created_at")
    .eq("user_id", userId)
    .in("session_id", sessionIds)
    .order("created_at", { ascending: true })
    .limit(300);

  const messagesBySession = new Map<string, Array<{ role: string; content: string; created_at: string }>>();
  for (const row of messages ?? []) {
    const sessionId = String(row.session_id);
    const current = messagesBySession.get(sessionId) ?? [];
    current.push({
      role: String(row.role ?? ""),
      content: String(row.content ?? ""),
      created_at: String(row.created_at ?? "")
    });
    messagesBySession.set(sessionId, current);
  }

  const hydrated = sessions.map((session) => {
    const sessionMessages = messagesBySession.get(session.id) ?? [];
    const firstUser = sessionMessages.find((message) => message.role === "user")?.content.trim();
    const firstAssistant = sessionMessages.find((message) => message.role === "assistant")?.content.trim();
    const title = session.title && session.title !== "New Chat"
      ? session.title
      : firstUser
        ? makeChatTitle(firstUser)
        : "New Chat";
    return {
      ...session,
      title,
      preview: firstAssistant ? makeChatPreview(firstAssistant) : firstUser ? makeChatPreview(firstUser) : undefined
    };
  });

  for (const session of hydrated) {
    if (session.title !== "New Chat") {
      const original = sessions.find((item) => item.id === session.id);
      if (original?.title === "New Chat") {
        void supabase
          .from("chat_sessions")
          .update({ title: session.title })
          .eq("id", session.id)
          .eq("user_id", userId);
      }
    }
  }

  return hydrated;
}

function makeChatTitle(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return "New Chat";
  return clean.length > 34 ? `${clean.slice(0, 34)}…` : clean;
}

function makeChatPreview(value: string) {
  return value
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 72);
}

export async function updateChatSessionTitle(sessionId: string, title: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("You must be signed in.");
  }
  const { error } = await supabase
    .from("chat_sessions")
    .update({ title })
    .eq("id", sessionId)
    .eq("user_id", userId);
  if (error) {
    throw error;
  }
}

export async function fetchChatMessages(sessionId: string): Promise<ChatMessageRecord[]> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return [];
  }
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id,role,content,created_at")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => ({
    id: String(row.id),
    role: row.role === "assistant" ? "assistant" : "user",
    content: String(row.content ?? ""),
    createdAt: String(row.created_at)
  }));
}

export async function saveChatMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("You must be signed in.");
  }
  const { error } = await supabase.from("chat_messages").insert({
    user_id: userId,
    session_id: sessionId,
    role,
    content
  });
  if (error) {
    throw error;
  }
}

export async function saveNutritionLog(input: NutritionLogInput): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("You must be signed in.");
  }
  const { error } = await supabase.from("nutrition_logs").insert({
    user_id: userId,
    log_date: new Date().toISOString().slice(0, 10),
    meal_type: input.mealType,
    food_name: input.foodName,
    serving_size: input.servingSize,
    calories: Math.round(input.calories),
    protein_g: input.protein,
    carbs_g: input.carbs,
    fat_g: input.fat,
    scan_method: input.scanMethod
  });
  if (error) {
    throw error;
  }
}

export async function fetchEarnedBadges(): Promise<EarnedBadge[]> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return [];
  }
  const { data, error } = await supabase
    .from("badges")
    .select("badge_id,badge_name,earned_at")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });
  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => ({
    badgeId: String(row.badge_id),
    badgeName: String(row.badge_name ?? row.badge_id),
    earnedAt: String(row.earned_at)
  }));
}

export async function fetchLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  const userId = await getCurrentUserId();
  if (!isSupabaseConfigured) {
    return [];
  }

  if (userId) {
    const dashboard = await fetchDashboardData();
    await supabase.from("leaderboard_entries").upsert({
      user_id: userId,
      display_name: dashboard.displayName,
      total_xp: dashboard.xp,
      current_streak: dashboard.streak,
      workouts_this_week: dashboard.workoutsThisWeek,
      last_updated: new Date().toISOString()
    });
  }

  const { data, error } = await supabase
    .from("leaderboard_entries")
    .select("user_id,display_name,avatar_color,total_xp,current_streak,workouts_this_week")
    .limit(100);
  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => ({
    userId: String(row.user_id),
    displayName: String(row.display_name ?? "Athlete"),
    avatarColor: String(row.avatar_color ?? "#0A84FF"),
    totalXp: Number(row.total_xp ?? 0),
    currentStreak: Number(row.current_streak ?? 0),
    workoutsThisWeek: Number(row.workouts_this_week ?? 0),
    isCurrentUser: row.user_id === userId
  }));
}

export async function completeWorkoutSession(input: {
  name: string;
  durationSeconds: number;
  setsCompleted: number;
}): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("You must be signed in.");
  }
  const caloriesBurned = Math.max(40, Math.round(input.durationSeconds / 60 * 7));
  const xpEarned = Math.max(5, input.setsCompleted * 5);
  const { error } = await supabase.from("workout_sessions").insert({
    user_id: userId,
    session_name: input.name,
    started_at: new Date(Date.now() - input.durationSeconds * 1000).toISOString(),
    completed_at: new Date().toISOString(),
    duration_seconds: input.durationSeconds,
    total_sets_completed: input.setsCompleted,
    calories_burned: caloriesBurned,
    xp_earned: xpEarned
  });
  if (error) {
    throw error;
  }
  await supabase.from("xp_transactions").insert({
    user_id: userId,
    amount: xpEarned,
    reason: `Completed ${input.name}`
  });
}


