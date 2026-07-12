export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  equipmentTier: ExerciseEquipmentTier;
  sets: number;
  reps: string;
  restSeconds: number;
  instructions: string;
  tip: string;
  animationUrl: string;
};

export type ExerciseAccessPlan = "free" | "premium";
export type ExerciseEquipmentTier = "none" | "few" | "full";

export type WorkoutProgram = {
  id: string;
  name: string;
  category: string;
  description: string;
  equipmentTier: ExerciseEquipmentTier;
  exerciseIds: string[];
  durationMinutes: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
};

export const EXERCISE_CATALOG_BASELINE_COUNT = 108;
export const FREE_EXERCISE_LIMIT = EXERCISE_CATALOG_BASELINE_COUNT;

const videoBase =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos";
const repositoryBase =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main";
const remoteDatasetUrl = `${repositoryBase}/data/exercises.json`;

// ─── EXERCISE ROWS ────────────────────────────────────────────────────────────
// Format: [id, name, muscleGroup, difficulty, sets, reps, restSeconds, gif]
// instructions and tip are now unique per exercise below

const exerciseRows: Array<[
    string,
    string,
    string,
    Exercise["difficulty"],
    number,
    string,
    number,
    string,
    string, // instructions
    string  // tip
]> = [
  // ── CHEST ──────────────────────────────────────────────────────────────────
  ["push_ups", "Push-ups", "Chest", "Beginner", 4, "12", 60,
    "0662-I4hDWkc.gif",
    "Start in a high plank position with hands shoulder-width apart. Lower your chest to the floor keeping elbows at 45 degrees, then press back up.",
    "Keep your core tight and body in a straight line throughout the movement."],

  ["incline_push_ups", "Wall Push-ups", "Chest", "Beginner", 4, "15", 45,
    "0659-LEH9jxP.gif",
    "Stand facing a wall and place your hands flat against it at shoulder height. Bend your elbows to bring your chest toward the wall then push back.",
    "Great for beginners — move feet further from the wall to increase difficulty."],

  ["wide_push_ups", "Wide Push-ups", "Chest", "Beginner", 3, "14", 45,
    "0662-I4hDWkc.gif",
    "Set up like a regular push-up but place hands wider than shoulder width. Lower chest toward the floor then press back up.",
    "A wider grip shifts more tension onto the outer chest."],

  ["decline_push_ups", "Decline Push-ups", "Chest", "Intermediate", 3, "12", 60,
    "0493-B1EVP9F.gif",
    "Place your feet on an elevated surface like a chair or bench and hands on the floor. Lower your chest toward the floor and press back up.",
    "Elevating your feet increases upper chest activation."],

  ["chest_dips", "Chest Dips", "Chest", "Intermediate", 3, "10", 75,
    "0251-9WTm7dq.gif",
    "Grip parallel bars and lower your body by bending your elbows. Lean slightly forward to emphasize the chest then press back up.",
    "Leaning forward engages more chest. Staying upright shifts focus to triceps."],

  ["dumbbell_press", "Dumbbell Press", "Chest", "Intermediate", 4, "8-12", 90,
    "0308-yz9nUhF.gif",
    "Lie on a flat bench holding a dumbbell in each hand at chest level. Press both dumbbells up until arms are extended then lower slowly.",
    "Control the descent — the lowering phase builds the most muscle."],

  ["dumbbell_flyes", "Dumbbell Flyes", "Chest", "Intermediate", 3, "12", 75,
    "0308-yz9nUhF.gif",
    "Lie on a flat bench with a dumbbell in each hand extended above your chest. Lower your arms out wide in an arc until you feel a stretch then bring them back together.",
    "Think of hugging a large tree — keep a slight bend in your elbows throughout."],

  ["incline_dumbbell_press", "Incline Dumbbell Press", "Chest", "Intermediate", 4, "10", 90,
    "0319-ESOd5Pl.gif",
    "Set a bench to 30-45 degrees. Press dumbbells from chest level upward and inward until arms are extended above upper chest.",
    "The incline angle targets the upper chest which creates a fuller look."],

  ["bench_press", "Bench Press", "Chest", "Intermediate", 4, "8", 120,
    "0025-EIeI8Vf.gif",
    "Lie on a flat bench and grip the barbell just outside shoulder width. Unrack the bar and lower it to mid-chest then press it back up.",
    "Keep your feet flat on the floor and maintain a slight arch in your lower back."],

  ["cable_crossover", "Cable Crossover", "Chest", "Advanced", 3, "15", 60,
    "0155-0CXGHya.gif",
    "Set cables to the highest position and stand in the centre. Pull both handles down and across your body meeting at the centre then return slowly.",
    "Focus on squeezing the chest at the point where your hands meet."],

  ["cable_fly", "Cable Fly", "Chest", "Intermediate", 3, "12", 60,
    "0308-yz9nUhF.gif",
    "Set cables at mid height and stand in the centre holding both handles. Bring your hands together in front of your chest in a hugging arc.",
    "Keep the motion smooth and controlled — this is an isolation movement not a press."],

  ["weighted_dips", "Weighted Dips", "Chest", "Advanced", 4, "8", 90,
    "0251-9WTm7dq.gif",
    "Attach a weight belt or hold a dumbbell between your feet. Perform dips with a slight forward lean to target the chest.",
    "Only add weight once you can comfortably do 12 clean bodyweight dips."],

  // ── BACK ───────────────────────────────────────────────────────────────────
  ["pull_ups", "Pull-ups", "Back", "Advanced", 4, "8", 90,
    "0841-HMzLjXx.gif",
    "Hang from a bar with palms facing away and hands shoulder-width apart. Pull your chest up toward the bar then lower yourself fully.",
    "Start with dead hangs and negatives if you cannot yet complete a full pull-up."],

  ["bent_over_rows", "Bent-over Rows", "Back", "Intermediate", 4, "10", 75,
    "0574-X3cqyXz.gif",
    "Hinge at the hips with a slight knee bend holding a barbell or dumbbells. Pull the weight to your lower chest then lower with control.",
    "Keep your back flat and parallel to the floor — avoid rounding your spine."],

  ["lat_pulldown", "Lat Pulldown", "Back", "Beginner", 4, "12", 75,
    "0574-X3cqyXz.gif",
    "Sit at a cable machine and grip the bar wide. Pull the bar down to your upper chest while squeezing your shoulder blades together.",
    "Lean back slightly and drive your elbows down toward your hips."],

  ["seated_cable_row", "Seated Cable Row", "Back", "Beginner", 4, "12", 60,
    "0861-fUBheHs.gif",
    "Sit at a cable row machine with feet on the platform. Pull the handle to your lower stomach keeping elbows close to your body.",
    "Squeeze your shoulder blades together at the end of each pull."],

  ["deadlift", "Deadlift", "Back", "Advanced", 4, "6", 120,
    "0043-qXTaZnJ.gif",
    "Stand over a barbell with feet hip-width apart. Hinge at the hips, grip the bar, then drive through your heels to stand fully upright.",
    "Keep the bar close to your body throughout and never round your lower back."],

  ["face_pulls", "Face Pulls", "Back", "Beginner", 3, "15", 45,
    "0337-L2V5Nan.gif",
    "Attach a rope to a cable at face height. Pull the rope toward your face splitting the ends apart at the end of the movement.",
    "Great for shoulder health — keep your elbows high throughout."],

  ["barbell_row", "Barbell Row", "Back", "Intermediate", 4, "8", 90,
    "0574-X3cqyXz.gif",
    "Hinge forward with the bar hanging at arm's length. Row the bar to your lower rib cage squeezing your back at the top.",
    "A controlled lower is just as important as the pull."],

  ["weighted_pull_ups", "Weighted Pull-ups", "Back", "Advanced", 4, "6", 120,
    "0841-HMzLjXx.gif",
    "Attach extra weight via a belt or vest. Perform pull-ups with full range of motion from dead hang to chin over bar.",
    "Only add weight when you can do 10 clean bodyweight pull-ups."],

  ["dumbbell_row", "One-arm Dumbbell Row", "Back", "Beginner", 3, "12 each", 60,
    "0574-X3cqyXz.gif",
    "Place one hand and knee on a bench for support. Row the dumbbell up toward your hip keeping your elbow close to your body.",
    "Think about pulling your elbow to the ceiling not just lifting the weight."],

  ["resistance_band_row", "Resistance Band Row", "Back", "Beginner", 3, "15", 45,
    "0861-fUBheHs.gif",
    "Anchor a resistance band at waist height and step back to create tension. Row the band toward your stomach squeezing your shoulder blades together.",
    "Keep your core braced and avoid leaning back to generate momentum."],

  ["trx_rows", "TRX Rows", "Back", "Beginner", 3, "12", 60,
    "0861-fUBheHs.gif",
    "Hold TRX handles and lean back with straight arms. Pull your chest up to the handles keeping your body rigid.",
    "The more horizontal your body the harder the movement."],

  ["supermans", "Supermans", "Back", "Beginner", 3, "15", 30,
    "1363-JbC2iaV.gif",
    "Lie face down with arms extended overhead. Simultaneously lift your arms, chest, and legs off the floor and hold briefly.",
    "Focus on squeezing your glutes and lower back at the top position."],

  // ── SHOULDERS ──────────────────────────────────────────────────────────────
  ["overhead_press", "Overhead Press", "Shoulders", "Intermediate", 4, "8-10", 90,
    "0025-EIeI8Vf.gif",
    "Stand holding a barbell at shoulder height. Press it directly overhead until arms are fully extended then lower back to shoulders.",
    "Brace your core tightly to protect your lower back during the press."],

  ["lateral_raises", "Lateral Raises", "Shoulders", "Beginner", 3, "15", 45,
    "0178-goJ6ezq.gif",
    "Hold a dumbbell in each hand by your sides. Raise both arms out to the sides until they reach shoulder height then lower slowly.",
    "Lead with your elbows not your wrists and avoid shrugging."],

  ["front_raises", "Front Raises", "Shoulders", "Beginner", 3, "12", 45,
    "0978-TFA88iB.gif",
    "Hold dumbbells in front of your thighs. Raise one or both arms forward to shoulder height then lower with control.",
    "Keep a slight bend in your elbows and avoid swinging."],

  ["arnold_press", "Arnold Press", "Shoulders", "Intermediate", 3, "10", 75,
    "0337-L2V5Nan.gif",
    "Hold dumbbells in front of your face with palms facing you. As you press up rotate your palms to face outward ending with arms extended overhead.",
    "The rotation hits all three heads of the deltoid in one movement."],

  ["upright_rows", "Upright Rows", "Shoulders", "Intermediate", 3, "12", 60,
    "0246-cALKspW.gif",
    "Hold a barbell or dumbbells with an overhand grip in front of your thighs. Pull the weight straight up toward your chin keeping it close to your body.",
    "Keep your elbows higher than your wrists throughout the lift."],

  ["rear_delt_flyes", "Rear Delt Flyes", "Shoulders", "Beginner", 3, "15", 45,
    "0762-nFUwqG6.gif",
    "Hinge forward at the hips with a dumbbell in each hand. Raise both arms out to the sides squeezing the muscles between your shoulder blades.",
    "Most people neglect rear delts — this exercise prevents shoulder imbalances."],

  ["dumbbell_shoulder_press", "Dumbbell Shoulder Press", "Shoulders", "Beginner", 4, "10", 75,
    "0337-L2V5Nan.gif",
    "Sit on a bench with back support holding dumbbells at shoulder height. Press both overhead until arms are extended then lower back down.",
    "Pressing seated removes momentum so every rep is pure shoulder strength."],

  ["pike_push_ups", "Pike Push-ups", "Shoulders", "Intermediate", 3, "10", 60,
    "0662-I4hDWkc.gif",
    "Form an inverted V shape with your hips high and hands and feet on the floor. Bend your elbows to lower your head toward the floor then push back up.",
    "The higher your hips the more this targets your shoulders like an overhead press."],

  ["band_pull_aparts", "Band Pull-aparts", "Shoulders", "Beginner", 3, "20", 30,
    "0762-nFUwqG6.gif",
    "Hold a resistance band in front of you at chest height with both hands. Pull the band apart by moving your arms out to the sides until it touches your chest.",
    "Keep your arms straight and control the band as it returns to start."],

  // ── ARMS ───────────────────────────────────────────────────────────────────
  ["bicep_curls", "Bicep Curls", "Arms", "Beginner", 3, "12", 45,
    "0575-q6y3OhV.gif",
    "Stand holding dumbbells by your sides with palms facing forward. Curl both weights up toward your shoulders then lower slowly.",
    "Keep your elbows pinned to your sides — do not swing."],

  ["hammer_curls", "Hammer Curls", "Arms", "Beginner", 3, "12", 45,
    "0575-q6y3OhV.gif",
    "Hold dumbbells by your sides with palms facing each other. Curl the weights up keeping the neutral grip throughout.",
    "Hammer curls target the brachialis which adds thickness to the arm."],

  ["tricep_dips", "Tricep Dips", "Arms", "Beginner", 3, "12", 60,
    "0251-9WTm7dq.gif",
    "Place hands on the edge of a chair or bench behind you with legs extended. Lower your body by bending your elbows then press back up.",
    "Keep your back close to the surface and elbows pointing directly behind you."],

  ["skull_crushers", "Skull Crushers", "Arms", "Intermediate", 3, "10", 60,
    "0060-h8LFzo9.gif",
    "Lie on a bench holding a barbell or dumbbells with arms extended above your chest. Bend only at the elbows to lower the weight toward your forehead.",
    "Only your elbows should move — keep upper arms completely still."],

  ["concentration_curls", "Concentration Curls", "Arms", "Beginner", 3, "12", 45,
    "0976-kmVVAfu.gif",
    "Sit on a bench with your elbow resting on the inside of your thigh. Curl a dumbbell up toward your shoulder then lower fully.",
    "Bracing your elbow on your leg isolates the bicep completely."],

  ["overhead_tricep_ext", "Overhead Tricep Extension", "Arms", "Beginner", 3, "12", 45,
    "0060-h8LFzo9.gif",
    "Hold a dumbbell overhead with both hands. Lower it behind your head by bending your elbows then extend back up.",
    "Keep your elbows pointing forward and avoid flaring them out."],

  ["diamond_push_ups", "Diamond Push-ups", "Arms", "Intermediate", 3, "12", 60,
    "0662-I4hDWkc.gif",
    "Place your hands close together under your chest forming a diamond shape with your thumbs and index fingers. Perform a push-up in this position.",
    "This variation puts maximum tension on the triceps."],

  ["cable_tricep_pushdown", "Cable Tricep Pushdown", "Arms", "Beginner", 3, "12", 45,
    "0060-h8LFzo9.gif",
    "Attach a rope or bar to a high cable. Push the attachment down until your arms are fully extended keeping elbows pinned at your sides.",
    "Squeeze the triceps hard at the bottom of every rep."],

  ["preacher_curl", "Preacher Curl", "Arms", "Intermediate", 3, "10", 60,
    "0575-q6y3OhV.gif",
    "Sit at a preacher bench and rest your upper arms on the pad. Curl the bar up toward your face then lower fully.",
    "The preacher bench removes any cheating and isolates the bicep completely."],

  // ── LEGS ───────────────────────────────────────────────────────────────────
  ["squats", "Air Squats", "Legs", "Beginner", 4, "15", 60,
    "1685-QChZi3x.gif",
    "Stand with feet shoulder-width apart. Push your hips back and bend your knees to lower until thighs are parallel to the floor then drive back up.",
    "Keep your chest up, weight in your heels, and knees tracking over your toes."],

  ["lunges", "Bodyweight Lunges", "Legs", "Beginner", 3, "10 each", 60,
    "1688-K9VL0Jq.gif",
    "Step forward with one leg and lower your back knee toward the floor. Drive through your front heel to return to standing then repeat on the other leg.",
    "Keep your front knee directly above your ankle — never let it collapse inward."],

  ["romanian_deadlift", "Romanian Deadlift", "Legs", "Intermediate", 4, "10", 90,
    "0043-qXTaZnJ.gif",
    "Hold dumbbells or a barbell in front of your thighs. Hinge at the hips pushing them back while lowering the weight down your legs until you feel a hamstring stretch.",
    "Keep the weight close to your legs and maintain a neutral spine throughout."],

  ["leg_press", "Leg Press", "Legs", "Beginner", 4, "12", 90,
    "0102-oR7O9LW.gif",
    "Sit in the leg press machine with feet on the platform hip-width apart. Lower the platform by bending your knees then press back to near full extension.",
    "Never lock your knees at the top and keep your lower back pressed against the seat."],

  ["calf_raises", "Bodyweight Calf Raises", "Legs", "Beginner", 4, "20", 45,
    "1373-bJYHBIN.gif",
    "Stand on the edge of a step or flat on the floor. Rise up onto your toes as high as possible then lower your heels below the step level.",
    "Pause at the top and bottom of each rep for maximum muscle activation."],

  ["bulgarian_split_squat", "Bulgarian Split Squat", "Legs", "Advanced", 3, "10 each", 75,
    "2368-9E25EOx.gif",
    "Place one foot behind you on a bench. Lower your back knee toward the floor by bending the front leg then drive back up.",
    "This is one of the hardest leg exercises — start with bodyweight before adding load."],

  ["glute_bridges", "Glute Bridges", "Legs", "Beginner", 3, "15", 45,
    "3561-GibBPPg.gif",
    "Lie on your back with knees bent and feet flat on the floor. Drive your hips up by squeezing your glutes until your body forms a straight line.",
    "Squeeze your glutes hard at the top and hold for one second on each rep."],

  ["wall_sit", "Wall Sit", "Legs", "Beginner", 3, "45 sec", 45,
    "3533-6YUfHPL.gif",
    "Stand with your back against a wall and slide down until your thighs are parallel to the floor. Hold this position for the prescribed time.",
    "Keep your weight in your heels and your back flat against the wall."],

  ["single_leg_glute_bridge", "Single-leg Glute Bridge", "Legs", "Intermediate", 3, "12 each", 45,
    "3561-GibBPPg.gif",
    "Lie on your back with one knee bent and the other leg extended. Drive your hips up using only the planted foot and squeeze your glute at the top.",
    "Perform all reps on one side before switching to ensure equal strength development."],

  ["goblet_squat", "Goblet Squat", "Legs", "Beginner", 4, "12", 75,
    "0043-qXTaZnJ.gif",
    "Hold a dumbbell or kettlebell at chest height with both hands. Squat down until elbows touch the inside of your knees then drive back up.",
    "The front-loaded weight forces an upright torso which is perfect squat form."],

  ["step_ups", "Step-ups", "Legs", "Beginner", 3, "12 each", 45,
    "1374-iPm26QU.gif",
    "Stand facing a step or box. Step up with one foot driving through that heel to stand on the platform then step back down.",
    "Focus on the working leg — avoid pushing off with the trailing foot."],

  ["dumbbell_goblet_lunge", "Dumbbell Goblet Lunge", "Legs", "Intermediate", 3, "10 each", 75,
    "0054-t8iSghb.gif",
    "Hold a dumbbell at chest height and perform alternating forward lunges keeping the weight close to your body.",
    "The goblet position challenges your core stability as well as your legs."],

  ["barbell_squat", "Barbell Squat", "Legs", "Advanced", 5, "5", 180,
    "0043-qXTaZnJ.gif",
    "Position a barbell across your upper traps. Squat down until thighs are at least parallel to the floor then drive powerfully back up.",
    "The barbell squat is the king of leg exercises — respect the weight and never sacrifice depth."],

  ["hack_squat", "Hack Squat", "Legs", "Advanced", 4, "10", 90,
    "0102-oR7O9LW.gif",
    "Load the hack squat machine and place feet shoulder-width on the platform. Lower until knees are at 90 degrees then press back up.",
    "A narrower stance targets the outer quads more."],

  ["leg_curl", "Leg Curl", "Legs", "Beginner", 3, "12", 60,
    "0689-Hgs6Nl1.gif",
    "Lie face down on a leg curl machine with the pad just above your heels. Curl your legs toward your glutes then lower slowly.",
    "Do not let your hips lift off the bench as you curl."],

  ["leg_extension", "Leg Extension", "Legs", "Beginner", 3, "12", 60,
    "0689-Hgs6Nl1.gif",
    "Sit in the leg extension machine with the pad resting on your shins. Extend both legs until straight then lower with control.",
    "Pause at full extension and squeeze the quads before lowering."],

  ["hip_thrust", "Hip Thrust", "Legs", "Intermediate", 4, "10", 90,
    "3561-GibBPPg.gif",
    "Sit with your upper back against a bench and a barbell across your hips. Drive your hips up by squeezing your glutes until your body is flat.",
    "The hip thrust is the most effective exercise for glute development."],

  ["smith_machine_squat", "Smith Machine Squat", "Legs", "Beginner", 4, "10", 90,
    "0043-qXTaZnJ.gif",
    "Set the Smith Machine bar at shoulder height. Position yourself under it and squat to parallel before pressing back up.",
    "Great for beginners learning squat mechanics as the bar path is fixed."],

  ["plyometric_sets", "Plyometric Sets", "Legs", "Advanced", 4, "10", 60,
    "1374-iPm26QU.gif",
    "Perform explosive jumping movements like jump squats or broad jumps focusing on maximal power output on each rep.",
    "Land softly with bent knees to absorb impact and protect your joints."],

  ["banded_squats", "Banded Squats", "Legs", "Beginner", 3, "15", 45,
    "0043-qXTaZnJ.gif",
    "Place a resistance band just above your knees and perform bodyweight squats pushing your knees out against the band throughout.",
    "The band activates the glutes and teaches proper knee tracking."],

  // ── CORE ───────────────────────────────────────────────────────────────────
  ["plank", "Front Plank", "Core", "Beginner", 3, "45 sec", 45,
    "0464-CosupLu.gif",
    "Support your body on your forearms and toes keeping your body in a straight line from head to heels. Hold the position.",
    "Squeeze your glutes and push your forearms into the floor to maintain tension."],

  ["crunches", "Crunches", "Core", "Beginner", 3, "20", 30,
    "0262-t6Q9YGn.gif",
    "Lie on your back with knees bent. Contract your abs to lift your shoulder blades off the floor then lower with control.",
    "Do not pull on your neck — keep your hands lightly behind your head or crossed on your chest."],

  ["russian_twists", "Russian Twists", "Core", "Beginner", 3, "20", 30,
    "0727-EfM77ZF.gif",
    "Sit with knees bent and lean back slightly. Rotate your torso left and right touching the floor beside you on each side.",
    "Lift your feet off the floor for greater difficulty and slow the rotation down."],

  ["leg_raises", "Leg Raises", "Core", "Intermediate", 3, "15", 45,
    "0689-Hgs6Nl1.gif",
    "Lie flat on your back with legs straight. Raise both legs to 90 degrees then lower them slowly without touching the floor.",
    "Press your lower back into the floor throughout to protect your spine."],

  ["mountain_climbers", "Mountain Climbers", "Core", "Beginner", 3, "40 sec", 30,
    "0630-RJgzwny.gif",
    "Start in a high plank position. Drive one knee toward your chest then quickly switch legs in a running motion.",
    "Keep your hips level and do not let them rise up as you speed up."],

  ["ab_wheel", "Ab Wheel", "Core", "Advanced", 3, "10", 60,
    "0103-xnInPfE.gif",
    "Kneel on the floor gripping the ab wheel handles. Roll forward extending your body until nearly flat then pull back using your core.",
    "This is one of the hardest core exercises — start with partial reps if you cannot complete full ones."],

  ["v_ups", "V-Ups", "Core", "Intermediate", 3, "15", 45,
    "1014-H6ETwO9.gif",
    "Lie flat with arms extended overhead. Simultaneously raise your legs and torso reaching your hands toward your feet at the top.",
    "Keep your legs straight and control both the rise and the descent."],

  ["dead_bug", "Dead Bug", "Core", "Beginner", 3, "12 each", 30,
    "0262-t6Q9YGn.gif",
    "Lie on your back with arms pointing to the ceiling and knees bent at 90 degrees. Lower your opposite arm and leg toward the floor alternately.",
    "Press your lower back into the floor at all times — this is the key to the exercise."],

  ["side_plank", "Side Plank", "Core", "Beginner", 3, "30 sec each", 30,
    "1774-WL4EmxJ.gif",
    "Support your body on one forearm and the side of one foot stacking your feet. Keep your body in a straight line and hold.",
    "If this is too hard bend your knees and support from your knee instead of your foot."],

  ["bicycle_crunches", "Bicycle Crunches", "Core", "Beginner", 3, "24", 30,
    "0262-t6Q9YGn.gif",
    "Lie on your back with hands behind your head. Bring one knee to your chest while rotating the opposite elbow toward it.",
    "Slow down and focus on the rotation rather than just pumping your legs fast."],

  ["reverse_crunches", "Reverse Crunches", "Core", "Beginner", 3, "15", 30,
    "0689-Hgs6Nl1.gif",
    "Lie on your back with knees bent. Pull your knees toward your chest by curling your hips off the floor then lower slowly.",
    "The movement is small and controlled — avoid swinging your legs for momentum."],

  ["bird_dogs", "Bird Dogs", "Core", "Beginner", 3, "12 each", 30,
    "3304-MSfvriJ.gif",
    "Start on hands and knees. Extend your right arm and left leg simultaneously until both are parallel to the floor then return and switch.",
    "Move slowly and focus on keeping your hips square to the floor throughout."],

  // ── CARDIO ─────────────────────────────────────────────────────────────────
  ["burpees", "Burpees", "Cardio", "Intermediate", 4, "12", 45,
    "1160-dK9394r.gif",
    "From standing, drop your hands to the floor and jump your feet back into a plank. Perform a push-up then jump feet forward and explode upward.",
    "Modify by stepping instead of jumping if needed — keep the intensity high."],

  ["jump_rope", "Jump Rope", "Cardio", "Beginner", 4, "60 sec", 45,
    "2612-e1e76I2.gif",
    "Hold a jump rope handle in each hand and swing it over your head. Jump with both feet as the rope passes under them.",
    "Land softly on the balls of your feet and keep your jumps low to the ground."],

  ["box_jumps", "Box Jumps", "Cardio", "Intermediate", 4, "12", 60,
    "1374-iPm26QU.gif",
    "Stand in front of a box or platform. Bend your knees then explode upward landing softly on top of the box with both feet.",
    "Step down rather than jumping down to protect your knees over time."],

  ["high_knees", "High Knees", "Cardio", "Beginner", 4, "40 sec", 30,
    "3636-ealLwvX.gif",
    "Run in place driving your knees up to waist height on each step. Pump your arms in rhythm with your legs.",
    "The higher you drive your knees the more your hip flexors and core work."],

  ["sprint_intervals", "Sprint Intervals", "Cardio", "Advanced", 6, "30 sec", 60,
    "0858-Qoujh3Q.gif",
    "Sprint at maximum effort for 30 seconds then rest. The sprint must be a true all-out effort not a jog.",
    "Sprint intervals burn more fat in less time than steady-state cardio."],

  ["jumping_jacks", "Star Jumps", "Cardio", "Beginner", 4, "45 sec", 30,
    "3223-HtfCpfi.gif",
    "Start with feet together and arms at your sides. Jump your feet wide while raising your arms above your head then return to start.",
    "Keep a slight bend in your knees on landing to protect your joints."],

  ["bear_crawl", "Bear Crawl", "Cardio", "Intermediate", 3, "40 sec", 45,
    "0134-DzAScWx.gif",
    "Start on all fours with knees hovering just above the ground. Move forward by simultaneously moving your right hand and left foot then switch.",
    "Keep your hips low and parallel to the floor throughout."],

  ["tabata_rounds", "Tabata Rounds", "Cardio", "Advanced", 8, "20 sec", 10,
    "1160-dK9394r.gif",
    "Choose one exercise and perform it at maximum intensity for 20 seconds then rest for 10 seconds. Repeat for 8 rounds.",
    "True Tabata demands 100 percent effort every round — choose a challenging exercise."],

  ["emom_sets", "EMOM Sets", "Cardio", "Intermediate", 10, "1 min", 0,
    "1160-dK9394r.gif",
    "At the start of every minute perform the prescribed reps then rest for the remainder of the minute. Repeat for the set number of minutes.",
    "The faster you complete your reps the more rest you earn."],

  ["circuit_rounds", "Circuit Rounds", "Cardio", "Intermediate", 5, "1 round", 60,
    "1160-dK9394r.gif",
    "Perform each exercise in the circuit back to back with minimal rest between exercises. Rest between full rounds.",
    "Circuit training keeps your heart rate elevated and maximises calorie burn."],

  ["battle_ropes", "Battle Ropes", "Cardio", "Intermediate", 4, "30 sec", 45,
    "2612-e1e76I2.gif",
    "Hold one end of a thick rope in each hand. Create alternating waves by raising and lowering each arm rapidly.",
    "Keep your knees slightly bent and your core braced throughout."],

  ["shuttle_runs", "Shuttle Runs", "Cardio", "Intermediate", 6, "30 sec", 45,
    "3636-ealLwvX.gif",
    "Place markers 10 metres apart. Sprint from one to the other touching the ground at each end and sprinting back.",
    "The direction change is where the real conditioning happens — explode out of each turn."],

  ["jump_lunges", "Jump Lunges", "Cardio", "Intermediate", 3, "20", 45,
    "0054-t8iSghb.gif",
    "Start in a lunge position then jump explosively switching legs mid-air and landing in a lunge on the opposite leg.",
    "Land softly and absorb the impact with your front knee and hip."],

  ["tuck_jumps", "Tuck Jumps", "Cardio", "Advanced", 4, "12", 60,
    "1374-iPm26QU.gif",
    "Stand with feet shoulder-width apart. Jump as high as possible tucking your knees to your chest at the peak then land softly.",
    "Swing your arms upward to generate extra height."],

  ["shadow_boxing", "Shadow Boxing", "Cardio", "Beginner", 4, "60 sec", 30,
    "2271-hoXt6wv.gif",
    "Stand in a fighting stance and throw punches combinations in the air. Move your feet and rotate your body with each punch.",
    "Focus on technique and full extension of each punch rather than just speed."],

  ["agility_ladder", "Agility Ladder Drills", "Cardio", "Intermediate", 4, "45 sec", 30,
    "3223-HtfCpfi.gif",
    "Place an agility ladder flat on the ground. Step in and out of each rung as quickly as possible using various footwork patterns.",
    "Look ahead not down at the ladder — this trains real game awareness."],

  ["cycling_sprint", "Cycling Sprints", "Cardio", "Intermediate", 6, "30 sec", 60,
    "0003-1ZFqTDN.gif",
    "On a stationary or road bike pedal at maximum resistance and cadence for 30 seconds then recover.",
    "Increase resistance slightly each week to keep progressing."],

  ["stair_climber", "Stair Climber", "Cardio", "Beginner", 3, "3 min", 60,
    "1490-6HmFgmx.gif",
    "Set the stair climber to a moderate speed and step continuously keeping your weight on your heels and back straight.",
    "Hold the rails lightly for balance only — do not lean on them or you reduce the effort."],

  ["assault_bike", "Assault Bike Intervals", "Cardio", "Advanced", 8, "20 sec", 40,
    "0003-1ZFqTDN.gif",
    "Push and pull the handles while pedalling at maximum effort. The harder you work the more resistance the bike creates.",
    "The assault bike is one of the most demanding conditioning tools — pace yourself on your first session."],

  ["rowing_machine", "Rowing Machine", "Cardio", "Beginner", 4, "2 min", 60,
    "0861-fUBheHs.gif",
    "Drive with your legs first then lean back and pull the handle to your lower chest. Return by straightening your arms then hinging forward.",
    "The legs generate 60 percent of the power — do not rely on your arms."],

  ["elliptical_intervals", "Elliptical Intervals", "Cardio", "Beginner", 5, "1 min", 45,
    "0003-1ZFqTDN.gif",
    "Alternate between high resistance and low resistance every minute on the elliptical keeping a consistent stride.",
    "Push and pull the handles to engage your upper body as well as your legs."],

  // ── FULL BODY ──────────────────────────────────────────────────────────────
  ["power_cleans_bw", "Power Cleans (BW)", "Full Body", "Advanced", 4, "8", 75,
    "0566-7cDmC7G.gif",
    "Mimic the power clean movement using bodyweight. Hinge at the hips then explosively extend your hips and shrug driving your elbows forward.",
    "Focus on the hip drive and explosive extension — this trains the same power pattern as the barbell version."],

  ["dumbbell_thrusters", "Dumbbell Thrusters", "Full Body", "Intermediate", 4, "10", 75,
    "0025-EIeI8Vf.gif",
    "Hold dumbbells at shoulder height and squat down. As you stand explosively press the dumbbells overhead in one fluid movement.",
    "The thruster combines a squat and press making it one of the most efficient full body exercises."],

  ["kettlebell_swings", "Kettlebell Swings", "Full Body", "Intermediate", 4, "15", 60,
    "1160-dK9394r.gif",
    "Stand with feet shoulder-width holding a kettlebell. Hinge at the hips to swing the bell back then drive your hips forward to swing it to chest height.",
    "This is a hip hinge not a squat — your hips should drive the movement not your arms."],

  ["farmer_carries", "Farmer Carries", "Full Body", "Beginner", 4, "40 sec", 45,
    "0858-Qoujh3Q.gif",
    "Hold a heavy weight in each hand by your sides. Walk forward with an upright posture keeping your shoulders back and core tight.",
    "Simple but brutal — farmer carries build grip strength, core stability, and conditioning simultaneously."],

  ["medicine_ball_slams", "Medicine Ball Slams", "Full Body", "Intermediate", 4, "12", 45,
    "1160-dK9394r.gif",
    "Hold a medicine ball overhead with arms extended. Slam it to the floor as hard as possible then catch the bounce and repeat.",
    "This is a power movement — use maximum effort on every slam."],

  ["sled_push", "Sled Push", "Full Body", "Advanced", 6, "20 m", 90,
    "0858-Qoujh3Q.gif",
    "Load a sled with weight and push it forward by driving through your legs and leaning into the sled handles.",
    "Keep your arms locked and drive with your legs — this is pure lower body power and conditioning."],

  // ── MOBILITY ───────────────────────────────────────────────────────────────
  ["cat_cow", "Cat-Cow Stretch", "Mobility", "Beginner", 2, "10", 20,
    "3304-MSfvriJ.gif",
    "Start on hands and knees. Arch your back upward like a cat then drop your belly toward the floor like a cow. Move slowly between the two positions.",
    "Breathe in as you arch and breathe out as you drop — link the movement to your breath."],

  ["downward_dog", "Downward Dog", "Mobility", "Beginner", 2, "45 sec", 20,
    "1363-JbC2iaV.gif",
    "Start in a plank position then push your hips up and back forming an inverted V shape. Try to push your heels toward the floor.",
    "Bend your knees slightly if your hamstrings are tight and gradually straighten them over time."],

  ["hamstring_stretch", "Seated Hamstring Stretch", "Mobility", "Beginner", 2, "45 sec", 20,
    "0493-B1EVP9F.gif",
    "Sit on the floor with legs straight. Hinge forward at the hips reaching toward your feet until you feel a stretch in the back of your legs.",
    "Do not round your lower back — the stretch comes from hip hinging not spinal flexion."],

  ["hip_flexor_stretch", "Hip Flexor Stretch", "Mobility", "Beginner", 2, "45 sec", 20,
    "0054-t8iSghb.gif",
    "Kneel on one knee with the other foot forward. Push your hips forward until you feel a stretch in the front of your back hip.",
    "Squeeze your glute on the kneeling side to intensify the stretch."],

  ["childs_pose", "Child's Pose", "Mobility", "Beginner", 2, "60 sec", 20,
    "1363-JbC2iaV.gif",
    "Kneel and sit back on your heels. Extend your arms forward and rest your forehead on the floor holding the position.",
    "Walk your hands to the left and right to stretch each side of your back."],

  ["cobra_stretch", "Cobra Stretch", "Mobility", "Beginner", 2, "45 sec", 20,
    "3662-XPUDTt7.gif",
    "Lie face down with hands under your shoulders. Press your upper body up while keeping your hips on the floor and look forward.",
    "Only go as high as feels comfortable — you should feel a stretch not pain."],

  ["pigeon_pose", "Pigeon Pose", "Mobility", "Intermediate", 2, "60 sec", 20,
    "2202-oMypNrz.gif",
    "From a plank bring one knee forward placing it behind your wrist. Extend the other leg behind you and lower your torso toward the floor.",
    "Use a cushion under your hip if the stretch is too intense."],
];

