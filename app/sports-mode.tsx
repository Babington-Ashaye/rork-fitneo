import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { exerciseCatalog } from "@/lib/exercises";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

const SPORT_ONBOARDING_KEY = "fitneo.sports.onboarding.v2";
const TOTAL_STEPS = 4;
const existingExerciseIds = new Set(exerciseCatalog.map((exercise) => exercise.id));

const sports = [
  { name: "Football (Soccer)", label: "Football", emoji: "⚽", programId: "sport-football", accent: "#3B82F6" },
  { name: "Basketball", label: "Basketball", emoji: "🏀", programId: "sport-basketball", accent: "#F97316" },
  { name: "Tennis", label: "Tennis", emoji: "🎾", programId: "sport-tennis", accent: "#22C55E" },
  { name: "Swimming", label: "Swimming", emoji: "🏊", programId: "sport-swimming", accent: "#06B6D4" },
  { name: "Running", label: "Running", emoji: "🏃", programId: "sport-running", accent: "#A855F7" },
  { name: "Rugby", label: "Rugby", emoji: "🏉", programId: "sport-rugby", accent: "#EF4444" },
  { name: "Boxing", label: "Boxing", emoji: "🥊", programId: "sport-boxing", accent: "#DC2626" },
  { name: "Cricket", label: "Cricket", emoji: "🏏", programId: "sport-cricket", accent: "#EAB308" },
  { name: "Volleyball", label: "Volleyball", emoji: "🏐", programId: "sport-volleyball", accent: "#EC4899" },
  { name: "Other", label: "Other", emoji: "🎯", programId: "sport-football", accent: "#3B82F6" }
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
  Boxing: ["Orthodox", "Southpaw", "Switch"],
  Tennis: ["Right Hand", "Left Hand", "Ambidextrous"],
  Swimming: ["Right Hand", "Left Hand", "Ambidextrous"],
  Running: ["Right Hand", "Left Hand", "Ambidextrous"],
  Cricket: ["Right Hand", "Left Hand", "Ambidextrous"]
};

