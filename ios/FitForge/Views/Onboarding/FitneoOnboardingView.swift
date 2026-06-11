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

    private let totalSteps = 6

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            VStack(spacing: 0) {
                if step > 0 { progressBar.padding(.horizontal, 24).padding(.top, 12) }
                Group {
                    switch step {
                    case 0: welcome
                    case 1: personalInfo
                    case 2: fitnessLevel
                    case 3: goalsStep
                    case 4: equipmentStep
                    default: subscriptionStep
                    }
                }
                .transition(.asymmetric(insertion: .move(edge: .trailing).combined(with: .opacity),
                                        removal: .move(edge: .leading).combined(with: .opacity)))
                .frame(maxHeight: .infinity)

                if step > 0 {
                    PillButton(title: step == totalSteps - 1 ? "Finish" : "Continue", icon: nil) { advance() }
                        .padding(.horizontal, 24).padding(.bottom, 8)
                        .disabled(step == 1 && name.isEmpty)
                        .opacity(step == 1 && name.isEmpty ? 0.5 : 1)
                    dots.padding(.bottom, 20)
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
                    .frame(width: geo.size.width * Double(step) / Double(totalSteps - 1))
                    .shadow(color: Theme.accent.opacity(0.6), radius: 8)
                    .animation(.spring(response: 0.5), value: step)
            }
        }
        .frame(height: 6)
    }

    private var dots: some View {
        HStack(spacing: 6) {
            ForEach(0..<totalSteps, id: \.self) { i in
                Circle().fill(i == step ? Theme.accent : Color.white.opacity(0.2))
                    .frame(width: i == step ? 8 : 6, height: i == step ? 8 : 6)
            }
        }
    }

    // MARK: - Steps

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

    private var subscriptionStep: some View {
        VStack(spacing: 18) {
            Spacer()
            ZStack {
                Circle().fill(Color(red: 1, green: 0.78, blue: 0.2).opacity(0.2)).frame(width: 120, height: 120).blur(radius: 16)
                Image(systemName: "crown.fill").font(.system(size: 56)).foregroundStyle(Color(red: 1, green: 0.78, blue: 0.2))
            }
            Text("Unlock FITNEO Premium").font(.system(size: 26, weight: .bold)).foregroundStyle(.white).multilineTextAlignment(.center)
            Text("1 month free, then $5/month.\nElite programs, unlimited Jarvis, full analytics.")
                .font(.system(size: 15)).foregroundStyle(Theme.textSecondary).multilineTextAlignment(.center)
            Spacer()
        }
        .padding(24)
    }

    // MARK: - Helpers

    private func stepHeader(_ tag: String, _ title: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(tag).font(.system(size: 12, weight: .bold)).tracking(2).foregroundStyle(Theme.accent)
            Text(title).font(.system(size: 26, weight: .bold)).foregroundStyle(.white)
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

    private func selectCard(title: String, subtitle: String, icon: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            withAnimation(.spring(response: 0.3)) { action() }
        } label: {
            HStack(spacing: 14) {
                Image(systemName: icon).font(.system(size: 20)).foregroundStyle(selected ? Theme.accent : Theme.textTertiary)
                    .frame(width: 44, height: 44).background(Circle().fill(selected ? Theme.accent.opacity(0.15) : Color.white.opacity(0.04)))
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                    Text(subtitle).font(.system(size: 13)).foregroundStyle(Theme.textTertiary)
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

    private func advance() {
        if step == totalSteps - 1 {
            showPaywall = true
            return
        }
        withAnimation(.spring(response: 0.4)) { step += 1 }
    }

    private func finish() {
        let data = OnboardingData(
            goal: .buildMuscle, fitnessLevel: level == .beginner ? .beginner : .someExperience,
            equipment: .none, focusAreas: [], sessionLength: .thirty,
            weight: weight, weightUnit: weightUnit == "kg" ? .kg : .lbs,
            height: height, heightUnit: .cm, dietType: .standard,
            coachPersonality: .motivational, workoutTime: .morning,
            sleepQuality: .good, activityLevel: .moderatelyActive,
            targetPhysique: .athleticStrong, motivationStyles: [],
            language: .english, theme: .dark
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
