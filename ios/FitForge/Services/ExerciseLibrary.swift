import Foundation

/// Local exercise + workout program database (no backend needed).
enum ExerciseLibrary {

    static let exercises: [Exercise] = [
        // CHEST
        ex("push_ups", "Push-ups", .chest, .beginner, 4, "12", 60, "Hands shoulder-width, body in a straight line. Lower until elbows hit 90°, press back up.", "Keep your core braced and don't let your hips sag."),
        ex("incline_push_ups", "Incline Push-ups", .chest, .beginner, 4, "15", 45, "Hands on an elevated surface, press your body up and down.", "Higher surface = easier. Great for building base strength."),
        ex("chest_dips", "Chest Dips", .chest, .intermediate, 3, "10", 75, "Lean forward on parallel bars, lower until shoulders dip below elbows.", "Forward lean targets the chest more than triceps."),
        ex("dumbbell_press", "Dumbbell Press", .chest, .intermediate, 4, "8-12", 90, "Lie on a bench, press dumbbells from chest to lockout.", "Control the negative for 2 seconds each rep."),
        ex("dumbbell_flyes", "Dumbbell Flyes", .chest, .intermediate, 3, "12", 75, "Slight elbow bend, open arms wide then squeeze back together.", "Imagine hugging a tree — feel the stretch."),
        ex("cable_crossover", "Cable Crossover", .chest, .advanced, 3, "15", 60, "Pull cables down and across your body, squeezing the chest.", "Pause for 1 second at peak contraction."),

        // BACK
        ex("pull_ups", "Pull-ups", .back, .advanced, 4, "8", 90, "Hang from a bar, pull chin over the bar, lower with control.", "Drive your elbows down and back."),
        ex("bent_over_rows", "Bent-over Rows", .back, .intermediate, 4, "10", 75, "Hinge at hips, row weight to your lower ribs.", "Keep a flat back and squeeze shoulder blades."),
        ex("lat_pulldown", "Lat Pulldown", .back, .beginner, 4, "12", 75, "Pull the bar to upper chest, control the way up.", "Lead with the elbows, not the hands."),
        ex("seated_cable_row", "Seated Cable Row", .back, .beginner, 4, "12", 60, "Pull handle to your stomach, retract shoulder blades.", "Avoid using momentum from your lower back."),
        ex("deadlift", "Deadlift", .back, .advanced, 4, "6", 120, "Hinge and lift the bar by driving through the floor.", "Keep the bar close to your shins the whole way up."),
        ex("face_pulls", "Face Pulls", .back, .beginner, 3, "15", 45, "Pull rope toward your face, elbows high.", "Great for posture and rear delts."),

        // SHOULDERS
        ex("overhead_press", "Overhead Press", .shoulders, .intermediate, 4, "8-10", 90, "Press weight overhead from shoulder height to lockout.", "Brace your core to protect your lower back."),
        ex("lateral_raises", "Lateral Raises", .shoulders, .beginner, 3, "15", 45, "Raise arms out to the sides to shoulder height.", "Lead with the elbows, slight bend throughout."),
        ex("front_raises", "Front Raises", .shoulders, .beginner, 3, "12", 45, "Raise weight in front of you to shoulder height.", "Don't swing — control every rep."),
        ex("arnold_press", "Arnold Press", .shoulders, .intermediate, 3, "10", 75, "Rotate palms as you press overhead.", "Full rotation hits all three delt heads."),
        ex("upright_rows", "Upright Rows", .shoulders, .intermediate, 3, "12", 60, "Pull weight up along your body to chest height.", "Keep elbows above your wrists."),
        ex("rear_delt_flyes", "Rear Delt Flyes", .shoulders, .beginner, 3, "15", 45, "Bent over, raise arms out to the sides.", "Squeeze at the top for posture gains."),

        // ARMS
        ex("bicep_curls", "Bicep Curls", .arms, .beginner, 3, "12", 45, "Curl weight up keeping elbows pinned to your sides.", "No swinging — squeeze at the top."),
        ex("hammer_curls", "Hammer Curls", .arms, .beginner, 3, "12", 45, "Curl with palms facing each other.", "Targets the brachialis for arm thickness."),
        ex("tricep_dips", "Tricep Dips", .arms, .beginner, 3, "12", 60, "Lower your body using a bench behind you, press back up.", "Keep elbows pointing straight back."),
        ex("skull_crushers", "Skull Crushers", .arms, .intermediate, 3, "10", 60, "Lower weight to your forehead, extend back up.", "Keep upper arms still and vertical."),
        ex("concentration_curls", "Concentration Curls", .arms, .beginner, 3, "12", 45, "Seated, curl with elbow braced on your thigh.", "Peak contraction builds the bicep peak."),
        ex("overhead_tricep_ext", "Overhead Tricep Extension", .arms, .beginner, 3, "12", 45, "Hold weight overhead, lower behind your head, extend.", "Keep elbows close to your head."),

        // LEGS
        ex("squats", "Squats", .legs, .beginner, 4, "12", 90, "Sit back and down until thighs are parallel, drive up.", "Keep your chest up and knees tracking over toes."),
        ex("lunges", "Lunges", .legs, .beginner, 3, "10 each", 60, "Step forward and lower until both knees hit 90°.", "Keep your torso upright and core tight."),
        ex("romanian_deadlift", "Romanian Deadlift", .legs, .intermediate, 4, "10", 90, "Hinge at the hips, lower weight along your legs.", "Feel the hamstring stretch, keep back flat."),
        ex("leg_press", "Leg Press", .legs, .beginner, 4, "12", 90, "Press the platform away until legs are nearly straight.", "Don't lock out hard at the top."),
        ex("calf_raises", "Calf Raises", .legs, .beginner, 4, "20", 45, "Rise onto your toes, lower slowly.", "Pause at the top for a full contraction."),
        ex("bulgarian_split_squat", "Bulgarian Split Squat", .legs, .advanced, 3, "10 each", 75, "Rear foot elevated, lower into a single-leg squat.", "Keeps your balance and builds unilateral strength."),
        ex("glute_bridges", "Glute Bridges", .legs, .beginner, 3, "15", 45, "Drive hips up squeezing the glutes, lower with control.", "Pause and squeeze hard at the top."),

        // CORE
        ex("plank", "Plank", .core, .beginner, 3, "45s", 45, "Hold a straight line on forearms and toes.", "Squeeze glutes and brace abs the whole time."),
        ex("crunches", "Crunches", .core, .beginner, 3, "20", 30, "Curl your shoulders toward your hips.", "Exhale as you crunch up."),
        ex("russian_twists", "Russian Twists", .core, .beginner, 3, "20", 30, "Lean back, rotate side to side.", "Add weight to increase difficulty."),
        ex("leg_raises", "Leg Raises", .core, .intermediate, 3, "15", 45, "Lie down, raise straight legs to vertical, lower slowly.", "Keep your lower back pressed to the floor."),
        ex("mountain_climbers", "Mountain Climbers", .core, .beginner, 3, "40s", 30, "Drive knees toward chest in a plank position.", "Keep your hips low and pace steady."),
        ex("ab_wheel", "Ab Wheel", .core, .advanced, 3, "10", 60, "Roll out as far as control allows, pull back in.", "Brace hard to protect your spine."),
        ex("v_ups", "V-Ups", .core, .intermediate, 3, "15", 45, "Simultaneously lift legs and torso to form a V.", "Reach for your toes at the top."),
        ex("dead_bug", "Dead Bug", .core, .beginner, 3, "12 each", 30, "On your back, extend opposite arm and leg.", "Keep your lower back glued to the floor."),

        // CARDIO
        ex("burpees", "Burpees", .cardio, .intermediate, 4, "12", 45, "Drop, push-up, jump up explosively.", "Pace yourself — quality over speed."),
        ex("jump_rope", "Jump Rope", .cardio, .beginner, 4, "60s", 45, "Skip rope with light bounces on the balls of your feet.", "Keep elbows close and wrists doing the work."),
        ex("box_jumps", "Box Jumps", .cardio, .intermediate, 4, "12", 60, "Explode onto a box, step down softly.", "Land soft with bent knees."),
        ex("high_knees", "High Knees", .cardio, .beginner, 4, "40s", 30, "Run in place driving knees to hip height.", "Stay on the balls of your feet."),
        ex("sprint_intervals", "Sprint Intervals", .cardio, .advanced, 6, "30s", 60, "All-out sprint, then walk to recover.", "Full effort on the work, full rest after."),
        ex("jumping_jacks", "Jumping Jacks", .cardio, .beginner, 4, "45s", 30, "Jump arms and legs out and back in.", "A great full-body warm-up."),
        ex("bear_crawl", "Bear Crawl", .cardio, .intermediate, 3, "40s", 45, "Crawl forward on hands and feet, hips low.", "Keep your knees an inch off the floor."),

        // HIIT
        ex("tabata_rounds", "Tabata Rounds", .cardio, .advanced, 8, "20s", 10, "20s max effort, 10s rest, repeat 8 rounds.", "Pick one explosive movement and go all out."),
        ex("emom_sets", "EMOM Sets", .cardio, .intermediate, 10, "1 min", 0, "Every minute on the minute, complete the target reps.", "Rest is whatever's left in the minute."),
        ex("circuit_rounds", "Circuit Rounds", .cardio, .intermediate, 5, "1 round", 60, "Move through exercises back to back, rest after the round.", "Keep transitions quick."),
        ex("power_cleans_bw", "Power Cleans (BW)", .fullBody, .advanced, 4, "8", 75, "Explosive triple extension into a front-rack position.", "Drive through the floor and shrug hard."),
        ex("plyometric_sets", "Plyometric Sets", .legs, .advanced, 4, "10", 60, "Explosive jumps with soft, controlled landings.", "Reset between each rep for max power."),

        // FLEXIBILITY
        ex("cat_cow", "Cat-Cow Stretch", .core, .beginner, 2, "10", 20, "Alternate arching and rounding your spine on all fours.", "Sync the movement with your breath."),
        ex("downward_dog", "Downward Dog", .fullBody, .beginner, 2, "45s", 20, "Form an inverted V, press heels toward the floor.", "Lengthen your spine and breathe."),
        ex("hamstring_stretch", "Seated Hamstring Stretch", .legs, .beginner, 2, "45s", 20, "Reach toward your toes with a flat back.", "Never bounce — ease into the stretch."),
        ex("hip_flexor_stretch", "Hip Flexor Stretch", .legs, .beginner, 2, "45s", 20, "Kneeling lunge, push hips forward.", "Great after long periods of sitting."),
        ex("childs_pose", "Child's Pose", .back, .beginner, 2, "60s", 20, "Sit back on your heels, reach arms forward.", "A restful stretch for the back and hips."),
        ex("cobra_stretch", "Cobra Stretch", .core, .beginner, 2, "45s", 20, "Lie face down, press chest up.", "Opens the chest and stretches the abs."),
        ex("pigeon_pose", "Pigeon Pose", .legs, .intermediate, 2, "60s", 20, "Front shin across, hips square, fold forward.", "Deep glute and hip opener."),

        // NEW CARDIO
        ex("battle_ropes", "Battle Ropes", .cardio, .intermediate, 4, "30s", 45, "Stand with feet shoulder width apart and alternate powerful waves with each arm.", "Keep your core engaged and knees slightly bent throughout."),
        ex("shuttle_runs", "Shuttle Runs", .cardio, .intermediate, 6, "30s", 45, "Sprint to a marker touch the ground and sprint back to start.", "Drive hard out of each turn and stay low."),
        ex("jump_lunges", "Jump Lunges", .cardio, .intermediate, 3, "20", 45, "Lunge then explosively switch legs in the air landing in the opposite lunge.", "Land softly and absorb impact through your knees."),
        ex("tuck_jumps", "Tuck Jumps", .cardio, .advanced, 4, "12", 60, "Jump explosively and pull both knees to your chest at the peak.", "Reset fully between each rep for maximum power output."),
        ex("shadow_boxing", "Shadow Boxing", .cardio, .beginner, 4, "60s", 30, "Move continuously throwing punch combinations while staying light on your feet.", "Focus on footwork and breathing rather than just arm movement."),
        ex("agility_ladder", "Agility Ladder Drills", .cardio, .intermediate, 4, "45s", 30, "Move through ladder patterns as fast as possible with precise foot placement.", "Start slow to nail the pattern then increase speed each set."),
        ex("cycling_sprint", "Cycling Sprints", .cardio, .intermediate, 6, "30s", 60, "On a bike or stationary bike sprint at maximum effort for 30 seconds.", "Full effort on every sprint with complete recovery between."),
        ex("stair_climber", "Stair Climber", .cardio, .beginner, 3, "3 min", 60, "Climb stairs or use a stair machine at a steady controlled pace.", "Drive through the full step and avoid leaning too far forward."),

        // NEW STRENGTH & ELITE
        ex("bench_press", "Bench Press", .chest, .intermediate, 4, "8", 120, "Lie flat on a bench lower the bar to your chest and press to lockout.", "Keep your shoulder blades retracted and feet flat on the floor."),
        ex("barbell_squat", "Barbell Squat", .legs, .advanced, 5, "5", 180, "Bar on upper traps squat until thighs are parallel then drive up.", "Brace your core hard before every single rep."),
        ex("weighted_pull_ups", "Weighted Pull-ups", .back, .advanced, 4, "6", 120, "With added weight perform strict pull-ups driving elbows down and back.", "Control the negative for 2 to 3 seconds on every rep."),
        ex("incline_dumbbell_press", "Incline Dumbbell Press", .chest, .intermediate, 4, "10", 90, "On an inclined bench press dumbbells from chest level to lockout.", "Keep elbows at roughly 45 degrees to protect your shoulders."),
        ex("hack_squat", "Hack Squat", .legs, .advanced, 4, "10", 90, "On the hack squat machine lower until thighs are parallel then drive through your heels.", "Do not let your lower back round at the bottom."),
        ex("weighted_dips", "Weighted Dips", .chest, .advanced, 4, "8", 90, "With added weight perform dips leaning slightly forward to target the chest.", "Full range of motion on every rep for maximum chest activation."),
        ex("barbell_row", "Barbell Row", .back, .intermediate, 4, "8", 90, "Hinge at hips and row the barbell to your lower ribs.", "Squeeze your shoulder blades together hard at the top of each rep."),
        ex("leg_curl", "Leg Curl", .legs, .beginner, 3, "12", 60, "On the leg curl machine curl your heels toward your glutes.", "Control the weight on the way down do not let it drop."),
        ex("leg_extension", "Leg Extension", .legs, .beginner, 3, "12", 60, "On the leg extension machine extend your legs to full lockout.", "Pause for one second at the top and squeeze your quads."),
        ex("cable_fly", "Cable Fly", .chest, .intermediate, 3, "12", 60, "Pull cables down and across your body squeezing the chest at the center.", "Keep a slight elbow bend throughout and never straighten the arms fully.")
    ]

