export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  sets: number;
  reps: string;
  restSeconds: number;
  instructions: string;
  tip: string;
  animationUrl: string;
};

export type ExerciseAccessPlan = "free" | "premium";

export const EXERCISE_CATALOG_BASELINE_COUNT = 76;
export const FREE_EXERCISE_LIMIT = 31;

const videoBase = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos";
const repositoryBase = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main";
const remoteDatasetUrl = `${repositoryBase}/data/exercises.json`;

const exerciseRows: Array<[
  string,
  string,
  string,
  Exercise["difficulty"],
  number,
  string,
  number,
  string
]> = [
  ["push_ups", "Push-ups", "Chest", "Beginner", 4, "12", 60, "0662-I4hDWkc.gif"],
  ["incline_push_ups", "Incline Push-ups", "Chest", "Beginner", 4, "15", 45, "0493-B1EVP9F.gif"],
  ["chest_dips", "Chest Dips", "Chest", "Intermediate", 3, "10", 75, "0251-9WTm7dq.gif"],
  ["dumbbell_press", "Dumbbell Press", "Chest", "Intermediate", 4, "8-12", 90, "0308-yz9nUhF.gif"],
  ["dumbbell_flyes", "Dumbbell Flyes", "Chest", "Intermediate", 3, "12", 75, "0308-yz9nUhF.gif"],
  ["cable_crossover", "Cable Crossover", "Chest", "Advanced", 3, "15", 60, "0155-0CXGHya.gif"],
  ["pull_ups", "Pull-ups", "Back", "Advanced", 4, "8", 90, "0841-HMzLjXx.gif"],
  ["bent_over_rows", "Bent-over Rows", "Back", "Intermediate", 4, "10", 75, "0574-X3cqyXz.gif"],
  ["lat_pulldown", "Lat Pulldown", "Back", "Beginner", 4, "12", 75, "0574-X3cqyXz.gif"],
  ["seated_cable_row", "Seated Cable Row", "Back", "Beginner", 4, "12", 60, "0861-fUBheHs.gif"],
  ["deadlift", "Deadlift", "Back", "Advanced", 4, "6", 120, "0043-qXTaZnJ.gif"],
  ["face_pulls", "Face Pulls", "Back", "Beginner", 3, "15", 45, "0337-L2V5Nan.gif"],
  ["overhead_press", "Overhead Press", "Shoulders", "Intermediate", 4, "8-10", 90, "0025-EIeI8Vf.gif"],
  ["lateral_raises", "Lateral Raises", "Shoulders", "Beginner", 3, "15", 45, "0178-goJ6ezq.gif"],
  ["front_raises", "Front Raises", "Shoulders", "Beginner", 3, "12", 45, "0978-TFA88iB.gif"],
  ["arnold_press", "Arnold Press", "Shoulders", "Intermediate", 3, "10", 75, "0337-L2V5Nan.gif"],
  ["upright_rows", "Upright Rows", "Shoulders", "Intermediate", 3, "12", 60, "0246-cALKspW.gif"],
  ["rear_delt_flyes", "Rear Delt Flyes", "Shoulders", "Beginner", 3, "15", 45, "0762-nFUwqG6.gif"],
  ["bicep_curls", "Bicep Curls", "Arms", "Beginner", 3, "12", 45, "0575-q6y3OhV.gif"],
  ["hammer_curls", "Hammer Curls", "Arms", "Beginner", 3, "12", 45, "0575-q6y3OhV.gif"],
  ["tricep_dips", "Tricep Dips", "Arms", "Beginner", 3, "12", 60, "0251-9WTm7dq.gif"],
  ["skull_crushers", "Skull Crushers", "Arms", "Intermediate", 3, "10", 60, "0060-h8LFzo9.gif"],
  ["concentration_curls", "Concentration Curls", "Arms", "Beginner", 3, "12", 45, "0976-kmVVAfu.gif"],
  ["overhead_tricep_ext", "Overhead Tricep Extension", "Arms", "Beginner", 3, "12", 45, "0060-h8LFzo9.gif"],
  ["squats", "Squats", "Legs", "Beginner", 4, "12", 90, "0043-qXTaZnJ.gif"],
  ["lunges", "Lunges", "Legs", "Beginner", 3, "10 each", 60, "0054-t8iSghb.gif"],
  ["romanian_deadlift", "Romanian Deadlift", "Legs", "Intermediate", 4, "10", 90, "0043-qXTaZnJ.gif"],
  ["leg_press", "Leg Press", "Legs", "Beginner", 4, "12", 90, "0102-oR7O9LW.gif"],
  ["calf_raises", "Calf Raises", "Legs", "Beginner", 4, "20", 45, "1490-6HmFgmx.gif"],
  ["bulgarian_split_squat", "Bulgarian Split Squat", "Legs", "Advanced", 3, "10 each", 75, "2368-9E25EOx.gif"],
  ["glute_bridges", "Glute Bridges", "Legs", "Beginner", 3, "15", 45, "3561-GibBPPg.gif"],
  ["plank", "Plank", "Core", "Beginner", 3, "45 sec", 45, "2135-VBAWRPG.gif"],
  ["crunches", "Crunches", "Core", "Beginner", 3, "20", 30, "0262-t6Q9YGn.gif"],
  ["russian_twists", "Russian Twists", "Core", "Beginner", 3, "20", 30, "0727-EfM77ZF.gif"],
  ["leg_raises", "Leg Raises", "Core", "Intermediate", 3, "15", 45, "0689-Hgs6Nl1.gif"],
  ["mountain_climbers", "Mountain Climbers", "Core", "Beginner", 3, "40 sec", 30, "0566-7cDmC7G.gif"],
  ["ab_wheel", "Ab Wheel", "Core", "Advanced", 3, "10", 60, "0103-xnInPfE.gif"],
  ["v_ups", "V-Ups", "Core", "Intermediate", 3, "15", 45, "1014-H6ETwO9.gif"],
  ["dead_bug", "Dead Bug", "Core", "Beginner", 3, "12 each", 30, "0262-t6Q9YGn.gif"],
  ["burpees", "Burpees", "Cardio", "Intermediate", 4, "12", 45, "1160-dK9394r.gif"],
  ["jump_rope", "Jump Rope", "Cardio", "Beginner", 4, "60 sec", 45, "2612-e1e76I2.gif"],
  ["box_jumps", "Box Jumps", "Cardio", "Intermediate", 4, "12", 60, "1374-iPm26QU.gif"],
  ["high_knees", "High Knees", "Cardio", "Beginner", 4, "40 sec", 30, "3636-ealLwvX.gif"],
  ["sprint_intervals", "Sprint Intervals", "Cardio", "Advanced", 6, "30 sec", 60, "0858-Qoujh3Q.gif"],
  ["jumping_jacks", "Jumping Jacks", "Cardio", "Beginner", 4, "45 sec", 30, "0501-mr7pkqP.gif"],
  ["bear_crawl", "Bear Crawl", "Cardio", "Intermediate", 3, "40 sec", 45, "0134-DzAScWx.gif"],
  ["tabata_rounds", "Tabata Rounds", "Cardio", "Advanced", 8, "20 sec", 10, "1160-dK9394r.gif"],
  ["emom_sets", "EMOM Sets", "Cardio", "Intermediate", 10, "1 min", 0, "1160-dK9394r.gif"],
  ["circuit_rounds", "Circuit Rounds", "Cardio", "Intermediate", 5, "1 round", 60, "1160-dK9394r.gif"],
  ["power_cleans_bw", "Power Cleans (BW)", "Full Body", "Advanced", 4, "8", 75, "0566-7cDmC7G.gif"],
  ["plyometric_sets", "Plyometric Sets", "Legs", "Advanced", 4, "10", 60, "1374-iPm26QU.gif"],
  ["cat_cow", "Cat-Cow Stretch", "Mobility", "Beginner", 2, "10", 20, "3304-MSfvriJ.gif"],
  ["downward_dog", "Downward Dog", "Mobility", "Beginner", 2, "45 sec", 20, "1363-JbC2iaV.gif"],
  ["hamstring_stretch", "Seated Hamstring Stretch", "Mobility", "Beginner", 2, "45 sec", 20, "0493-B1EVP9F.gif"],
  ["hip_flexor_stretch", "Hip Flexor Stretch", "Mobility", "Beginner", 2, "45 sec", 20, "0054-t8iSghb.gif"],
  ["childs_pose", "Child's Pose", "Mobility", "Beginner", 2, "60 sec", 20, "1363-JbC2iaV.gif"],
  ["cobra_stretch", "Cobra Stretch", "Mobility", "Beginner", 2, "45 sec", 20, "3662-XPUDTt7.gif"],
  ["pigeon_pose", "Pigeon Pose", "Mobility", "Intermediate", 2, "60 sec", 20, "2202-oMypNrz.gif"],
  ["battle_ropes", "Battle Ropes", "Cardio", "Intermediate", 4, "30 sec", 45, "2612-e1e76I2.gif"],
  ["shuttle_runs", "Shuttle Runs", "Cardio", "Intermediate", 6, "30 sec", 45, "0858-Qoujh3Q.gif"],
  ["jump_lunges", "Jump Lunges", "Cardio", "Intermediate", 3, "20", 45, "0054-t8iSghb.gif"],
  ["tuck_jumps", "Tuck Jumps", "Cardio", "Advanced", 4, "12", 60, "1374-iPm26QU.gif"],
  ["shadow_boxing", "Shadow Boxing", "Cardio", "Beginner", 4, "60 sec", 30, "2271-hoXt6wv.gif"],
  ["agility_ladder", "Agility Ladder Drills", "Cardio", "Intermediate", 4, "45 sec", 30, "0858-Qoujh3Q.gif"],
  ["cycling_sprint", "Cycling Sprints", "Cardio", "Intermediate", 6, "30 sec", 60, "0003-1ZFqTDN.gif"],
  ["stair_climber", "Stair Climber", "Cardio", "Beginner", 3, "3 min", 60, "1490-6HmFgmx.gif"],
  ["bench_press", "Bench Press", "Chest", "Intermediate", 4, "8", 120, "0025-EIeI8Vf.gif"],
  ["barbell_squat", "Barbell Squat", "Legs", "Advanced", 5, "5", 180, "0043-qXTaZnJ.gif"],
  ["weighted_pull_ups", "Weighted Pull-ups", "Back", "Advanced", 4, "6", 120, "0841-HMzLjXx.gif"],
  ["incline_dumbbell_press", "Incline Dumbbell Press", "Chest", "Intermediate", 4, "10", 90, "0319-ESOd5Pl.gif"],
  ["hack_squat", "Hack Squat", "Legs", "Advanced", 4, "10", 90, "0102-oR7O9LW.gif"],
  ["weighted_dips", "Weighted Dips", "Chest", "Advanced", 4, "8", 90, "0251-9WTm7dq.gif"],
  ["barbell_row", "Barbell Row", "Back", "Intermediate", 4, "8", 90, "0574-X3cqyXz.gif"],
  ["leg_curl", "Leg Curl", "Legs", "Beginner", 3, "12", 60, "0689-Hgs6Nl1.gif"],
  ["leg_extension", "Leg Extension", "Legs", "Beginner", 3, "12", 60, "0689-Hgs6Nl1.gif"],
  ["cable_fly", "Cable Fly", "Chest", "Intermediate", 3, "12", 60, "0308-yz9nUhF.gif"]
];