const calibrationSteps = [
  "Analyzing sport demands",
  "Evaluating position needs",
  "Building sport-specific drills",
  "Calibrating intensity",
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

type TrainingGroup = {
  title: string;
  subtitle: string;
  exerciseIds: string[];
};

type DayPlan = {
  id: string;
  day: number;
  title: string;
  subtitle: string;
  exerciseIds: string[];
  rest?: boolean;
};

type WeekPlan = {
  week: number;
  theme: string;
  days: DayPlan[];
};

function ids(values: string[]) {
  return values.filter((value) => existingExerciseIds.has(value));
}

function getSportMeta(sportName: string) {
  return sports.find((sport) => sport.name === sportName) ?? sports[0];
}

function getSportProgramId(sportName: string) {
  return getSportMeta(sportName).programId;
}

function normalized(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function needsDominantHand(sportName: string) {
  return ["Tennis", "Swimming", "Running", "Cricket"].includes(sportName);
}

function getPositionQuestion(sportName: string) {
  if (needsDominantHand(sportName)) return "Dominant hand?";
  if (sportName === "Other") return "Tell us your sport";
  return "What position do you play?";
}

function getShortLevel(level: string) {
  if (level === "Semi-Professional") return "Semi-Pro";
  return level;
}

function getTagline(sport: string, position: string) {
  const key = `${sport}|${position}`;
  const exact: Record<string, string> = {
    "Football (Soccer)|Left Winger": "Speed, crossing, and 1v1 dominance",
    "Football (Soccer)|Right Winger": "Pace, cutting inside, and clinical finishing",
    "Football (Soccer)|Striker": "Movement, finishing, and explosive bursts",
    "Football (Soccer)|Goalkeeper": "Reflexes, positioning, and distribution",
    "Football (Soccer)|Centre Back": "Aerial dominance, tackling, and reading the game",
    "Football (Soccer)|Attacking Midfielder": "Creativity, quick feet, and goal contribution",
    "Football (Soccer)|Defensive Midfielder": "Interceptions, press resistance, and distribution",
    "Football (Soccer)|Full Back": "Overlapping runs, defending, and crossing",
    "Basketball|Point Guard": "Court vision, handles, and leadership",
    "Basketball|Shooting Guard": "Scoring, off-ball movement, and shooting",
    "Basketball|Small Forward": "Versatility, athleticism, and scoring",
    "Basketball|Power Forward": "Post strength, rebounding, and mid-range",
    "Basketball|Center": "Paint dominance, rim protection, and scoring",
    "Rugby|Prop": "Scrum power, carries, and physicality",
    "Rugby|Flanker": "Breakdown work, tackling, and fitness",
    "Rugby|Fly Half": "Kicking, decision making, and distribution",
    "Boxing|Orthodox": "Jab, cross, footwork, and defense",
    "Boxing|Southpaw": "Left hand power, angles, and pressure",
    "Volleyball|Setter": "Court awareness, setting accuracy, and leadership"
  };
  if (exact[key]) return exact[key];
  if (sport === "Football (Soccer)" && normalized(position).includes("midfielder")) return "Box to box engine, vision, and endurance";
  if (sport === "Running") return "Pace, endurance, and race strategy";
  if (sport === "Swimming") return "Stroke technique, turns, and conditioning";
  if (sport === "Tennis") return "Serve power, court coverage, and consistency";
  if (sport === "Cricket") return "Technique, fitness, and mental toughness";
  return "Sport-specific power, speed, and conditioning";
}

function group(title: string, subtitle: string, exerciseIds: string[]): TrainingGroup {
  return { title, subtitle, exerciseIds: ids(exerciseIds) };
}

function getTrainingGroups(sport: string, position: string): TrainingGroup[] {
  const pos = normalized(position);
  if (sport === "Football (Soccer)") {
    if (pos.includes("winger")) {
      return [
        group("Speed & Agility", "Beat the first defender", ["sprint_intervals", "shuttle_runs", "high_knees", "agility_ladder", "jump_lunges"]),
        group("Lower Body", "Explode through every stride", ["single_leg_glute_bridge", "bulgarian_split_squat", "calf_raises", "lunges", "step_ups"]),
        group("Core & Stability", "Stay balanced under pressure", ["plank", "russian_twists", "side_plank", "dead_bug", "bicycle_crunches"]),
        group("HIIT & Cardio", "Recover fast after each run", ["burpees", "tuck_jumps", "jump_lunges", "mountain_climbers", "bear_crawl"])
      ];
    }
    if (pos.includes("striker")) {
      return [
        group("Explosive Power", "Create separation in the box", ["box_jumps", "tuck_jumps", "sprint_intervals", "jump_lunges", "high_knees"]),
        group("Lower Body Strength", "Build shot power and contact balance", ["barbell_squat", "romanian_deadlift", "leg_press", "calf_raises", "hip_thrust"]),
        group("Core", "Rotate, finish, and absorb contact", ["plank", "dead_bug", "russian_twists", "v_ups", "bicycle_crunches"]),
        group("Conditioning", "Repeat sprints late in games", ["burpees", "shuttle_runs", "agility_ladder", "bear_crawl", "jump_rope"])
      ];
    }
    if (pos.includes("goalkeeper")) {
      return [
        group("Reflexes & Agility", "React faster across the goal", ["agility_ladder", "shuttle_runs", "lateral_raises", "jump_lunges", "high_knees"]),
        group("Upper Body", "Build save strength and shoulder control", ["push_ups", "pike_push_ups", "dumbbell_shoulder_press", "band_pull_aparts", "face_pulls"]),
        group("Core", "Stay rigid through dives", ["plank", "side_plank", "dead_bug", "bird_dogs", "russian_twists"]),
        group("Lower Body", "Launch harder from the ground", ["glute_bridges", "single_leg_glute_bridge", "calf_raises", "squats", "step_ups"])
      ];
    }
    if (pos.includes("centre back")) {
      return [
        group("Strength", "Win duels and hold your line", ["deadlift", "barbell_squat", "bent_over_rows", "overhead_press", "romanian_deadlift"]),
        group("Aerial & Power", "Attack every header", ["box_jumps", "pull_ups", "jump_lunges", "hip_thrust", "tuck_jumps"]),
        group("Core", "Brace through contact", ["plank", "dead_bug", "side_plank", "bird_dogs", "bicycle_crunches"]),
        group("Conditioning", "Recover between defensive actions", ["sprint_intervals", "shuttle_runs", "burpees", "mountain_climbers", "bear_crawl"])
      ];
    }
    if (pos.includes("midfielder")) {
      return [
        group("Endurance", "Own the middle for 90 minutes", ["sprint_intervals", "shuttle_runs", "high_knees", "bear_crawl", "jump_rope"]),
        group("Strength", "Ride tackles and keep possession", ["barbell_squat", "deadlift", "romanian_deadlift", "overhead_press", "bent_over_rows"]),
        group("Core", "Turn under pressure", ["plank", "russian_twists", "dead_bug", "bicycle_crunches", "v_ups"]),
        group("Athletic", "Accelerate into pockets", ["agility_ladder", "jump_lunges", "tuck_jumps", "burpees", "mountain_climbers"])
      ];
    }
    return [
      group("Endurance + Speed", "Overlap and recover quickly", ["sprint_intervals", "shuttle_runs", "high_knees", "agility_ladder", "bear_crawl"]),
      group("Lower Body", "Drive down the touchline", ["single_leg_glute_bridge", "bulgarian_split_squat", "lunges", "calf_raises", "step_ups"]),
      group("Upper Body", "Shield, cross, and defend", ["push_ups", "lateral_raises", "dumbbell_shoulder_press", "band_pull_aparts", "face_pulls"]),
      group("Core", "Stay stable in transitions", ["plank", "dead_bug", "side_plank", "russian_twists", "bird_dogs"])
    ];
  }
  if (sport === "Basketball") {
    if (pos.includes("point guard")) {
      return [
        group("Handles & Agility", "Change pace and control space", ["agility_ladder", "shuttle_runs", "high_knees", "jump_rope", "lateral_raises"]),
        group("Lower Body", "Create burst and landing control", ["squats", "lunges", "calf_raises", "box_jumps", "single_leg_glute_bridge"]),
        group("Upper Body", "Contact strength for drives", ["push_ups", "dumbbell_shoulder_press", "bicep_curls", "tricep_dips", "pull_ups"]),
        group("Conditioning", "Push tempo without fading", ["burpees", "jump_lunges", "mountain_climbers", "sprint_intervals", "tuck_jumps"])
      ];
    }
    if (pos.includes("shooting guard")) {
      return [
        group("Shooting Prep", "Build stable shoulders", ["lateral_raises", "dumbbell_shoulder_press", "push_ups", "band_pull_aparts", "face_pulls"]),
        group("Lower Body", "Rise into every jumper", ["box_jumps", "tuck_jumps", "calf_raises", "squats", "lunges"]),
        group("Conditioning", "Move sharp off the ball", ["sprint_intervals", "agility_ladder", "shuttle_runs", "jump_rope", "high_knees"]),
        group("Core", "Stay square through contact", ["plank", "russian_twists", "dead_bug", "bicycle_crunches", "side_plank"])
      ];
    }
    return [
      group("Post Strength", "Own the paint", ["deadlift", "barbell_squat", "leg_press", "hip_thrust", "romanian_deadlift"]),
      group("Upper Body", "Finish through contact", ["bench_press", "bent_over_rows", "overhead_press", "pull_ups", "dumbbell_press"]),
      group("Core", "Brace and rebound", ["plank", "dead_bug", "russian_twists", "v_ups", "bicycle_crunches"]),
      group("Athletic", "Jump, land, repeat", ["box_jumps", "tuck_jumps", "shuttle_runs", "sprint_intervals", "jump_lunges"])
    ];
  }
  if (sport === "Rugby") {
    if (pos.includes("prop")) {
      return [
        group("Raw Strength", "Scrum power and contact base", ["barbell_squat", "deadlift", "bench_press", "bent_over_rows", "overhead_press"]),
        group("Power", "Carry through tackles", ["box_jumps", "medicine_ball_slams", "farmer_carries", "sled_push", "hip_thrust"]),
        group("Core", "Brace under collision", ["plank", "dead_bug", "bird_dogs", "side_plank", "russian_twists"]),
        group("Conditioning", "Repeat heavy efforts", ["burpees", "sprint_intervals", "shuttle_runs", "bear_crawl", "mountain_climbers"])
      ];
    }
    return [
      group("Fitness & Power", "Win breakdowns repeatedly", ["sprint_intervals", "burpees", "box_jumps", "jump_lunges", "bear_crawl"]),
      group("Strength", "Tackle and jackal harder", ["deadlift", "barbell_squat", "bench_press", "pull_ups", "bent_over_rows"]),
      group("Core", "Stay locked in contact", ["plank", "russian_twists", "dead_bug", "bicycle_crunches", "side_plank"]),
      group("Conditioning", "Cover ground fast", ["shuttle_runs", "agility_ladder", "high_knees", "mountain_climbers", "tuck_jumps"])
    ];
  }
  if (sport === "Boxing") {
    return [
      group("Footwork", "Angles, rhythm, and pressure", ["agility_ladder", "shuttle_runs", "jump_rope", "high_knees", "bear_crawl"]),
      group("Upper Body Power", "Punch harder without losing guard", ["push_ups", "diamond_push_ups", "pike_push_ups", "shadow_boxing", "medicine_ball_slams"]),
      group("Core", "Rotate and resist", ["russian_twists", "bicycle_crunches", "plank", "side_plank", "v_ups"]),
      group("Conditioning", "Stay dangerous every round", ["burpees", "mountain_climbers", "jump_lunges", "tuck_jumps", "sprint_intervals"])
    ];
  }
  if (sport === "Running") {
    return [
      group("Speed Work", "Pace changes and turnover", ["sprint_intervals", "shuttle_runs", "high_knees", "jump_lunges", "agility_ladder"]),
      group("Strength", "Resilient legs and hips", ["romanian_deadlift", "single_leg_glute_bridge", "calf_raises", "step_ups", "lunges"]),
      group("Core", "Hold form when tired", ["dead_bug", "bird_dogs", "plank", "side_plank", "bicycle_crunches"]),
      group("Mobility", "Open hips and restore stride", ["hip_flexor_stretch", "hamstring_stretch", "cat_cow", "downward_dog", "cobra_stretch"])
    ];
  }
  if (sport === "Swimming") {
    return [
      group("Shoulder Strength", "Pull stronger through water", ["pull_ups", "lat_pulldown", "seated_cable_row", "face_pulls", "band_pull_aparts"]),
      group("Core", "Hold streamline under fatigue", ["dead_bug", "plank", "v_ups", "russian_twists", "bicycle_crunches"]),
      group("Flexibility", "Better reach and rotation", ["cobra_stretch", "downward_dog", "cat_cow", "childs_pose", "pigeon_pose"]),
      group("Conditioning", "Build engine without impact", ["burpees", "mountain_climbers", "jump_rope", "sprint_intervals", "bear_crawl"])
    ];
  }
  if (sport === "Tennis") {
    return [
      group("Rotational Power", "Serve and swing explosively", ["russian_twists", "medicine_ball_slams", "side_plank", "bicycle_crunches", "v_ups"]),
      group("Shoulder & Arm", "Protect the shoulder under volume", ["dumbbell_shoulder_press", "lateral_raises", "band_pull_aparts", "face_pulls", "overhead_press"]),
      group("Footwork", "Cover court with sharp stops", ["agility_ladder", "shuttle_runs", "high_knees", "sprint_intervals", "jump_rope"]),
      group("Core & Balance", "Control rotation on the move", ["plank", "dead_bug", "bird_dogs", "side_plank", "single_leg_glute_bridge"])
    ];
  }
  if (sport === "Cricket") {
    return [
      group("Batting Power", "Rotate through the ball", ["russian_twists", "medicine_ball_slams", "overhead_press", "dumbbell_row", "bent_over_rows"]),
      group("Bowling Strength", "Build repeatable lower-body drive", ["romanian_deadlift", "lunges", "calf_raises", "hip_flexor_stretch", "dumbbell_shoulder_press"]),
      group("Core", "Brace through batting and bowling", ["plank", "dead_bug", "side_plank", "bicycle_crunches", "bird_dogs"]),
      group("Conditioning", "Stay sharp in long spells", ["sprint_intervals", "shuttle_runs", "high_knees", "burpees", "jump_rope"])
    ];
  }
  if (sport === "Volleyball") {
    return [
      group("Jump Training", "Rise higher and land cleaner", ["box_jumps", "tuck_jumps", "calf_raises", "jump_lunges", "jump_rope"]),
      group("Shoulder", "Hit hard and protect your shoulder", ["dumbbell_shoulder_press", "lateral_raises", "band_pull_aparts", "face_pulls", "overhead_press"]),
      group("Core", "Stay stable in the air", ["plank", "russian_twists", "dead_bug", "v_ups", "bicycle_crunches"]),
      group("Conditioning", "Repeat jumps and transitions", ["agility_ladder", "shuttle_runs", "high_knees", "burpees", "mountain_climbers"])
    ];
  }
  return getTrainingGroups("Football (Soccer)", "Left Winger");
}

function buildWeeklyPlan(groups: TrainingGroup[]): WeekPlan[] {
  const safe = groups.length >= 4 ? groups : getTrainingGroups("Football (Soccer)", "Left Winger");
  const rest5 = { day: 5, title: "Rest", subtitle: "Active recovery today", exerciseIds: [], rest: true };
  const rest6 = { day: 6, title: "Rest", subtitle: "Recovery is essential for growth", exerciseIds: [], rest: true };
  return [
    { week: 1, theme: "Sport Foundation", days: [
      { id: "w1d1", day: 1, title: "Speed & Agility", subtitle: safe[0].subtitle, exerciseIds: safe[0].exerciseIds },
      { id: "w1d2", day: 2, title: safe[1].title, subtitle: safe[1].subtitle, exerciseIds: safe[1].exerciseIds },
      { id: "w1d3", day: 3, title: "Conditioning", subtitle: safe[3].subtitle, exerciseIds: safe[3].exerciseIds },
      { id: "w1d4", day: 4, title: safe[2].title, subtitle: safe[2].subtitle, exerciseIds: safe[2].exerciseIds },
      { ...rest5, id: "w1d5" },
      { ...rest6, id: "w1d6" }
    ] },
    { week: 2, theme: "Position-Specific Power", days: [
      { id: "w2d1", day: 1, title: "Power", subtitle: "Explode with position intent", exerciseIds: [...safe[0].exerciseIds.slice(0, 3), ...safe[1].exerciseIds.slice(0, 2)] },
      { id: "w2d2", day: 2, title: "Strength", subtitle: safe[1].subtitle, exerciseIds: safe[1].exerciseIds },
      { id: "w2d3", day: 3, title: "HIIT & Cardio", subtitle: safe[3].subtitle, exerciseIds: safe[3].exerciseIds },
      { id: "w2d4", day: 4, title: "Core & Stability", subtitle: safe[2].subtitle, exerciseIds: safe[2].exerciseIds },
      { ...rest5, id: "w2d5" },
      { ...rest6, id: "w2d6" }
    ] },
    { week: 3, theme: "Peak Conditioning", days: [
      { id: "w3d1", day: 1, title: "Full Body HIIT", subtitle: "Raise the engine", exerciseIds: [...safe[3].exerciseIds, ...safe[0].exerciseIds].slice(0, 6) },
      { id: "w3d2", day: 2, title: "Skill Conditioning", subtitle: safe[0].subtitle, exerciseIds: safe[0].exerciseIds },
      { id: "w3d3", day: 3, title: "Strength", subtitle: safe[1].subtitle, exerciseIds: safe[1].exerciseIds },
      { id: "w3d4", day: 4, title: "Recovery & Mobility", subtitle: "Move well and reset", exerciseIds: ids(["cat_cow", "downward_dog", "hip_flexor_stretch", "hamstring_stretch", "cobra_stretch"]) },
      { ...rest5, id: "w3d5" },
      { ...rest6, id: "w3d6" }
    ] },
    { week: 4, theme: "Competition Ready", days: [
      { id: "w4d1", day: 1, title: "Power & Speed", subtitle: "Sharp, fast, explosive", exerciseIds: [...safe[0].exerciseIds.slice(0, 3), ...safe[3].exerciseIds.slice(0, 2)] },
      { id: "w4d2", day: 2, title: "Upper Body & Core", subtitle: "Stable and powerful", exerciseIds: [...safe[2].exerciseIds, ...safe[1].exerciseIds].slice(0, 6) },
      { id: "w4d3", day: 3, title: "Full Body Circuit", subtitle: "Final competitive push", exerciseIds: [...safe[0].exerciseIds, ...safe[1].exerciseIds, ...safe[3].exerciseIds].slice(0, 7) },
      { id: "w4d4", day: 4, title: "Taper & Mobility", subtitle: "Fresh legs for performance", exerciseIds: ids(["downward_dog", "cat_cow", "childs_pose", "cobra_stretch", "pigeon_pose"]) },
      { ...rest5, id: "w4d5" },
      { ...rest6, id: "w4d6" }
    ] }
  ];
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
  const [mode, setMode] = useState<ScreenMode>(savedSport ? "dashboard" : "empty");
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationIndex, setCalibrationIndex] = useState(0);
  const [stats, setStats] = useState<SportStats>({ workouts: 0, xp: 0, streak: 0 });
  const slideAnim = useRef(new Animated.Value(0)).current;

  const selectedSport = getSportMeta(selected);
  const programId = getSportProgramId(selected);
  const positionOptions = positions[selected] ?? [];
  const finalPosition = useMemo(() => {
    if (selected === "Other") return customSport.trim() || "Custom sport";
    return position || positionOptions[0] || "General athlete";
  }, [customSport, position, positionOptions, selected]);
  const trainingGroups = useMemo(() => getTrainingGroups(selected, finalPosition), [finalPosition, selected]);
  const weeklyPlan = useMemo(() => buildWeeklyPlan(trainingGroups), [trainingGroups]);
  const tagline = getTagline(selected, finalPosition);
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
      if (!error) void refreshProfile();
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

  function startDay(day: DayPlan, week: WeekPlan) {
    if (day.rest) return;
    router.push({
      pathname: "/active-workout",
      params: {
        mode: selected,
        programId,
        programName: `${selectedSport.label} ${finalPosition} · Week ${week.week} Day ${day.day}`,
        exerciseIds: JSON.stringify(day.exerciseIds)
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
                <View style={[styles.stepDot, active && { backgroundColor: selectedSport.accent, borderColor: selectedSport.accent }]}>
                  {active ? <Ionicons name="checkmark" size={10} color="#FFFFFF" /> : null}
                </View>
                <Text style={[styles.stepText, active && { color: selectedSport.accent }]}>{item}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { backgroundColor: selectedSport.accent, width: `${((calibrationIndex + 1) / calibrationSteps.length) * 100}%` }]} />
        </View>
      </AppLayout>
    );
  }

  if (mode === "empty") {
    return (
      <AppLayout contentContainerStyle={styles.emptyScreen}>
        <View style={styles.emojiGrid}>
          {sports.slice(0, 9).map((sport) => (
            <View key={sport.name} style={[styles.emptySportTile, { borderColor: `${sport.accent}44` }]}>
              <Text style={styles.emptySportEmoji}>{sport.emoji}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.emptyTitle}>Choose Your Sport</Text>
        <Text style={styles.emptySubtitle}>Get a personalized training plan built around your position and level.</Text>
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
        <Text style={styles.completionEmoji}>{selectedSport.emoji}</Text>
        <Text style={styles.completionTitle}>You're all set</Text>
        <Text style={[styles.completionSubtitle, { color: selectedSport.accent }]}>{level} {selectedSport.label} Player</Text>
        <View style={styles.answerSummaryGrid}>
          <SummaryTile label="Sport" value={selectedSport.label} />
          <SummaryTile label="Level" value={level} />
          <SummaryTile label={needsDominantHand(selected) ? "Hand" : "Position"} value={finalPosition} />
        </View>
        <TouchableOpacity activeOpacity={0.86} style={[styles.primaryButton, { backgroundColor: selectedSport.accent }]} onPress={() => setMode("dashboard")}>
          <Text style={styles.primaryButtonText}>Open Sports Plan</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </AppLayout>
    );
  }

  if (mode === "dashboard") {
    return (
      <AppLayout scroll contentContainerStyle={styles.dashboardScreen}>
        <LinearGradient colors={["#151821", "#0D0D11"]} style={[styles.heroCard, { borderLeftColor: selectedSport.accent }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroIdentity}>
              <Text style={styles.heroEmoji}>{selectedSport.emoji}</Text>
              <View style={styles.heroTextBlock}>
                <Text style={styles.heroSport}>{selectedSport.label}</Text>
                <Text style={[styles.heroPosition, { color: selectedSport.accent }]}>{finalPosition}</Text>
              </View>
            </View>
            <View style={styles.heroActions}>
              <Text style={styles.levelBadge}>{getShortLevel(level)}</Text>
              <TouchableOpacity activeOpacity={0.82} style={styles.editButton} onPress={() => { setStep(0); setMode("onboarding"); }}>
                <Ionicons name="create-outline" size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.tagline}>{tagline}</Text>
          <View style={styles.heroStatRow}>
            <HeroStat value={String(stats.workouts)} label="This week" />
            <View style={styles.statDivider} />
            <HeroStat value={String(stats.streak)} label="Streak" />
            <View style={styles.statDivider} />
            <HeroStat value={String(stats.xp)} label="Sport XP" />
          </View>
        </LinearGradient>

        {weeklyPlan.map((week) => (
          <View key={week.week} style={styles.weekBlock}>
            <View style={styles.weekHeader}>
              <Text style={styles.weekTitle}>Week {week.week}</Text>
              <Text style={[styles.weekBadge, { backgroundColor: `${selectedSport.accent}24`, color: selectedSport.accent }]}>{week.theme}</Text>
            </View>
            <View style={styles.dayList}>
              {week.days.map((day) => (
                <TouchableOpacity
                  activeOpacity={day.rest ? 1 : 0.84}
                  key={day.id}
                  onPress={() => startDay(day, week)}
                  style={[
                    styles.dayCard,
                    day.rest ? styles.restDayCard : { borderLeftColor: selectedSport.accent }
                  ]}
                >
                  <View style={[styles.dayIcon, day.rest ? styles.restIcon : { backgroundColor: `${selectedSport.accent}22` }]}>
                    <Ionicons name={day.rest ? "moon" : "walk"} size={18} color={day.rest ? "#6B7280" : selectedSport.accent} />
                  </View>
                  <View style={styles.dayCopy}>
                    <Text style={[styles.dayTitle, day.rest && styles.restText]}>Day {day.day} · {day.title}</Text>
                    <Text style={styles.daySubtitle}>{day.subtitle}</Text>
                  </View>
                  {!day.rest ? (
                    <View style={[styles.playCircle, { backgroundColor: selectedSport.accent }]}>
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
      <View style={styles.topProgressRow}>
        <Text style={styles.progressText}>Step {step + 1} of {TOTAL_STEPS}</Text>
        <Text style={styles.largeStep}>{String(step + 1).padStart(2, "0")}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { backgroundColor: selectedSport.accent, width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
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
                  style={[styles.sportCard, selected === sport.name && { backgroundColor: sport.accent, borderColor: sport.accent }]}
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
              <OptionRow key={item.title} active={level === item.title} accent={selectedSport.accent} title={item.title} description={item.description} onPress={() => setLevel(item.title)} />
            ))}
          </QuestionScreen>
        ) : null}

        {step === 2 ? (
          <QuestionScreen question="How often do you train?">
            {frequencies.map((item) => (
              <OptionRow key={item.title} active={frequency === item.title} accent={selectedSport.accent} title={item.title} description={item.description} onPress={() => setFrequency(item.title)} />
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
                <OptionRow key={item} active={(position || positionOptions[0]) === item} accent={selectedSport.accent} title={item} onPress={() => setPosition(item)} />
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
        <TouchableOpacity activeOpacity={0.86} disabled={!isContinueEnabled} style={[styles.continueButton, { backgroundColor: selectedSport.accent }, !isContinueEnabled && styles.continueDisabled]} onPress={advance}>
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
  emptyScreen: { alignItems: "center", backgroundColor: "#080808", gap: 18, justifyContent: "center", paddingHorizontal: 24 },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 260 },
  emptySportTile: { alignItems: "center", backgroundColor: "#111114", borderRadius: 18, borderWidth: 1, height: 70, justifyContent: "center", width: 70 },
  emptySportEmoji: { fontSize: 32 },
  emptyTitle: { color: "#FFFFFF", fontSize: 34, fontWeight: "900", letterSpacing: -1, textAlign: "center" },
  emptySubtitle: { color: "#9CA3AF", fontSize: 14, lineHeight: 21, maxWidth: 340, textAlign: "center" },
  onboardingScreen: { backgroundColor: "#080808", gap: 16 },
  topProgressRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  progressText: { color: "#9CA3AF", fontSize: 12, fontWeight: "800" },
  largeStep: { color: "#4B5563", fontSize: 34, fontWeight: "900" },
  progressTrack: { backgroundColor: "#1A1A1F", borderRadius: 999, height: 5, overflow: "hidden", width: "100%" },
  progressFill: { borderRadius: 999, height: 5 },
  questionScreen: { gap: 20 },
  questionText: { color: "#FFFFFF", fontSize: 28, fontWeight: "800", lineHeight: 35, paddingHorizontal: 8, paddingVertical: 14, textAlign: "center" },
  optionsWrap: { gap: 10 },
  sportGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sportCard: { alignItems: "center", aspectRatio: 1, backgroundColor: "#1A1A1F", borderColor: "#2A2A35", borderRadius: 14, borderWidth: 1, justifyContent: "center", position: "relative", width: "48%" },
  sportEmoji: { fontSize: 36, marginBottom: 8 },
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
  calibrationEmoji: { fontSize: 80, textShadowColor: "rgba(59,130,246,0.45)", textShadowRadius: 28 },
  aiTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "900", letterSpacing: 4, marginTop: 8 },
  aiSubtitle: { color: "#9CA3AF", fontSize: 12, marginTop: -10 },
  calibrationCard: { backgroundColor: "#1A1A1F", borderColor: "#2A2A35", borderRadius: 18, borderWidth: 1, gap: 11, marginTop: 10, padding: 18, width: "100%" },
  calibrationRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  stepDot: { alignItems: "center", borderColor: "#4B5563", borderRadius: 8, borderWidth: 1, height: 16, justifyContent: "center", width: 16 },
  stepText: { color: "#9CA3AF", fontSize: 13, fontWeight: "700" },
  completionScreen: { alignItems: "center", backgroundColor: "#080808", gap: 18, justifyContent: "center", paddingHorizontal: 22 },
  completionEmoji: { fontSize: 80 },
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
  heroEmoji: { fontSize: 52 },
  heroTextBlock: { flex: 1 },
  heroSport: { color: "#FFFFFF", fontSize: 24, fontWeight: "900" },
  heroPosition: { fontSize: 14, fontWeight: "900", marginTop: 2 },
  heroActions: { alignItems: "flex-end", gap: 8 },
  levelBadge: { backgroundColor: "rgba(234,179,8,0.16)", borderColor: "rgba(234,179,8,0.38)", borderRadius: 999, borderWidth: 1, color: "#FACC15", fontSize: 11, fontWeight: "900", overflow: "hidden", paddingHorizontal: 10, paddingVertical: 6 },
  editButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.14)", borderRadius: 16, borderWidth: 1, height: 36, justifyContent: "center", width: 36 },
  tagline: { color: "#A1A1AA", fontSize: 13, fontWeight: "700", lineHeight: 19 },
  heroStatRow: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.045)", borderRadius: 16, flexDirection: "row", paddingVertical: 12 },
  heroStat: { alignItems: "center", flex: 1, gap: 3 },
  heroStatValue: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  heroStatLabel: { color: "#9CA3AF", fontSize: 10, fontWeight: "800" },
  statDivider: { backgroundColor: "rgba(255,255,255,0.10)", height: 28, width: 1 },
  weekBlock: { gap: 10 },
  weekHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  weekTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  weekBadge: { borderRadius: 999, fontSize: 11, fontWeight: "900", overflow: "hidden", paddingHorizontal: 10, paddingVertical: 6 },
  dayList: { gap: 9 },
  dayCard: { alignItems: "center", backgroundColor: "#1A1A1F", borderColor: "rgba(255,255,255,0.06)", borderLeftWidth: 3, borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 12, minHeight: 70, padding: 12 },
  restDayCard: { backgroundColor: "#111114", borderLeftColor: "#2B2B31", opacity: 0.72 },
  dayIcon: { alignItems: "center", borderRadius: 17, height: 38, justifyContent: "center", width: 38 },
  restIcon: { backgroundColor: "rgba(255,255,255,0.045)" },
  dayCopy: { flex: 1, gap: 3 },
  dayTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  daySubtitle: { color: "#8B8B96", fontSize: 11, fontWeight: "700" },
  restText: { color: "#9CA3AF" },
  playCircle: { alignItems: "center", borderRadius: 18, height: 36, justifyContent: "center", width: 36 }
});