    private static func ex(_ id: String, _ name: String, _ mg: MuscleGroup, _ diff: Difficulty, _ sets: Int, _ reps: String, _ rest: Int, _ instr: String, _ tips: String) -> Exercise {
        Exercise(id: id, name: name, muscleGroup: mg, difficulty: diff, sets: sets, reps: reps, restSeconds: rest, instructions: instr, tips: tips)
    }

    static func exercise(id: String) -> Exercise? {
        exercises.first { $0.id == id }
    }

    static func exercises(ids: [String]) -> [Exercise] {
        ids.compactMap { exercise(id: $0) }
    }

    // MARK: - Programs

    static let programs: [WorkoutProgram] = [
        WorkoutProgram(id: "full_body_beginner", name: "Full Body Beginner", category: .strength, difficulty: .beginner, durationMinutes: 30, description: "A balanced full-body session to build a solid foundation.", muscleGroups: [.chest, .legs, .back, .core], exerciseIDs: ["push_ups", "squats", "bent_over_rows", "glute_bridges", "plank"], isPremium: false),
        WorkoutProgram(id: "upper_lower", name: "Upper / Lower Split", category: .strength, difficulty: .intermediate, durationMinutes: 45, description: "Hit the upper body hard with focused volume.", muscleGroups: [.chest, .back, .shoulders, .arms], exerciseIDs: ["dumbbell_press", "bent_over_rows", "overhead_press", "bicep_curls", "tricep_dips"], isPremium: false),
        WorkoutProgram(id: "push_pull_legs", name: "Push / Pull / Legs", category: .strength, difficulty: .intermediate, durationMinutes: 50, description: "The classic PPL push day for chest, shoulders and triceps.", muscleGroups: [.chest, .shoulders, .arms], exerciseIDs: ["dumbbell_press", "overhead_press", "dumbbell_flyes", "lateral_raises", "skull_crushers"], isPremium: false),
        WorkoutProgram(id: "core_crusher", name: "Core Crusher", category: .core, difficulty: .intermediate, durationMinutes: 20, description: "Burn out your abs with this focused core circuit.", muscleGroups: [.core], exerciseIDs: ["plank", "crunches", "russian_twists", "leg_raises", "v_ups", "mountain_climbers"], isPremium: false),
        WorkoutProgram(id: "hiit_burn", name: "HIIT Burn", category: .hiit, difficulty: .advanced, durationMinutes: 25, description: "High intensity intervals to torch calories fast.", muscleGroups: [.cardio, .fullBody], exerciseIDs: ["burpees", "mountain_climbers", "jumping_jacks", "high_knees", "tabata_rounds"], isPremium: false),
        WorkoutProgram(id: "athletic_conditioning", name: "Athletic Conditioning", category: .cardio, difficulty: .advanced, durationMinutes: 35, description: "Build explosive power and conditioning like an athlete.", muscleGroups: [.cardio, .legs, .core], exerciseIDs: ["box_jumps", "sprint_intervals", "bear_crawl", "plyometric_sets", "mountain_climbers"], isPremium: true),
        WorkoutProgram(id: "elite_physique", name: "Elite Physique Mode", category: .elite, difficulty: .advanced, durationMinutes: 65, description: "Train like a professional. An 8-week progressive overload system.", muscleGroups: [.chest, .back, .legs, .shoulders, .core], exerciseIDs: ["deadlift", "bench_press", "pull_ups", "overhead_press", "barbell_squat", "bulgarian_split_squat", "weighted_pull_ups", "incline_dumbbell_press", "weighted_dips", "ab_wheel"], isPremium: true),
        WorkoutProgram(id: "mobility_flex", name: "Mobility & Flexibility", category: .flexibility, difficulty: .beginner, durationMinutes: 20, description: "Restore mobility and loosen tight muscles.", muscleGroups: [.fullBody, .back, .legs], exerciseIDs: ["cat_cow", "downward_dog", "hamstring_stretch", "hip_flexor_stretch", "childs_pose", "pigeon_pose"], isPremium: false),
        WorkoutProgram(id: "home_no_equipment", name: "Home No-Equipment", category: .strength, difficulty: .beginner, durationMinutes: 30, description: "A complete workout using only your bodyweight.", muscleGroups: [.fullBody, .chest, .legs, .core], exerciseIDs: ["push_ups", "squats", "lunges", "plank", "glute_bridges", "mountain_climbers"], isPremium: false),
        WorkoutProgram(id: "dumbbell_only", name: "Dumbbell Only", category: .strength, difficulty: .intermediate, durationMinutes: 40, description: "Everything you need with just a pair of dumbbells.", muscleGroups: [.chest, .back, .shoulders, .arms], exerciseIDs: ["dumbbell_press", "bent_over_rows", "arnold_press", "hammer_curls", "overhead_tricep_ext"], isPremium: false),
        WorkoutProgram(id: "cardio_blast", name: "Cardio Blast", category: .cardio, difficulty: .beginner, durationMinutes: 20, description: "Get your heart pumping with steady cardio movements.", muscleGroups: [.cardio], exerciseIDs: ["jumping_jacks", "high_knees", "jump_rope", "burpees"], isPremium: false),

        // NEW PROGRAMS
        WorkoutProgram(id: "beginner_2day", name: "Beginner Full Body 2 Days", category: .strength, difficulty: .beginner, durationMinutes: 30, description: "A simple twice-a-week full body foundation.", muscleGroups: [.fullBody, .chest, .legs, .core], exerciseIDs: ["push_ups", "squats", "glute_bridges", "plank", "dead_bug"], isPremium: false),
        WorkoutProgram(id: "beginner_3day", name: "Beginner Full Body 3 Days", category: .strength, difficulty: .beginner, durationMinutes: 35, description: "Build your base with three full-body sessions per week.", muscleGroups: [.fullBody, .chest, .legs, .back, .core], exerciseIDs: ["push_ups", "squats", "lunges", "bent_over_rows", "plank", "crunches"], isPremium: false),
        WorkoutProgram(id: "fat_loss_circuit", name: "Fat Loss Circuit", category: .hiit, difficulty: .intermediate, durationMinutes: 30, description: "Torch calories with this fast-paced circuit.", muscleGroups: [.cardio, .fullBody], exerciseIDs: ["burpees", "mountain_climbers", "jumping_jacks", "high_knees", "jump_rope", "circuit_rounds"], isPremium: false),
        WorkoutProgram(id: "abs_core_burn", name: "Abs and Core Burn", category: .core, difficulty: .beginner, durationMinutes: 20, description: "A focused core session to build a strong midsection.", muscleGroups: [.core], exerciseIDs: ["plank", "crunches", "russian_twists", "leg_raises", "dead_bug", "mountain_climbers"], isPremium: false),
        WorkoutProgram(id: "upper_body_strength", name: "Upper Body Strength", category: .strength, difficulty: .intermediate, durationMinutes: 40, description: "Build a powerful upper body with focused strength work.", muscleGroups: [.chest, .back, .shoulders, .arms], exerciseIDs: ["dumbbell_press", "bent_over_rows", "overhead_press", "bicep_curls", "tricep_dips", "lateral_raises"], isPremium: false),
        WorkoutProgram(id: "lower_body_power", name: "Lower Body Power", category: .strength, difficulty: .intermediate, durationMinutes: 40, description: "Develop leg strength and power with compound movements.", muscleGroups: [.legs], exerciseIDs: ["squats", "lunges", "romanian_deadlift", "glute_bridges", "calf_raises", "bulgarian_split_squat"], isPremium: false),
        WorkoutProgram(id: "morning_energy", name: "Morning Energy Boost", category: .flexibility, difficulty: .beginner, durationMinutes: 15, description: "Wake up your body with gentle mobility work.", muscleGroups: [.fullBody, .back, .core], exerciseIDs: ["cat_cow", "downward_dog", "cobra_stretch", "childs_pose", "dead_bug"], isPremium: false),
        WorkoutProgram(id: "fat_burn_30", name: "30 Minute Fat Burn", category: .cardio, difficulty: .beginner, durationMinutes: 30, description: "Steady-state cardio with bodyweight moves to burn fat.", muscleGroups: [.cardio, .fullBody], exerciseIDs: ["jumping_jacks", "high_knees", "burpees", "jump_rope", "mountain_climbers", "bear_crawl"], isPremium: false),
        WorkoutProgram(id: "bodyweight_beast", name: "Bodyweight Beast", category: .strength, difficulty: .advanced, durationMinutes: 45, description: "Advanced calisthenics workout — no equipment, all power.", muscleGroups: [.fullBody, .chest, .back, .legs, .core], exerciseIDs: ["pull_ups", "push_ups", "bulgarian_split_squat", "v_ups", "bear_crawl", "burpees", "ab_wheel"], isPremium: true),
        WorkoutProgram(id: "power_conditioning", name: "Power and Conditioning", category: .elite, difficulty: .advanced, durationMinutes: 55, description: "Elite-level strength and conditioning for serious athletes.", muscleGroups: [.fullBody, .back, .legs, .shoulders, .cardio], exerciseIDs: ["deadlift", "overhead_press", "pull_ups", "box_jumps", "sprint_intervals", "power_cleans_bw", "tabata_rounds"], isPremium: true),
        WorkoutProgram(id: "cardio_blast_advanced", name: "Cardio Blast Advanced", category: .cardio, difficulty: .advanced, durationMinutes: 35, description: "High-intensity cardio with advanced drills.", muscleGroups: [.cardio], exerciseIDs: ["battle_ropes", "shuttle_runs", "cycling_sprint", "tuck_jumps", "jump_lunges", "agility_ladder", "shadow_boxing"], isPremium: true),
        WorkoutProgram(id: "athlete_cardio", name: "Athlete Cardio", category: .cardio, difficulty: .intermediate, durationMinutes: 30, description: "Sport-style cardio conditioning for athletic performance.", muscleGroups: [.cardio, .fullBody], exerciseIDs: ["shadow_boxing", "agility_ladder", "shuttle_runs", "jump_lunges", "high_knees", "bear_crawl", "battle_ropes"], isPremium: false)
    ]

    static func program(id: String) -> WorkoutProgram? {
        programs.first { $0.id == id }
    }
}
