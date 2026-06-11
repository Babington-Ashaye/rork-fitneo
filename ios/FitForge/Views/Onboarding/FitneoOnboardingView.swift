import SwiftUI

struct FitneoOnboardingView: View {
    @Environment(FitneoStore.self) private var store
    var onFinish: (OnboardingData) -> Void

    @State private var step = 0
    @State private var name = ""
    @State private var age: Double = 25
    @State private var weight: Double = 70
    @State private var weightUnit = "kg"
    @State private var height: Double = 175
    @State private var level: Difficulty = .beginner
    @State private var goals: Set<String> = []
    @State private var equipment: Set<String> = []
    @State private var showPaywall = false

    // Extended onboarding
    @State private var sessionDuration: String?
    @State private var trainingDays: Int = 3
    @State private var trainingStyles: Set<String> = []
    @State private var movementComfort: [String: Bool] = [
        "Barbell Deadlift": false,
        "Pull-ups": false,
        "Overhead Press": false,
        "Bulgarian Split Squat": false,
        "Box Jumps": false
    ]
    @State private var recovery: String?
    @State private var activityLevel: String?
    @State private var motivation: String?
    @State private var biggestChallenge: String?
    @State private var programExperience: Set<String> = []
    @State private var injuries: Set<String> = []
    @State private var pastObstacles: Set<String> = []
    @State private var workoutTimeOfDay: String?
    @State private var longTermVision: String?
    @State private var coachingStyle: String?
    @State private var dietaryPrefs: Set<String> = []

    // Body measurements (optional)
    @State private var chestVal = ""
    @State private var waistVal = ""
    @State private var hipsVal = ""
    @State private var armsVal = ""
    @State private var thighsVal = ""

