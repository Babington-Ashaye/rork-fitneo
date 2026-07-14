const fs = require("fs");

const source = fs.readFileSync("lib/exercises.ts", "utf8");

function extractArray(name) {
  const start = source.indexOf(name);
  if (start < 0) throw new Error(`Missing ${name}`);
  const open = source.indexOf("= [", start) + 2;
  if (open < 2) throw new Error(`Missing array initializer for ${name}`);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return source.slice(open, index + 1);
    }
  }
  throw new Error(`Unclosed array for ${name}`);
}

function extractObject(name) {
  const start = source.indexOf(name);
  if (start < 0) throw new Error(`Missing ${name}`);
  const open = source.indexOf("= {", start) + 2;
  if (open < 2) throw new Error(`Missing object initializer for ${name}`);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open, index + 1);
    }
  }
  throw new Error(`Unclosed object for ${name}`);
}

const exerciseRows = Function(`return ${extractArray("const exerciseRows")}`)();
const workoutPrograms = Function(`return ${extractArray("export const workoutPrograms")}`)();
const equipmentTierOverrides = Function(`return ${extractObject("const equipmentTierOverrides")}`)();
const fullEquipmentKeywords = Function(`return ${extractArray("const fullEquipmentKeywords")}`)();
const fewEquipmentKeywords = Function(`return ${extractArray("const fewEquipmentKeywords")}`)();

function inferEquipmentTier(id) {
  if (equipmentTierOverrides[id]) return equipmentTierOverrides[id];
  if (fullEquipmentKeywords.some((keyword) => id.includes(keyword))) return "full";
  if (fewEquipmentKeywords.some((keyword) => id.includes(keyword))) return "few";
  return "none";
}

const exercises = exerciseRows.map((row) => ({
  id: row[0],
  name: row[1],
  muscleGroup: row[2],
  equipmentTier: inferEquipmentTier(row[0]),
  gif: row[7],
}));
const exerciseMap = new Map(exercises.map((exercise) => [exercise.id, exercise]));

const missing = [];
const mismatches = [];
const programSummaries = [];

for (const program of workoutPrograms) {
  const seen = new Set();
  let mismatchCount = 0;
  for (const exerciseId of program.exerciseIds) {
    const exercise = exerciseMap.get(exerciseId);
    seen.add(exerciseId);
    if (!exercise) {
      missing.push(`${program.id}:${exerciseId}`);
      continue;
    }

    const isMatch =
      program.equipmentTier === "none"
        ? exercise.equipmentTier === "none"
        : program.equipmentTier === "few"
          ? exercise.equipmentTier !== "full"
          : exercise.equipmentTier !== "none";

    if (!isMatch) {
      mismatchCount += 1;
      mismatches.push({
        programId: program.id,
        programTier: program.equipmentTier,
        exerciseId,
        exerciseTier: exercise.equipmentTier,
      });
    }
  }
  programSummaries.push({
    id: program.id,
    tier: program.equipmentTier,
    totalSlots: program.exerciseIds.length,
    uniqueExercises: seen.size,
    mismatchCount,
  });
}

const walkRunExercises = exercises.filter((exercise) =>
  workoutPrograms
    .filter((program) => program.category === "Walk & Run")
    .flatMap((program) => program.exerciseIds)
    .includes(exercise.id)
);

const walkRunGifSources = [...new Set(walkRunExercises.map((exercise) => exercise.gif))];

console.log(JSON.stringify({
  exerciseCount: exercises.length,
  programCount: workoutPrograms.length,
  missingCount: missing.length,
  mismatchCount: mismatches.length,
  missing,
  mismatches,
  programSummaries,
  walkRunExerciseCount: walkRunExercises.length,
  walkRunDistinctGifSourceCount: walkRunGifSources.length,
  walkRunGifSources,
}, null, 2));