export const exerciseCatalog: Exercise[] = exerciseRows.map(
  ([id, name, muscleGroup, difficulty, sets, reps, restSeconds, gif]) => ({
    id,
    name,
    muscleGroup,
    difficulty,
    sets,
    reps,
    restSeconds,
    instructions: `Perform ${name} through a controlled, pain-free range of motion with steady breathing.`,
    tip: "Keep every rep controlled and stop if your form breaks down.",
    animationUrl: `${videoBase}/${gif}`
  })
);

const starterIds = ["push_ups", "squats", "bent_over_rows", "lunges", "overhead_press", "glute_bridges", "plank", "mountain_climbers"];
export const starterExercises = starterIds
  .map((id) => exerciseCatalog.find((exercise) => exercise.id === id))
  .filter((exercise): exercise is Exercise => Boolean(exercise));

export function findExercise(id: string) {
  return exerciseCatalog.find((exercise) => exercise.id === id);
}

export function getAccessibleExercises(userPlan: ExerciseAccessPlan): Exercise[] {
  if (__DEV__ && exerciseCatalog.length !== EXERCISE_CATALOG_BASELINE_COUNT) {
    console.warn(
      `FITNEO exercise catalog integrity warning: expected ${EXERCISE_CATALOG_BASELINE_COUNT}, received ${exerciseCatalog.length}.`
    );
  }

  if (userPlan === "premium") {
    return exerciseCatalog;
  }

  return exerciseCatalog.slice(0, FREE_EXERCISE_LIMIT);
}