// ─── EQUIPMENT TIER CLASSIFICATION ───────────────────────────────────────────

const fullEquipmentKeywords = [
  "barbell", "bench_press", "cable", "hack",
  "lat_", "leg_curl", "leg_extension", "leg_press",
  "pulldown", "preacher", "rowing_machine",
  "seated_cable", "smith", "stair", "sled", "weighted"
];

const fewEquipmentKeywords = [
  "ab_wheel", "band", "battle_ropes", "box_jumps",
  "cycling", "dumbbell", "elliptical", "farmer",
  "goblet", "jump_rope", "kettlebell", "medicine_ball",
  "resistance_band", "skull_crushers", "overhead_tricep_ext",
  "trx", "agility_ladder", "step_ups", "shuttle_runs"
];

const equipmentTierOverrides: Partial<Record<string, ExerciseEquipmentTier>> = {
  // None — pure bodyweight
  bicycle_crunches: "none",
  bird_dogs: "none",
  burpees: "none",
  calf_raises: "none",
  crunches: "none",
  dead_bug: "none",
  diamond_push_ups: "none",
  glute_bridges: "none",
  high_knees: "none",
  incline_push_ups: "none",
  jump_lunges: "none",
  jumping_jacks: "none",
  lunges: "none",
  mountain_climbers: "none",
  pike_push_ups: "none",
  plank: "none",
  push_ups: "none",
  reverse_crunches: "none",
  russian_twists: "none",
  shadow_boxing: "none",
  side_plank: "none",
  single_leg_glute_bridge: "none",
  squats: "none",
  supermans: "none",
  tuck_jumps: "none",
  v_ups: "none",
  wall_sit: "none",
  wide_push_ups: "none",
  decline_push_ups: "none",
  bear_crawl: "none",
  cat_cow: "none",
  downward_dog: "none",
  hamstring_stretch: "none",
  hip_flexor_stretch: "none",
  childs_pose: "none",
  cobra_stretch: "none",
  pigeon_pose: "none",
  sprint_intervals: "none",
  tabata_rounds: "none",
  power_cleans_bw: "none",

  // Few — home gear (dumbbells, bands, pull-up bar, box)
  ab_wheel: "few",
  bent_over_rows: "few",
  chest_dips: "few",
  deadlift: "few",
  face_pulls: "few",
  overhead_press: "few",
  pull_ups: "few",
  romanian_deadlift: "few",
  tricep_dips: "few",
  upright_rows: "few",
  arnold_press: "few",
};

