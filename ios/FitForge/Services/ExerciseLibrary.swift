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
        ex("pigeon_pose", "Pigeon Pose", .legs, .intermediate, 2, "60s", 20, "Front shin across, hips square, fold forward.", "Deep glute and hip opener.")
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
        WorkoutProgram(id: "elite_physique", name: "Elite Physique Mode", category: .elite, difficulty: .advanced, durationMinutes: 60, description: "Train like a professional. An 8-week progressive overload system.", muscleGroups: [.chest, .back, .legs, .shoulders, .core], exerciseIDs: ["deadlift", "dumbbell_press", "pull_ups", "overhead_press", "bulgarian_split_squat", "ab_wheel"], isPremium: true),
        WorkoutProgram(id: "mobility_flex", name: "Mobility & Flexibility", category: .flexibility, difficulty: .beginner, durationMinutes: 20, description: "Restore mobility and loosen tight muscles.", muscleGroups: [.fullBody, .back, .legs], exerciseIDs: ["cat_cow", "downward_dog", "hamstring_stretch", "hip_flexor_stretch", "childs_pose", "pigeon_pose"], isPremium: false),
        WorkoutProgram(id: "home_no_equipment", name: "Home No-Equipment", category: .strength, difficulty: .beginner, durationMinutes: 30, description: "A complete workout using only your bodyweight.", muscleGroups: [.fullBody, .chest, .legs, .core], exerciseIDs: ["push_ups", "squats", "lunges", "plank", "glute_bridges", "mountain_climbers"], isPremium: false),
        WorkoutProgram(id: "dumbbell_only", name: "Dumbbell Only", category: .strength, difficulty: .intermediate, durationMinutes: 40, description: "Everything you need with just a pair of dumbbells.", muscleGroups: [.chest, .back, .shoulders, .arms], exerciseIDs: ["dumbbell_press", "bent_over_rows", "arnold_press", "hammer_curls", "overhead_tricep_ext"], isPremium: false),
        WorkoutProgram(id: "cardio_blast", name: "Cardio Blast", category: .cardio, difficulty: .beginner, durationMinutes: 20, description: "Get your heart pumping with steady cardio movements.", muscleGroups: [.cardio], exerciseIDs: ["jumping_jacks", "high_knees", "jump_rope", "burpees"], isPremium: false)
    ]

    static func program(id: String) -> WorkoutProgram? {
        programs.first { $0.id == id }
    }
}