export function getCategorizedExerciseLibrary(minimumCount = 30) {
  const library = exerciseCatalog.slice(0, Math.max(minimumCount, 30));
  return library.reduce<Record<string, Exercise[]>>((groups, exercise) => {
    const key = exercise.muscleGroup || "Full Body";
    groups[key] = [...(groups[key] ?? []), exercise];
    return groups;
  }, {});
}

type RemoteExerciseRow = {
  id?: string;
  name?: string;
  category?: string;
  muscle_group?: string;
  target?: string;
  instructions?: { en?: string } | string;
  gif_url?: string;
};

let remoteExerciseCache: Exercise[] | null = null;

export async function fetchRemoteExerciseCatalog(): Promise<Exercise[]> {
  if (remoteExerciseCache) return remoteExerciseCache;
  const response = await fetch(remoteDatasetUrl, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error(`Exercise repository returned HTTP ${response.status}.`);
  }
  const rows = await response.json() as RemoteExerciseRow[];
  remoteExerciseCache = rows
    .filter((row) => row.id && row.name && row.gif_url)
    .map((row) => ({
      id: `github_${row.id}`,
      name: row.name!,
      muscleGroup: row.muscle_group ?? row.target ?? row.category ?? "Full Body",
      difficulty: "Intermediate" as const,
      sets: 3,
      reps: "10-12",
      restSeconds: 60,
      instructions:
        typeof row.instructions === "string"
          ? row.instructions
          : row.instructions?.en ?? `Perform ${row.name} with controlled form.`,
      tip: "Use a controlled range of motion and stop if form breaks down.",
      animationUrl: `${repositoryBase}/${row.gif_url!.replace(/^\/+/, "")}`
    }));
  return remoteExerciseCache;
}