    // Total steps including extended questions
    private let totalSteps = 20

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            VStack(spacing: 0) {
                if step > 0 && step < totalSteps { progressBar.padding(.horizontal, 24).padding(.top, 12) }
                Group {
                    switch step {
                    case 0: welcome
                    case 1: personalInfo
                    case 2: fitnessLevel
                    case 3: goalsStep
                    case 4: equipmentStep
                    case 5: sessionDurationStep
                    case 6: trainingDaysStep
                    case 7: trainingStylesStep
                    case 8: movementComfortStep
                    case 9: recoveryStep
                    case 10: activityLevelStep
                    case 11: motivationStep
                    case 12: biggestChallengeStep
                    case 13: programExperienceStep
                    case 14: injuriesStep
                    case 15: bodyMeasurementsStep
                    case 16: pastObstaclesStep
                    case 17: workoutTimeStep
                    case 18: longTermVisionStep
                    case 19: coachingStyleStep
                    default: subscriptionStep
                    }
                }
                .transition(.asymmetric(insertion: .move(edge: .trailing).combined(with: .opacity),
                                        removal: .move(edge: .leading).combined(with: .opacity)))
                .frame(maxHeight: .infinity)

                if step > 0 {
                    PillButton(title: step == totalSteps - 1 ? "Continue to Free Trial" : step == totalSteps ? "Finish" : "Continue", icon: nil) { advance() }
                        .padding(.horizontal, 24).padding(.bottom, 8)
                        .disabled(step == 1 && name.isEmpty)
                        .opacity(step == 1 && name.isEmpty ? 0.5 : 1)
                    dots.padding(.bottom, step == totalSteps ? 32 : 20)
                }
            }
        }
        .sheet(isPresented: $showPaywall, onDismiss: finish) { PaywallView() }
    }

    private var progressBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.white.opacity(0.08))
                Capsule().fill(Theme.accent)
                    .frame(width: geo.size.width * Double(step) / Double(totalSteps))
                    .shadow(color: Theme.accent.opacity(0.6), radius: 8)
                    .animation(.spring(response: 0.5), value: step)
            }
        }
        .frame(height: 6)
    }

    private var dots: some View {
        HStack(spacing: 6) {
            ForEach(0..<min(totalSteps, 8), id: \.self) { i in
                let dotStep = i * (totalSteps / 8)
                Circle().fill(step >= dotStep ? Theme.accent : Color.white.opacity(0.2))
                    .frame(width: step >= dotStep ? 8 : 6, height: step >= dotStep ? 8 : 6)
            }
        }
    }

    // MARK: - Original steps

    private var welcome: some View {
        VStack(spacing: 20) {
            Spacer()
            ZStack {
                Circle().fill(Theme.accent.opacity(0.25)).frame(width: 160, height: 160).blur(radius: 30)
                Image(systemName: "bolt.heart.fill").font(.system(size: 70)).foregroundStyle(Theme.accent)
                    .shadow(color: Theme.accent, radius: 20)
            }
            Text("FITNEO").font(.system(size: 44, weight: .bold)).foregroundStyle(.white).tracking(4)
            Text("Your AI-Powered Fitness OS").font(.system(size: 17)).foregroundStyle(Theme.textSecondary)
            Spacer()
            PillButton(title: "Get Started", icon: "arrow.right") { advance() }.padding(.horizontal, 24)
            Spacer().frame(height: 30)
        }
    }

    private var personalInfo: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                stepHeader("ABOUT YOU", "Tell us about yourself")
                TextField("Your name", text: $name).foregroundStyle(.white).tint(Theme.accent)
                    .padding(16).glassCard(cornerRadius: 14)
                slider("Age", $age, 16...80, "")
                HStack {
                    Text("Weight unit").font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.textSecondary)
                    Spacer()
                    unitToggle($weightUnit, ["kg", "lbs"])
                }
                slider("Weight", $weight, 30...200, weightUnit)
                slider("Height", $height, 120...220, "cm")
            }
            .padding(24)
        }
        .scrollIndicators(.hidden)
    }

    private var fitnessLevel: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepHeader("LEVEL", "What's your fitness level?")
            ForEach(Difficulty.allCases, id: \.self) { d in
                selectCard(title: d.title, subtitle: levelDesc(d), icon: "figure.run", selected: level == d) { level = d }
            }
            Spacer()
        }
        .padding(24)
    }

    private var goalsStep: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                stepHeader("GOALS", "What do you want to achieve?")
                ForEach(AppUser.goalOptions, id: \.self) { g in
                    multiCard(title: g, selected: goals.contains(g)) {
                        if goals.contains(g) { goals.remove(g) } else { goals.insert(g) }
                    }
                }
            }
            .padding(24)
        }
        .scrollIndicators(.hidden)
    }

    private var equipmentStep: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                stepHeader("EQUIPMENT", "What do you have access to?")
                ForEach(AppUser.equipmentOptions, id: \.self) { e in
                    multiCard(title: e, selected: equipment.contains(e)) {
                        if equipment.contains(e) { equipment.remove(e) } else { equipment.insert(e) }
                    }
                }
            }
            .padding(24)
        }
        .scrollIndicators(.hidden)
    }

    // MARK: - Extended onboarding steps

    private var sessionDurationStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepHeader("SESSION TIME", "How much time per session?")
            let options = ["15-20 min", "20-30 min", "30-45 min", "45-60 min", "60+ min"]
            ForEach(options, id: \.self) { o in
                selectCard(title: o, subtitle: nil, icon: "clock", selected: sessionDuration == o) { sessionDuration = o }
            }
            Spacer()
        }.padding(24)
    }

    private var trainingDaysStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepHeader("SCHEDULE", "How many days per week?")
            ForEach([2, 3, 4, 5, 6], id: \.self) { d in
                let subtitle = d <= 3 ? "Great for beginners" : d >= 5 ? "For dedicated athletes" : "Balanced routine"
                selectCard(title: "\(d) days", subtitle: subtitle, icon: "calendar", selected: trainingDays == d) { trainingDays = d }
            }
            Spacer()
        }.padding(24)
    }

    private var trainingStylesStep: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                stepHeader("TRAINING STYLE", "What type of training do you prefer?")
                let styles = ["Strength Training", "HIIT", "Cardio", "Core & Abs", "Flexibility & Mobility", "Mixed & Balanced"]
                ForEach(styles, id: \.self) { s in
                    multiCard(title: s, selected: trainingStyles.contains(s)) {
                        if trainingStyles.contains(s) { trainingStyles.remove(s) } else { trainingStyles.insert(s) }
                    }
                }
            }
            .padding(24)
        }
        .scrollIndicators(.hidden)
    }

    private var movementComfortStep: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                stepHeader("MOVEMENT COMFORT", "Are you comfortable with these?")
                ForEach(Array(movementComfort.keys.sorted()), id: \.self) { move in
                    HStack {
                        Text(move).font(.system(size: 15, weight: .medium)).foregroundStyle(.white)
                        Spacer()
                        Toggle("", isOn: Binding(
                            get: { movementComfort[move] ?? false },
                            set: { movementComfort[move] = $0 }
                        ))
                        .labelsHidden().tint(Theme.accent)
                    }
                    .padding(14).glassCard(cornerRadius: 14)
                }
            }
            .padding(24)
        }
        .scrollIndicators(.hidden)
    }

    private var recoveryStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepHeader("RECOVERY", "How's your recovery?")
            let options = [
                ("I sleep well and recover fast", "7+ hours, feel fresh daily"),
                ("Average sleep and recovery", "6-7 hours, moderate energy"),
                ("I often feel tired or sore", "Under 6 hours or frequent fatigue"),
                ("I am recovering from an injury", "Working through or rehabbing")
            ]
            ForEach(options, id: \.0) { title, subtitle in
                selectCard(title: title, subtitle: subtitle, icon: "bed.double.fill", selected: recovery == title) { recovery = title }
            }
            Spacer()
        }.padding(24)
    }

    private var activityLevelStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepHeader("DAILY ACTIVITY", "Outside workouts, how active are you?")
            let options = [
                ("Mostly sedentary", "Desk job, little movement"),
                ("Lightly active", "Some walking and daily movement"),
                ("Moderately active", "On my feet most of the day"),
                ("Very active", "Physical job or sport daily")
            ]
            ForEach(options, id: \.0) { title, subtitle in
                selectCard(title: title, subtitle: subtitle, icon: "figure.walk", selected: activityLevel == title) { activityLevel = title }
            }
            Spacer()
        }.padding(24)
    }

    private var motivationStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepHeader("MOTIVATION", "What keeps you going?")
            let options = [
                "Looking better and building confidence",
                "Getting stronger and more capable",
                "Competing or performing at a high level",
                "General health and longevity",
                "Mental health and stress relief",
                "Proving something to myself"
            ]
            ForEach(options, id: \.self) { o in
                multiCard(title: o, selected: motivation == o) { motivation = o }
            }
            Spacer()
        }.padding(24)
    }

    private var biggestChallengeStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepHeader("CHALLENGE", "Your biggest fitness challenge?")
            let options = [
                "Staying consistent and not skipping",
                "Not knowing what to do or how to train",
                "Lack of time",
                "Low energy or motivation",
                "Diet and nutrition",
                "Recovering properly between sessions",
                "Previous injury or physical limitation"
            ]
            ForEach(options, id: \.self) { o in
                selectCard(title: o, subtitle: nil, icon: "questionmark.circle", selected: biggestChallenge == o) { biggestChallenge = o }
            }
            Spacer()
        }.padding(24)
    }

    private var programExperienceStep: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                stepHeader("EXPERIENCE", "Trained with these styles before?")
                let exps = ["Push Pull Legs", "Upper Lower Split", "Full Body Training", "HIIT Programs", "Strength & Powerlifting", "Bodybuilding & Hypertrophy", "None of the above"]
                ForEach(exps, id: \.self) { e in
                    multiCard(title: e, selected: programExperience.contains(e)) {
                        if e == "None of the above" {
                            programExperience = ["None of the above"]
                        } else {
                            programExperience.remove("None of the above")
                            if programExperience.contains(e) { programExperience.remove(e) } else { programExperience.insert(e) }
                        }
                    }
                }
            }
            .padding(24)
        }
        .scrollIndicators(.hidden)
    }

    private var injuriesStep: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                stepHeader("INJURIES", "Any injuries or limitations?")
                let injs = ["No injuries or limitations", "Lower back pain or sensitivity", "Knee pain or injury", "Shoulder pain or injury", "Hip pain or tightness", "Wrist pain or injury", "Recent surgery or rehabilitation"]
                ForEach(injs, id: \.self) { i in
                    multiCard(title: i, selected: injuries.contains(i)) {
                        if i == "No injuries or limitations" {
                            injuries = ["No injuries or limitations"]
                        } else {
                            injuries.remove("No injuries or limitations")
                            if injuries.contains(i) { injuries.remove(i) } else { injuries.insert(i) }
                        }
                    }
                }
            }
            .padding(24)
        }
        .scrollIndicators(.hidden)
    }

    private var bodyMeasurementsStep: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                stepHeader("MEASUREMENTS", "Starting measurements? (Optional)")
                Text("This helps FITNEO AI track your progress more accurately.")
                    .font(.system(size: 13)).foregroundStyle(Theme.textSecondary)

                VStack(spacing: 12) {
                    measureRow("Chest", $chestVal)
                    measureRow("Waist", $waistVal)
                    measureRow("Hips", $hipsVal)
                    measureRow("Arms (bicep)", $armsVal)
                    measureRow("Thighs", $thighsVal)
                }

                Button {
                    chestVal = ""; waistVal = ""; hipsVal = ""; armsVal = ""; thighsVal = ""
                } label: {
                    Text("Skip for now").font(.system(size: 14, weight: .medium)).foregroundStyle(Theme.accent)
                }
                .buttonStyle(.plain).padding(.top, 6)
            }
            .padding(24)
        }
        .scrollIndicators(.hidden)
    }

    private var pastObstaclesStep: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                stepHeader("PAST OBSTACLES", "What stopped you before?")
                let obstacles = [
                    "Nothing — this is my first serious attempt",
                    "Lack of consistency",
                    "No clear plan or direction",
                    "Injuries or physical setbacks",
                    "Poor nutrition habits",
                    "Lack of time",
                    "Low motivation or mental barriers",
                    "Programs too hard or too easy"
                ]
                ForEach(obstacles, id: \.self) { o in
                    multiCard(title: o, selected: pastObstacles.contains(o)) {
                        if o.hasPrefix("Nothing") {
                            pastObstacles = [o]
                        } else {
                            pastObstacles.remove(obstacles.first(where: { $0.hasPrefix("Nothing") }) ?? "")
                            if pastObstacles.contains(o) { pastObstacles.remove(o) } else { pastObstacles.insert(o) }
                        }
                    }
                }
            }
            .padding(24)
        }
        .scrollIndicators(.hidden)
    }

    private var workoutTimeStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepHeader("TIME OF DAY", "When do you prefer to work out?")
            let options = ["Early morning (before 8am)", "Morning (8am-11am)", "Midday (11am-2pm)", "Afternoon (2pm-5pm)", "Evening (5pm-8pm)", "Late night (after 8pm)", "No preference"]
            ForEach(options, id: \.self) { o in
                selectCard(title: o, subtitle: nil, icon: "clock.fill", selected: workoutTimeOfDay == o) { workoutTimeOfDay = o }
            }
            Spacer()
        }.padding(24)
    }

    private var longTermVisionStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepHeader("YOUR VISION", "Where do you want to be in 6 months?")
            let options = [
                "Significantly leaner and more defined",
                "Noticeably more muscular and stronger",
                "Improved athletic performance and endurance",
                "More flexible, mobile and pain-free",
                "Generally healthier and more energetic",
                "Competing or reaching a performance milestone"
            ]
            ForEach(options, id: \.self) { o in
                selectCard(title: o, subtitle: nil, icon: "target", selected: longTermVision == o) { longTermVision = o }
            }
            Spacer()
        }.padding(24)
    }

    private var coachingStyleStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepHeader("COACHING STYLE", "How do you prefer to be coached?")
            let options = [
                "Give me data and explain the science",
                "Keep it simple — just tell me what to do",
                "Motivate and push me hard",
                "Be supportive and encouraging",
                "Adapt to how I feel each day",
                "Mix of everything"
            ]
            ForEach(options, id: \.self) { o in
                selectCard(title: o, subtitle: nil, icon: "brain.head.profile", selected: coachingStyle == o) { coachingStyle = o }
            }
            Spacer()
        }.padding(24)
    }

    private var subscriptionStep: some View {
        VStack(spacing: 18) {
            Spacer()
            ZStack {
                Circle().fill(Color(red: 1, green: 0.78, blue: 0.2).opacity(0.2)).frame(width: 120, height: 120).blur(radius: 16)
                Image(systemName: "crown.fill").font(.system(size: 56)).foregroundStyle(Color(red: 1, green: 0.78, blue: 0.2))
            }
            Text("Unlock FITNEO Premium").font(.system(size: 26, weight: .bold)).foregroundStyle(.white).multilineTextAlignment(.center)
            Text("1 month free, then $5/month.\nElite programs, unlimited FITNEO AI, full analytics.")
                .font(.system(size: 15)).foregroundStyle(Theme.textSecondary).multilineTextAlignment(.center)
            Spacer()
        }
        .padding(24)
    }

    // MARK: - Helpers

    private func stepHeader(_ tag: String, _ title: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(tag).font(.system(size: 12, weight: .bold)).tracking(2).foregroundStyle(Theme.accent)
            Text(title)
                .font(.system(size: 26, weight: .bold))
                .foregroundStyle(.white)
                .fixedSize(horizontal: false, vertical: true)
                .lineLimit(nil)
        }
    }

    private func slider(_ label: String, _ value: Binding<Double>, _ range: ClosedRange<Double>, _ unit: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(label).font(.system(size: 14, weight: .medium)).foregroundStyle(.white)
                Spacer()
                Text("\(Int(value.wrappedValue)) \(unit)").font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.accent)
            }
            Slider(value: value, in: range, step: 1).tint(Theme.accent)
        }
        .padding(16).glassCard(cornerRadius: 14)
    }

    private func unitToggle(_ binding: Binding<String>, _ options: [String]) -> some View {
        HStack(spacing: 0) {
            ForEach(options, id: \.self) { o in
                Button { binding.wrappedValue = o } label: {
                    Text(o).font(.system(size: 13, weight: .bold))
                        .foregroundStyle(binding.wrappedValue == o ? .white : Theme.textSecondary)
                        .padding(.horizontal, 14).padding(.vertical, 7)
                        .background(Capsule().fill(binding.wrappedValue == o ? Theme.accent : Color.clear))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(3).background(Capsule().fill(Color.white.opacity(0.06)))
    }

    private func selectCard(title: String, subtitle: String?, icon: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            action()
        } label: {
            HStack(spacing: 14) {
                Image(systemName: icon).font(.system(size: 20)).foregroundStyle(selected ? Theme.accent : Theme.textTertiary)
                    .frame(width: 44, height: 44).background(Circle().fill(selected ? Theme.accent.opacity(0.15) : Color.white.opacity(0.04)))
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                    if let subtitle { Text(subtitle).font(.system(size: 13)).foregroundStyle(Theme.textTertiary) }
                }
                Spacer()
                if selected { Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.accent) }
            }
            .padding(16).glassCard(selected: selected, cornerRadius: 18)
        }
        .buttonStyle(.plain)
    }

    private func multiCard(title: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            withAnimation(.spring(response: 0.3)) { action() }
        } label: {
            HStack {
                Text(title).font(.system(size: 16, weight: .semibold)).foregroundStyle(.white)
                Spacer()
                Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(selected ? Theme.accent : Theme.textTertiary)
            }
            .padding(16).glassCard(selected: selected, cornerRadius: 16)
        }
        .buttonStyle(.plain)
    }

    private func levelDesc(_ d: Difficulty) -> String {
        switch d {
        case .beginner: "New to training"
        case .intermediate: "Train regularly"
        case .advanced: "Experienced athlete"
        }
    }

    private func measureRow(_ label: String, _ text: Binding<String>) -> some View {
        HStack(spacing: 12) {
            Text(label).font(.system(size: 14, weight: .medium)).foregroundStyle(.white).frame(width: 120, alignment: .leading)
            TextField("0", text: text)
                .keyboardType(.decimalPad).font(.system(size: 16, weight: .semibold))
                .foregroundStyle(.white).multilineTextAlignment(.trailing)
                .padding(.horizontal, 14).padding(.vertical, 12)
                .background(RoundedRectangle(cornerRadius: 12).fill(Color.white.opacity(0.05)))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.08), lineWidth: 1))
            Text("cm")
                .font(.system(size: 12, weight: .medium)).foregroundStyle(Theme.textTertiary).frame(width: 30)
        }
    }

    private func advance() {
        // Must check step >= totalSteps FIRST — when step is already at totalSteps
        // the previous ordering would short-circuit and never show the paywall.
        if step >= totalSteps {
            showPaywall = true
            return
        }
        if step == totalSteps - 1 {
            // Advance to the subscription preview step
            withAnimation(.spring(response: 0.4)) { step = totalSteps }
            return
        }
        withAnimation(.spring(response: 0.4)) { step += 1 }
    }

    private func finish() {
        let sessionLenMap = [
            "15-20 min": "15", "20-30 min": "30", "30-45 min": "45", "45-60 min": "60", "60+ min": "60+"
        ]
        let sessionLen = OnboardingData.SessionLength(rawValue: sessionLenMap[sessionDuration ?? "30-45"] ?? "30") ?? .thirty

        let data = OnboardingData(
            goal: goals.contains("Build Muscle") ? .buildMuscle : goals.contains("Lose Weight") ? .loseFat : goals.contains("Athletic Performance") ? .athleticPerformance : .maintainTone,
            fitnessLevel: level == .beginner ? .beginner : .someExperience,
            equipment: equipment.contains("Full Gym") ? .fullGym : equipment.contains("Dumbbells") ? .dumbbells : .none,
            focusAreas: goals.map { goal in
                switch goal {
                case "Lose Weight": return .fullBody
                case "Build Muscle": return .fullBody
                case "Improve Endurance": return .legs
                default: return .fullBody
                }
            },
            sessionLength: sessionLen,
            weight: weight, weightUnit: weightUnit == "kg" ? .kg : .lbs,
            height: height, heightUnit: .cm, dietType: .standard,
            coachPersonality: coachingStyle?.contains("data") == true ? .drillSergeant : coachingStyle?.contains("supportive") == true ? .supportive : .motivational,
            workoutTime: workoutTimeOfDay?.contains("Morning") == true ? .morning : .flexible,
            sleepQuality: recovery == "I sleep well and recover fast" ? .excellent : .average,
            activityLevel: activityLevel == "Very active" ? .veryActive : .moderatelyActive,
            targetPhysique: longTermVision?.contains("lean") == true ? .leanToned : .athleticStrong,
            motivationStyles: motivation?.contains("strong") == true ? [.feelingStrong] : [.trackingProgress],
            language: .english, theme: .dark,
            workoutDuration: sessionDuration == "15-20 min" ? .fifteenToTwenty : sessionDuration == "20-30 min" ? .twentyToThirty : .thirtyToFortyFive,
            trainingDaysPerWeek: trainingDays,
            trainingStyles: trainingStyles.compactMap { s in
                switch s {
                case "Strength Training": return .strength
                case "HIIT": return .hiit
                case "Cardio": return .cardio
                case "Core & Abs": return .coreAbs
                case "Flexibility & Mobility": return .flexibility
                default: return .mixed
                }
            },
            movementExperience: OnboardingData.MovementExperience(
                barbellDeadlift: movementComfort["Barbell Deadlift"] ?? false,
                pullUps: movementComfort["Pull-ups"] ?? false,
                overheadPress: movementComfort["Overhead Press"] ?? false,
                bulgarianSplitSquat: movementComfort["Bulgarian Split Squat"] ?? false,
                boxJumps: movementComfort["Box Jumps"] ?? false
            ),
            recoveryQuality: recovery == "I sleep well and recover fast" ? .excellent : recovery == "Average sleep and recovery" ? .average : .tired,
            biggestChallenge: biggestChallenge == "Staying consistent" ? .consistency : .dontKnowHow,
            trainingExperience: programExperience.compactMap { e in
                switch e {
                case "Push Pull Legs": return .pushPullLegs
                case "Upper Lower Split": return .upperLower
                case "Full Body Training": return .fullBody
                case "HIIT Programs": return .hiit
                case "None of the above": return .none
                default: return nil
                }
            },
            injuries: injuries.compactMap { i in
                switch i {
                case "No injuries": return .none
                case let s where s.contains("back"): return .lowerBack
                case let s where s.contains("Knee"): return .knees
                case let s where s.contains("Shoulder"): return .shoulders
                default: return .none
                }
            },
            bodyMeasurements: {
                var bm = OnboardingData.BodyMeasurements()
                if let v = Double(chestVal), v > 0 { bm.chest = v }
                if let v = Double(waistVal), v > 0 { bm.waist = v }
                if let v = Double(hipsVal), v > 0 { bm.hips = v }
                if let v = Double(armsVal), v > 0 { bm.arms = v }
                if let v = Double(thighsVal), v > 0 { bm.thighs = v }
                return bm.chest != nil || bm.waist != nil || bm.hips != nil ? bm : nil
            }(),
            pastObstacles: pastObstacles.compactMap { o in
                if o.hasPrefix("Nothing") { return .firstAttempt }
                if o.contains("consistency") { return .consistency }
                if o.contains("plan") { return .noPlan }
                if o.contains("injury") { return .injuries }
                if o.contains("nutrition") { return .nutrition }
                if o.contains("time") { return .time }
                if o.contains("motivation") { return .motivation }
                return .wrongLevel
            }
        )
        store.user.name = name.isEmpty ? "Athlete" : name
        store.user.age = Int(age)
        store.user.weight = weight
        store.user.weightUnit = weightUnit
        store.user.height = height
        store.user.fitnessLevel = level
        store.user.goals = goals.isEmpty ? ["Stay Active"] : Array(goals)
        store.user.equipment = equipment.isEmpty ? ["No Equipment"] : Array(equipment)
        onFinish(data)
    }
}