function inferEquipmentTier(id: string): ExerciseEquipmentTier {
  const override = equipmentTierOverrides[id];
  if (override) return override;
  if (fullEquipmentKeywords.some((k) => id.includes(k))) return "full";
  if (fewEquipmentKeywords.some((k) => id.includes(k))) return "few";
  return "none";
}

// ─── BUILD CATALOG ────────────────────────────────────────────────────────────

export const exerciseCatalog: Exercise[] = exerciseRows.map(
  ([id, name, muscleGroup, difficulty, sets, reps, restSeconds, gif, instructions, tip]) => ({
    id,
    name,
    muscleGroup,
    difficulty,
    equipmentTier: inferEquipmentTier(id),
    sets,
    reps,
    restSeconds,
    instructions,
    tip,
    animationUrl: `${videoBase}/${gif}`,
  })
);

// ─── WORKOUT PROGRAMS ─────────────────────────────────────────────────────────
// Each program exists in TWO versions: none (home) and full (gym)
// They are NEVER mixed. Equipment badge drives GIF selection.

export const workoutPrograms: WorkoutProgram[] = [
  // ── FULL BODY BEGINNER ────────────────────────────────────────────────────
  {
    id: "full-body-beginner-home",
    name: "Full Body Beginner",
    category: "Strength",
    description: "Build your foundation with full body bodyweight movements targeting every major muscle group. No equipment needed — train anywhere.",
    equipmentTier: "none",
    difficulty: "Beginner",
    durationMinutes: 30,
    exerciseIds: [
      "push_ups", "squats", "glute_bridges", "mountain_climbers",
      "dead_bug", "side_plank", "jumping_jacks", "leg_raises"
    ],
  },
  {
    id: "full-body-beginner-gym",
    name: "Full Body Beginner",
    category: "Strength",
    description: "Build your foundation using gym machines and free weights. Targets every major muscle group with progressive overload built in.",
    equipmentTier: "full",
    difficulty: "Beginner",
    durationMinutes: 45,
    exerciseIds: [
      "goblet_squat", "dumbbell_press", "seated_cable_row",
      "leg_press", "dumbbell_shoulder_press", "cable_tricep_pushdown",
      "bicep_curls", "plank"
    ],
  },

  // ── UPPER LOWER SPLIT ─────────────────────────────────────────────────────
  {
    id: "upper-lower-split-home",
    name: "Upper / Lower Split",
    category: "Strength",
    description: "Alternate upper and lower body days for maximum recovery and volume. Zero equipment needed — built for 4 training days per week.",
    equipmentTier: "none",
    difficulty: "Intermediate",
    durationMinutes: 40,
    exerciseIds: [
      "push_ups", "pike_push_ups", "diamond_push_ups", "tricep_dips",
      "squats", "lunges", "glute_bridges", "single_leg_glute_bridge", "calf_raises"
    ],
  },
  {
    id: "upper-lower-split-gym",
    name: "Upper / Lower Split",
    category: "Strength",
    description: "Alternate upper and lower body days with free weights and machines for serious strength and size gains. Best for 4 training days.",
    equipmentTier: "full",
    difficulty: "Intermediate",
    durationMinutes: 60,
    exerciseIds: [
      "bench_press", "bent_over_rows", "overhead_press", "lat_pulldown",
      "barbell_squat", "romanian_deadlift", "leg_curl", "leg_extension", "calf_raises"
    ],
  },

  // ── PUSH PULL LEGS ────────────────────────────────────────────────────────
  {
    id: "push-pull-legs-home",
    name: "Push Pull Legs",
    category: "Strength",
    description: "High volume bodyweight split targeting push, pull, and leg movements. Designed for 5 to 6 training days per week.",
    equipmentTier: "none",
    difficulty: "Intermediate",
    durationMinutes: 45,
    exerciseIds: [
      "push_ups", "pike_push_ups", "diamond_push_ups", "tricep_dips",
      "supermans", "side_plank",
      "squats", "lunges", "glute_bridges", "wall_sit", "calf_raises"
    ],
  },
  {
    id: "push-pull-legs-gym",
    name: "Push Pull Legs",
    category: "Strength",
    description: "Maximum volume gym split for building size and strength simultaneously. Uses barbells, cables, and dumbbells. Best for 5 to 6 days.",
    equipmentTier: "full",
    difficulty: "Advanced",
    durationMinutes: 75,
    exerciseIds: [
      "bench_press", "incline_dumbbell_press", "dumbbell_shoulder_press", "lateral_raises", "cable_tricep_pushdown",
      "deadlift", "pull_ups", "seated_cable_row", "face_pulls", "bicep_curls",
      "barbell_squat", "leg_press", "romanian_deadlift", "leg_curl", "calf_raises"
    ],
  },

  // ── HIIT BURN ─────────────────────────────────────────────────────────────
  {
    id: "hiit-burn-home",
    name: "HIIT Burn",
    category: "Conditioning",
    description: "Maximum calorie burn in minimum time. Short intense intervals with structured rest designed for fat loss and conditioning. No equipment needed.",
    equipmentTier: "none",
    difficulty: "Intermediate",
    durationMinutes: 24,
    exerciseIds: [
      "burpees", "jump_lunges", "high_knees", "mountain_climbers",
      "tuck_jumps", "shadow_boxing", "bear_crawl", "jumping_jacks"
    ],
  },

  // ── CORE CONTROL ──────────────────────────────────────────────────────────
  {
    id: "core-control-home",
    name: "Core Control",
    category: "Core",
    description: "Build a bulletproof core with stability and anti-rotation movements. Reduces injury risk across all training. No equipment needed.",
    equipmentTier: "none",
    difficulty: "Beginner",
    durationMinutes: 20,
    exerciseIds: [
      "plank", "dead_bug", "bicycle_crunches", "leg_raises",
      "russian_twists", "side_plank", "bird_dogs", "reverse_crunches"
    ],
  },
  {
    id: "core-control-gym",
    name: "Core Control",
    category: "Core",
    description: "Advanced core training using cables and gym equipment for maximum tension and control. For those ready to go beyond bodyweight.",
    equipmentTier: "full",
    difficulty: "Intermediate",
    durationMinutes: 30,
    exerciseIds: [
      "cable_crossover", "ab_wheel", "leg_raises",
      "russian_twists", "side_plank", "v_ups", "dead_bug"
    ],
  },

  // ── HOME NO EQUIPMENT (FULL PROGRAM) ─────────────────────────────────────
  {
    id: "home-no-equipment",
    name: "Home No-Equipment",
    category: "Strength",
    description: "A complete 4-week training program requiring absolutely zero equipment. Train anywhere, anytime, with progressive overload built in across every week.",
    equipmentTier: "none",
    difficulty: "Beginner",
    durationMinutes: 30,
    exerciseIds: [
      "push_ups", "squats", "lunges", "glute_bridges",
      "mountain_climbers", "plank", "dead_bug", "jumping_jacks"
    ],
  },

  // ── MOBILITY RESET ────────────────────────────────────────────────────────
  {
    id: "mobility-reset",
    name: "Mobility Reset",
    category: "Mobility",
    description: "Restore range of motion and reduce stiffness with targeted stretching and mobility work. Essential after heavy training days.",
    equipmentTier: "none",
    difficulty: "Beginner",
    durationMinutes: 20,
    exerciseIds: [
      "cat_cow", "downward_dog", "hamstring_stretch",
      "hip_flexor_stretch", "childs_pose", "cobra_stretch", "pigeon_pose"
    ],
  },

  // ── ATHLETIC CONDITIONING ─────────────────────────────────────────────────
  {
    id: "athletic-conditioning-home",
    name: "Athletic Conditioning",
    category: "Conditioning",
    description: "Sport-focused conditioning that builds speed, endurance, and explosive power. Designed for athletes who want to perform better in their sport.",
    equipmentTier: "none",
    difficulty: "Advanced",
    durationMinutes: 40,
    exerciseIds: [
      "sprint_intervals", "high_knees", "bear_crawl",
      "jump_lunges", "burpees", "shadow_boxing", "mountain_climbers", "tuck_jumps"
    ],
  },
  {
    id: "athletic-conditioning-gym",
    name: "Athletic Conditioning",
    category: "Conditioning",
    description: "Gym-based athletic conditioning using equipment for maximum performance gains. Builds explosive strength and stamina for competitive sport.",
    equipmentTier: "full",
    difficulty: "Advanced",
    durationMinutes: 50,
    exerciseIds: [
      "sled_push", "box_jumps", "battle_ropes",
      "rowing_machine", "assault_bike", "plyometric_sets", "shuttle_runs"
    ],
  },

  // ── LEG POWER ─────────────────────────────────────────────────────────────
  {
    id: "leg-power-home",
    name: "Leg Power",
    category: "Strength",
    description: "Build powerful legs using only bodyweight. Progressive volume and explosive movements for strength and muscle development.",
    equipmentTier: "none",
    difficulty: "Intermediate",
    durationMinutes: 35,
    exerciseIds: [
      "squats", "lunges", "bulgarian_split_squat",
      "step_ups", "wall_sit", "calf_raises",
      "jump_lunges", "single_leg_glute_bridge"
    ],
  },
  {
    id: "leg-power-gym",
    name: "Leg Power",
    category: "Strength",
    description: "Maximum leg development using barbell, machines, and dumbbells. Builds size and strength across quads, hamstrings, and glutes.",
    equipmentTier: "full",
    difficulty: "Advanced",
    durationMinutes: 60,
    exerciseIds: [
      "barbell_squat", "leg_press", "romanian_deadlift",
      "leg_curl", "leg_extension", "hip_thrust",
      "bulgarian_split_squat", "calf_raises"
    ],
  },

  // ── UPPER BODY PUMP ───────────────────────────────────────────────────────
  {
    id: "upper-body-pump-home",
    name: "Upper Body Pump",
    category: "Strength",
    description: "Build upper body strength and muscle using only bodyweight push and pull movements. Train chest, back, shoulders, and arms without a gym.",
    equipmentTier: "none",
    difficulty: "Intermediate",
    durationMinutes: 35,
    exerciseIds: [
      "push_ups", "wide_push_ups", "diamond_push_ups", "pike_push_ups",
      "tricep_dips", "supermans", "side_plank", "decline_push_ups"
    ],
  },
  {
    id: "upper-body-pump-gym",
    name: "Upper Body Pump",
    category: "Strength",
    description: "Chest, back, shoulders, and arms targeted with dumbbells and cables. High rep ranges designed to maximise the muscle pump.",
    equipmentTier: "full",
    difficulty: "Intermediate",
    durationMinutes: 50,
    exerciseIds: [
      "dumbbell_press", "dumbbell_row", "dumbbell_shoulder_press",
      "bicep_curls", "cable_tricep_pushdown", "lateral_raises",
      "face_pulls", "band_pull_aparts"
    ],
  },

  // ── FAT LOSS CIRCUIT ──────────────────────────────────────────────────────
  {
    id: "fat-loss-circuit",
    name: "Fat Loss Circuit",
    category: "Conditioning",
    description: "Back-to-back exercises with minimal rest to keep your heart rate elevated and torch calories. Zero equipment, maximum burn.",
    equipmentTier: "none",
    difficulty: "Intermediate",
    durationMinutes: 30,
    exerciseIds: [
      "jumping_jacks", "high_knees", "burpees", "mountain_climbers",
      "jump_lunges", "shadow_boxing", "bear_crawl", "tuck_jumps"
    ],
  },

  // ── RECOVERY FLOW ─────────────────────────────────────────────────────────
  {
    id: "recovery-flow",
    name: "Recovery Flow",
    category: "Mobility",
    description: "Gentle active recovery combining mobility and low-intensity core work. Use this on rest days to reduce soreness and improve flexibility.",
    equipmentTier: "none",
    difficulty: "Beginner",
    durationMinutes: 20,
    exerciseIds: [
      "cat_cow", "childs_pose", "downward_dog", "cobra_stretch",
      "pigeon_pose", "hamstring_stretch", "hip_flexor_stretch", "dead_bug"
    ],
  },
];

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

export function findExercise(id: string) {
  return exerciseCatalog.find((e) => e.id === id);
}

export function getEquipmentTierLabel(tier: ExerciseEquipmentTier) {
  if (tier === "none") return "🏠 Home · No Equipment";
  if (tier === "few") return "🏠 Home · Some Gear";
  return "🏋️ Gym · Equipment Required";
}

export function getEquipmentTierShortLabel(tier: ExerciseEquipmentTier) {
  if (tier === "none") return "0 EQ";
  if (tier === "few") return "HOME";
  return "GYM";
}

export function getEquipmentTierBadgeColor(tier: ExerciseEquipmentTier) {
  if (tier === "none") return "#16A34A"; // green
  if (tier === "few") return "#D97706"; // amber
  return "#2563EB";                     // blue
}

export function getWorkoutProgramExercises(
  programId: string | undefined,
  _userPlan?: ExerciseAccessPlan
): Exercise[] {
  const program = workoutPrograms.find((p) => p.id === programId);
  if (!program) return [];
  return program.exerciseIds
    .map((id) => findExercise(id))
    .filter((e): e is Exercise => Boolean(e));
}

export function getProgramsByEquipmentTier(tier: ExerciseEquipmentTier) {
  return workoutPrograms.filter((p) => p.equipmentTier === tier);
}

export function getCategorizedExerciseLibrary() {
  return exerciseCatalog.reduce<Record<string, Exercise[]>>((groups, ex) => {
    const key = ex.muscleGroup || "Full Body";
    groups[key] = [...(groups[key] ?? []), ex];
    return groups;
  }, {});
}

export function getExercisesByEquipmentTier(
  exercises: Exercise[] = exerciseCatalog
) {
  return exercises.reduce<Record<ExerciseEquipmentTier, Exercise[]>>(
    (groups, ex) => {
      groups[ex.equipmentTier] = [...groups[ex.equipmentTier], ex];
      return groups;
    },
    { none: [], few: [], full: [] }
  );
}

export function getAccessibleExercises(
  userPlan: ExerciseAccessPlan
): Exercise[] {
  return userPlan === "premium"
    ? exerciseCatalog
    : exerciseCatalog.slice(0, FREE_EXERCISE_LIMIT);
}

// ─── REMOTE EXERCISE FETCH ────────────────────────────────────────────────────

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
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Exercise repository returned HTTP ${response.status}.`);
  }
  const rows = (await response.json()) as RemoteExerciseRow[];
  remoteExerciseCache = rows
    .filter((row) => row.id && row.name && row.gif_url)
    .map((row) => ({
      id: `github_${row.id}`,
      name: row.name!,
      muscleGroup: row.muscle_group ?? row.target ?? row.category ?? "Full Body",
      difficulty: "Intermediate" as const,
      equipmentTier: inferEquipmentTier(row.id!),
      sets: 3,
      reps: "10-12",
      restSeconds: 60,
      instructions:
        typeof row.instructions === "string"
          ? row.instructions
          : (row.instructions?.en ?? `Perform ${row.name} with controlled form.`),
      tip: "Use a controlled range of motion and stop if form breaks down.",
      animationUrl: `${repositoryBase}/${row.gif_url!.replace(/^\/+/, "")}`,
    }));
  return remoteExerciseCache;
}
