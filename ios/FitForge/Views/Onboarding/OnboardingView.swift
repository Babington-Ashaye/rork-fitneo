import SwiftUI

struct OnboardingView: View {
    @Bindable var viewModel: OnboardingViewModel
    var onComplete: () -> Void

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            Theme.glowGradient
                .frame(width: 600, height: 600)
                .offset(y: -300)
                .ignoresSafeArea()
                .allowsHitTesting(false)

            VStack(spacing: 0) {
                if viewModel.currentStep > 0 && viewModel.currentStep < 30 {
                    OnboardingProgressBar(progress: viewModel.progress)
                        .padding(.horizontal, 24)
                        .padding(.top, 16)
                }

                ScrollView {
                    VStack(alignment: .leading, spacing: 28) {
                        stepContent
                            .padding(.horizontal, 24)
                            .padding(.top, 24)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                if shouldShowFooter { footer }
            }
        }
        .preferredColorScheme(.dark)
        .animation(.easeInOut(duration: 0.4), value: viewModel.currentStep)
    }

    private var shouldShowFooter: Bool {
        switch viewModel.currentStep {
        case 0, 3, 8, 13, 29: return false // welcome / calibrations / completion
        default: return true
        }
    }

    private var primaryLabel: String {
        viewModel.isFinishStep ? "Finish" : "Continue"
    }

    private var footer: some View {
        VStack(spacing: 12) {
            if let error = viewModel.errorMessage {
                Text(error)
                    .font(.footnote)
                    .foregroundStyle(Theme.danger)
                    .multilineTextAlignment(.center)
            }
            HStack(spacing: 12) {
                if viewModel.currentStep > 1 {
                    Button {
                        viewModel.back()
                    } label: {
                        Image(systemName: "chevron.left")
                            .font(.headline)
                            .foregroundStyle(.white)
                            .frame(width: 56, height: 56)
                            .glassCard(cornerRadius: 18)
                    }
                    .buttonStyle(.plain)
                }
                Button {
                    if viewModel.isFinishStep {
                        Task { await viewModel.finish() }
                    } else {
                        viewModel.next()
                    }
                } label: {
                    Text(primaryLabel)
                        .primaryButtonStyle(disabled: !viewModel.canProceed)
                }
                .buttonStyle(.plain)
                .disabled(!viewModel.canProceed)
            }
            .padding(.horizontal, 24)
        }
        .padding(.bottom, 28)
        .padding(.top, 8)
    }

    @ViewBuilder
    private var stepContent: some View {
        switch viewModel.currentStep {
        case 0: WelcomeStep { viewModel.next() }
        case 1: GoalStep(data: $viewModel.data)
        case 2: LevelStep(data: $viewModel.data)
        case 3: CalibrationView(
            title: "AI CALIBRATION",
            subtitle: "Building Your FITNEO Profile",
            icon: "sparkles",
            items: [
                "Mapping your fitness baseline...",
                "Analyzing goal patterns...",
                "Building your profile..."
            ],
            activeItem: "Calibrating AI coach...",
            endProgress: 0.6,
            onFinished: { viewModel.next() }
        )
        case 4: EquipmentStep(data: $viewModel.data)
        case 5: FocusStep(data: $viewModel.data)
        case 6: DurationStep(data: $viewModel.data)
        case 7: StatsStep(data: $viewModel.data)
        case 8: CalibrationView(
            title: "NUTRITION PLAN",
            subtitle: "Setting Nutrition Plan",
            icon: "applelogo",
            items: [
                "Calculating caloric needs...",
                "Optimizing macronutrients...",
                "Planning meal timing...",
                "Setting weight targets..."
            ],
            activeItem: "Nutrition plan ready!",
            endProgress: 0.9,
            onFinished: { viewModel.next() }
        )
        case 9: DietStep(data: $viewModel.data)
        case 10: CoachStep(data: $viewModel.data)
        case 11: WorkoutTimeStep(data: $viewModel.data)
        case 12: SleepStep(data: $viewModel.data)
        case 13: GoalsProjectionStep(data: $viewModel.data, onContinue: { viewModel.next() })
        case 14: ActivityStep(data: $viewModel.data)
        case 15: PhysiqueStep(data: $viewModel.data)
        case 16: MotivationStep(data: $viewModel.data)
        case 17: LanguageStep(data: $viewModel.data)
        case 18: ThemeStep(data: $viewModel.data)
        case 19: WorkoutDurationStep(data: $viewModel.data)
        case 20: TrainingDaysStep(data: $viewModel.data)
        case 21: TrainingStylesStep(data: $viewModel.data)
        case 22: MovementExperienceStep(data: $viewModel.data)
        case 23: RecoveryStep(data: $viewModel.data)
        case 24: BiggestChallengeStep(data: $viewModel.data)
        case 25: TrainingExperienceStep(data: $viewModel.data)
        case 26: InjuryStep(data: $viewModel.data)
        case 27: BodyMeasurementsStep(data: $viewModel.data)
        case 28: StoppedBeforeStep(data: $viewModel.data)
        case 29: CompletionStep(onFinished: onComplete)
        default: EmptyView()
        }
    }
}

// MARK: - Step views

private struct WelcomeStep: View {
    var onBegin: () -> Void
    @State private var glow = false

    var body: some View {
        VStack(spacing: 28) {
            Spacer().frame(height: 60)
            ZStack {
                Circle()
                    .fill(Theme.accent.opacity(glow ? 0.45 : 0.2))
                    .frame(width: 220, height: 220)
                    .blur(radius: 50)
                    .animation(.easeInOut(duration: 1.6).repeatForever(autoreverses: true), value: glow)
                VStack(spacing: 10) {
                    Image(systemName: "bolt.heart.fill")
                        .font(.system(size: 80, weight: .bold))
                        .foregroundStyle(Theme.accent)
                        .shadow(color: Theme.accent.opacity(0.7), radius: 20)
                    Text("FITNEO")
                        .font(.system(size: 48, weight: .black, design: .rounded))
                        .tracking(8)
                        .foregroundStyle(.white)
                }
            }
            Text("The future of fitness is you.")
                .font(.system(size: 18, weight: .medium))
                .foregroundStyle(Theme.textSecondary)
                .multilineTextAlignment(.center)

            Spacer()

            Button {
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                onBegin()
            } label: {
                Text("Begin Calibration")
                    .primaryButtonStyle()
            }
            .buttonStyle(.plain)
            .padding(.bottom, 40)
        }
        .frame(maxWidth: .infinity)
        .onAppear { glow = true }
    }
}

private struct GoalStep: View {
    @Binding var data: OnboardingData
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Goal Setting", aiLabel: "Calibrating your targets...", question: "What is your #1 goal?")
            VStack(spacing: 10) {
                ForEach(OnboardingData.Goal.allCases, id: \.self) { g in
                    SelectableCard(title: g.title, icon: g.icon, isSelected: data.goal == g) {
                        data.goal = g
                    }
                }
            }
        }
    }
}

private struct LevelStep: View {
    @Binding var data: OnboardingData
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Level Assessment", aiLabel: nil, question: "Where are you right now?")
            VStack(spacing: 10) {
                ForEach(OnboardingData.FitnessLevel.allCases, id: \.self) { l in
                    SelectableCard(title: l.title, subtitle: l.subtitle, isSelected: data.fitnessLevel == l) {
                        data.fitnessLevel = l
                    }
                }
            }
        }
    }
}

private struct EquipmentStep: View {
    @Binding var data: OnboardingData
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Equipment Setup", aiLabel: nil, question: "What do you have access to?")
            VStack(spacing: 10) {
                ForEach(OnboardingData.Equipment.allCases, id: \.self) { e in
                    SelectableCard(title: e.title, icon: e.icon, isSelected: data.equipment == e) {
                        data.equipment = e
                    }
                }
            }
        }
    }
}

private struct FocusStep: View {
    @Binding var data: OnboardingData
    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Body Focus", aiLabel: nil, question: "Where do you want to focus most?")
            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(OnboardingData.FocusArea.allCases, id: \.self) { area in
                    GridCard(title: area.title, icon: area.icon, isSelected: data.focusAreas.contains(area)) {
                        if data.focusAreas.contains(area) {
                            data.focusAreas.removeAll { $0 == area }
                        } else {
                            data.focusAreas.append(area)
                        }
                    }
                }
            }
            Text("Select one or more")
                .font(.caption)
                .foregroundStyle(Theme.textTertiary)
        }
    }
}

private struct DurationStep: View {
    @Binding var data: OnboardingData
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Session Length", aiLabel: nil, question: "How long can you train per session?")
            VStack(spacing: 10) {
                ForEach(OnboardingData.SessionLength.allCases, id: \.self) { s in
                    SelectableCard(title: s.title, isSelected: data.sessionLength == s) {
                        data.sessionLength = s
                    }
                }
            }
        }
    }
}

private struct StatsStep: View {
    @Binding var data: OnboardingData
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Your Stats", aiLabel: nil, question: "Tell us your numbers")
            StatInputRow(
                label: "Weight",
                value: $data.weight,
                unit: $data.weightUnit,
                units: OnboardingData.WeightUnit.allCases,
                unitTitle: { $0.rawValue },
                range: 30...250
            )
            StatInputRow(
                label: "Height",
                value: $data.height,
                unit: $data.heightUnit,
                units: OnboardingData.HeightUnit.allCases,
                unitTitle: { $0.rawValue },
                range: 100...230
            )
        }
    }
}

private struct DietStep: View {
    @Binding var data: OnboardingData
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Nutrition Setup", aiLabel: nil, question: "What describes your diet?")
            VStack(spacing: 10) {
                ForEach(OnboardingData.DietType.allCases, id: \.self) { d in
                    SelectableCard(title: d.title, icon: d.icon, isSelected: data.dietType == d) {
                        data.dietType = d
                    }
                }
            }
        }
    }
}

private struct CoachStep: View {
    @Binding var data: OnboardingData
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "AI Coach Setup", aiLabel: nil, question: "How do you want to be coached?")
            VStack(spacing: 10) {
                ForEach(OnboardingData.CoachPersonality.allCases, id: \.self) { c in
                    SelectableCard(title: c.title, subtitle: c.subtitle, isSelected: data.coachPersonality == c) {
                        data.coachPersonality = c
                    }
                }
            }
        }
    }
}

private struct WorkoutTimeStep: View {
    @Binding var data: OnboardingData
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Schedule", aiLabel: nil, question: "When do you prefer to train?")
            VStack(spacing: 10) {
                ForEach(OnboardingData.WorkoutTime.allCases, id: \.self) { t in
                    SelectableCard(title: t.title, subtitle: t.subtitle, isSelected: data.workoutTime == t) {
                        data.workoutTime = t
                    }
                }
            }
        }
    }
}

private struct SleepStep: View {
    @Binding var data: OnboardingData
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Recovery", aiLabel: nil, question: "How is your current sleep?")
            VStack(spacing: 10) {
                ForEach(OnboardingData.SleepQuality.allCases, id: \.self) { s in
                    SelectableCard(title: s.title, subtitle: s.subtitle, isSelected: data.sleepQuality == s) {
                        data.sleepQuality = s
                    }
                }
            }
        }
    }
}

private struct GoalsProjectionStep: View {
    @Binding var data: OnboardingData
    var onContinue: () -> Void

    @State private var animate = false

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                SectionHeader(title: "Your Goals")
                Spacer()
                Text("AI ANALYSIS")
                    .font(.system(size: 10, weight: .bold))
                    .tracking(1.5)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Capsule().fill(Theme.accent))
            }
            Text("Projected Growth Over 6 Months")
                .font(.title3.bold())
                .foregroundStyle(.white)

            HStack(alignment: .bottom, spacing: 14) {
                ForEach(0..<6, id: \.self) { i in
                    VStack(spacing: 4) {
                        HStack(alignment: .bottom, spacing: 4) {
                            bar(height: animate ? CGFloat(40 + i * 22) : 8, color: Theme.success)
                            bar(height: animate ? CGFloat(36 + i * 4) : 8, color: Theme.danger.opacity(0.8))
                        }
                        .frame(height: 180, alignment: .bottom)
                        Text("Mo \(i + 1)")
                            .font(.caption2)
                            .foregroundStyle(Theme.textSecondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .padding(16)
            .glassCard(cornerRadius: 18)

            HStack(spacing: 12) {
                LegendDot(color: Theme.success, label: "With FITNEO")
                LegendDot(color: Theme.danger.opacity(0.8), label: "Without")
            }

            Text("Based on your goal, here is how FITNEO accelerates your journey:")
                .font(.subheadline)
                .foregroundStyle(Theme.textSecondary)
                .padding(.top, 4)

            VStack(alignment: .leading, spacing: 10) {
                ForEach(benefits, id: \.self) { b in
                    HStack(spacing: 10) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(Theme.accent)
                        Text(b)
                            .font(.subheadline)
                            .foregroundStyle(.white)
                    }
                }
            }
            .padding(16)
            .glassCard(cornerRadius: 18)

            Button {
                onContinue()
            } label: {
                Text("Continue")
                    .primaryButtonStyle()
            }
            .buttonStyle(.plain)
            .padding(.top, 12)
        }
        .onAppear {
            withAnimation(.spring(duration: 1.2, bounce: 0.3).delay(0.2)) {
                animate = true
            }
        }
    }

    private func bar(height: CGFloat, color: Color) -> some View {
        RoundedRectangle(cornerRadius: 4, style: .continuous)
            .fill(LinearGradient(colors: [color, color.opacity(0.6)], startPoint: .top, endPoint: .bottom))
            .frame(width: 12, height: height)
            .animation(.spring(duration: 1.0, bounce: 0.3), value: height)
    }

    private var benefits: [String] {
        switch data.goal {
        case .loseFat:
            return ["Burn 2× more calories", "Track daily fat loss", "Sustainable weight management"]
        case .buildMuscle:
            return ["Optimized hypertrophy programming", "Personalized macros", "Progressive overload tracking"]
        case .athleticPerformance:
            return ["Sport-specific conditioning", "Recovery optimization", "Peak performance windows"]
        case .maintainTone, .none:
            return ["Balanced full-body training", "Sustainable routine", "Long-term habit building"]
        }
    }
}

private struct LegendDot: View {
    let color: Color
    let label: String
    var body: some View {
        HStack(spacing: 6) {
            Circle().fill(color).frame(width: 10, height: 10)
            Text(label).font(.caption).foregroundStyle(Theme.textSecondary)
        }
    }
}

private struct ActivityStep: View {
    @Binding var data: OnboardingData
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Daily Activity", aiLabel: nil, question: "Outside workouts, how active are you?")
            VStack(spacing: 10) {
                ForEach(OnboardingData.ActivityLevel.allCases, id: \.self) { a in
                    SelectableCard(title: a.title, subtitle: a.subtitle, isSelected: data.activityLevel == a) {
                        data.activityLevel = a
                    }
                }
            }
        }
    }
}

private struct PhysiqueStep: View {
    @Binding var data: OnboardingData
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Your Target", aiLabel: nil, question: "What physique are you working toward?")
            VStack(spacing: 10) {
                ForEach(OnboardingData.TargetPhysique.allCases, id: \.self) { p in
                    SelectableCard(title: p.title, isSelected: data.targetPhysique == p) {
                        data.targetPhysique = p
                    }
                }
            }
        }
    }
}

private struct MotivationStep: View {
    @Binding var data: OnboardingData
    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Motivation", aiLabel: nil, question: "What keeps you going?")
            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(OnboardingData.MotivationStyle.allCases, id: \.self) { m in
                    GridCard(title: m.title, icon: m.icon, isSelected: data.motivationStyles.contains(m)) {
                        if data.motivationStyles.contains(m) {
                            data.motivationStyles.removeAll { $0 == m }
                        } else {
                            data.motivationStyles.append(m)
                        }
                    }
                }
            }
        }
    }
}

private struct LanguageStep: View {
    @Binding var data: OnboardingData
    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Language", aiLabel: nil, question: "Choose your language")
            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(OnboardingData.AppLanguage.allCases, id: \.self) { l in
                    Button {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        data.language = l
                    } label: {
                        HStack(spacing: 10) {
                            Text(l.flag).font(.title2)
                            Text(l.title)
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.white)
                            Spacer()
                            if data.language == l {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(Theme.accent)
                            }
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 14)
                        .glassCard(selected: data.language == l, cornerRadius: 14)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

private struct ThemeStep: View {
    @Binding var data: OnboardingData
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Appearance", aiLabel: nil, question: "Choose your theme")
            VStack(spacing: 12) {
                ForEach(OnboardingData.AppTheme.allCases, id: \.self) { t in
                    Button {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        data.theme = t
                    } label: {
                        HStack(spacing: 16) {
                            Image(systemName: t.icon)
                                .font(.system(size: 26, weight: .semibold))
                                .foregroundStyle(data.theme == t ? Theme.accent : Theme.textSecondary)
                                .frame(width: 56, height: 56)
                                .background(
                                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                                        .fill(data.theme == t ? Theme.accent.opacity(0.15) : Color.white.opacity(0.05))
                                )

                            VStack(alignment: .leading, spacing: 4) {
                                Text(t.title)
                                    .font(.headline)
                                    .foregroundStyle(.white)
                                Text(t.subtitle)
                                    .font(.footnote)
                                    .foregroundStyle(Theme.textSecondary)
                            }
                            Spacer()
                            if data.theme == t {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(Theme.accent)
                            }
                        }
                        .padding(16)
                        .glassCard(selected: data.theme == t)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

private struct CompletionStep: View {
    var onFinished: () -> Void
    @State private var pulse = false
    @State private var ringProgress: CGFloat = 0
    @State private var fadeIn = false
    @State private var barProgress: Double = 0.9

    var body: some View {
        VStack(spacing: 28) {
            Spacer()
            ZStack {
                Circle()
                    .stroke(Color.white.opacity(0.08), lineWidth: 3)
                    .frame(width: 220, height: 220)
                Circle()
                    .trim(from: 0, to: ringProgress)
                    .stroke(Theme.accent, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .frame(width: 220, height: 220)
                    .shadow(color: Theme.accent, radius: 14)
                Circle()
                    .stroke(Color.white.opacity(0.05), lineWidth: 2)
                    .frame(width: 170, height: 170)
                Circle()
                    .trim(from: 0, to: ringProgress)
                    .stroke(Theme.accent.opacity(0.6), style: StrokeStyle(lineWidth: 2, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .frame(width: 170, height: 170)

                VStack(spacing: 8) {
                    Image(systemName: "bolt.heart.fill")
                        .font(.system(size: 56, weight: .bold))
                        .foregroundStyle(Theme.accent)
                        .scaleEffect(pulse ? 1.08 : 0.95)
                        .shadow(color: Theme.accent.opacity(0.7), radius: 20)
                    Text("FITNEO")
                        .font(.system(size: 24, weight: .black, design: .rounded))
                        .tracking(4)
                        .foregroundStyle(.white)
                }
            }
            .frame(width: 240, height: 240)

            VStack(spacing: 8) {
                Text("Your AI Fitness System Is Ready.")
                    .font(.system(size: 24, weight: .bold))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.white)
                    .opacity(fadeIn ? 1 : 0)
                Text("Personalized for you. Powered by AI.")
                    .font(.subheadline)
                    .foregroundStyle(Theme.textSecondary)
                    .opacity(fadeIn ? 1 : 0)
            }

            OnboardingProgressBar(progress: barProgress)
                .padding(.horizontal, 32)

            Spacer()
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.3)) { ringProgress = 1 }
            withAnimation(.easeInOut(duration: 1).repeatForever(autoreverses: true)) { pulse = true }
            withAnimation(.easeInOut(duration: 1.0).delay(0.6)) { fadeIn = true }
            withAnimation(.easeInOut(duration: 1.4).delay(0.3)) { barProgress = 1.0 }

            Task {
                try? await Task.sleep(for: .seconds(2.4))
                await MainActor.run { onFinished() }
            }
        }
    }
}

// MARK: - New onboarding steps (added to end of flow)

private struct WorkoutDurationStep: View {
    @Binding var data: OnboardingData
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Session Duration", aiLabel: nil, question: "How much time can you dedicate per session?")
            VStack(spacing: 10) {
                ForEach(OnboardingData.WorkoutDuration.allCases, id: \.self) { d in
                    SelectableCard(title: d.title, isSelected: data.workoutDuration == d) {
                        data.workoutDuration = d
                    }
                }
            }
        }
    }
}

private struct TrainingDaysStep: View {
    @Binding var data: OnboardingData
    private let daysOptions = [2, 3, 4, 5, 6]
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Training Schedule", aiLabel: nil, question: "How many days per week can you train?")
            VStack(spacing: 10) {
                ForEach(daysOptions, id: \.self) { days in
                    SelectableCard(
                        title: "\(days) days",
                        subtitle: days <= 3 ? "Great for beginners" : days >= 5 ? "For dedicated athletes" : "Balanced routine",
                        isSelected: data.trainingDaysPerWeek == days
                    ) {
                        data.trainingDaysPerWeek = days
                    }
                }
            }
        }
    }
}

private struct TrainingStylesStep: View {
    @Binding var data: OnboardingData
    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Training Style", aiLabel: nil, question: "What type of training do you prefer?")
            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(OnboardingData.TrainingStyle.allCases, id: \.self) { style in
                    GridCard(title: style.title, icon: style.icon, isSelected: data.trainingStyles.contains(style)) {
                        if data.trainingStyles.contains(style) {
                            data.trainingStyles.removeAll { $0 == style }
                        } else {
                            data.trainingStyles.append(style)
                        }
                    }
                }
            }
            Text("Select all that apply")
                .font(.caption)
                .foregroundStyle(Theme.textTertiary)
        }
    }
}

private struct MovementExperienceStep: View {
    @Binding var data: OnboardingData
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Movement Comfort", aiLabel: nil, question: "Are you comfortable with these movements?")
            VStack(spacing: 4) {
                ForEach(OnboardingData.MovementExperience.movements, id: \.name) { movement in
                    HStack(spacing: 14) {
                        Image(systemName: movement.icon)
                            .font(.system(size: 18))
                            .foregroundStyle(Theme.accent)
                            .frame(width: 36)
                        Text(movement.name)
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(.white)
                        Spacer()
                        Toggle("", isOn: Binding(
                            get: { data.movementExperience[keyPath: movement.key] },
                            set: { data.movementExperience[keyPath: movement.key] = $0 }
                        ))
                        .labelsHidden()
                        .tint(Theme.accent)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .glassCard(cornerRadius: 14)
                }
            }
        }
    }
}

private struct RecoveryStep: View {
    @Binding var data: OnboardingData
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Recovery & Lifestyle", aiLabel: nil, question: "How would you describe your recovery?")
            VStack(spacing: 10) {
                ForEach(OnboardingData.RecoveryQuality.allCases, id: \.self) { r in
                    SelectableCard(title: r.title, subtitle: r.subtitle, isSelected: data.recoveryQuality == r) {
                        data.recoveryQuality = r
                    }
                }
            }
        }
    }
}

// MARK: - Extended onboarding steps

private struct BiggestChallengeStep: View {
    @Binding var data: OnboardingData
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Your Challenge", aiLabel: nil, question: "What is your biggest challenge with fitness?")
            VStack(spacing: 10) {
                ForEach(OnboardingData.BiggestChallenge.allCases, id: \.self) { c in
                    SelectableCard(title: c.title, isSelected: data.biggestChallenge == c) {
                        data.biggestChallenge = c
                    }
                }
            }
        }
    }
}

private struct TrainingExperienceStep: View {
    @Binding var data: OnboardingData
    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Training History", aiLabel: nil, question: "Have you followed any of these training styles before?")
            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(OnboardingData.TrainingProgramExperience.allCases, id: \.self) { exp in
                    GridCard(title: exp.title, icon: exp.icon, isSelected: data.trainingExperience.contains(exp)) {
                        if exp == .none {
                            data.trainingExperience = [.none]
                        } else {
                            data.trainingExperience.removeAll { $0 == .none }
                            if data.trainingExperience.contains(exp) {
                                data.trainingExperience.removeAll { $0 == exp }
                            } else {
                                data.trainingExperience.append(exp)
                            }
                        }
                    }
                }
            }
            Text("Select all that apply")
                .font(.caption)
                .foregroundStyle(Theme.textTertiary)
        }
    }
}

private struct InjuryStep: View {
    @Binding var data: OnboardingData
    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Health Check", aiLabel: nil, question: "Do you have any injuries or physical limitations we should know about?")
            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(OnboardingData.InjuryType.allCases, id: \.self) { injury in
                    GridCard(title: injury.title, icon: "bandage.fill", isSelected: data.injuries.contains(injury)) {
                        if injury == .none {
                            data.injuries = [.none]
                        } else {
                            data.injuries.removeAll { $0 == .none }
                            if data.injuries.contains(injury) {
                                data.injuries.removeAll { $0 == injury }
                            } else {
                                data.injuries.append(injury)
                            }
                        }
                    }
                }
            }
            Text("Select all that apply")
                .font(.caption)
                .foregroundStyle(Theme.textTertiary)
        }
    }
}

private struct BodyMeasurementsStep: View {
    @Binding var data: OnboardingData
    @State private var measurements = OnboardingData.BodyMeasurements()
    @State private var chestText = ""
    @State private var waistText = ""
    @State private var hipsText = ""
    @State private var armsText = ""
    @State private var thighsText = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Body Measurements (Optional)", aiLabel: nil, question: "Would you like to add your starting measurements?")
            Text("This helps FITNEO AI track your progress more accurately.")
                .font(.subheadline)
                .foregroundStyle(Theme.textSecondary)

            VStack(spacing: 14) {
                measurementRow(label: "Chest", value: $chestText) { measurements.chest = Double($0) }
                measurementRow(label: "Waist", value: $waistText) { measurements.waist = Double($0) }
                measurementRow(label: "Hips", value: $hipsText) { measurements.hips = Double($0) }
                measurementRow(label: "Arms", value: $armsText) { measurements.arms = Double($0) }
                measurementRow(label: "Thighs", value: $thighsText) { measurements.thighs = Double($0) }
            }

            HStack(spacing: 10) {
                ForEach(OnboardingData.BodyMeasurements.MeasurementUnit.allCases, id: \.self) { unit in
                    Button {
                        measurements.unit = unit
                    } label: {
                        Text(unit.title)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(measurements.unit == unit ? .white : Theme.textSecondary)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(
                                Capsule()
                                    .fill(measurements.unit == unit ? Theme.accent.opacity(0.2) : Color.white.opacity(0.05))
                            )
                    }
                    .buttonStyle(.plain)
                }
            }

            Button {
                withAnimation { measurements = OnboardingData.BodyMeasurements() }
            } label: {
                Text("Skip for now")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Theme.accent)
            }
            .buttonStyle(.plain)
            .padding(.top, 4)
        }
        .onChange(of: chestText) { _, _ in saveMeasurements() }
        .onChange(of: waistText) { _, _ in saveMeasurements() }
        .onChange(of: hipsText) { _, _ in saveMeasurements() }
        .onChange(of: armsText) { _, _ in saveMeasurements() }
        .onChange(of: thighsText) { _, _ in saveMeasurements() }
    }

    private func measurementRow(label: String, value: Binding<String>, _ setter: (String) -> Void) -> some View {
        HStack(spacing: 12) {
            Text(label)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(.white)
                .frame(width: 100, alignment: .leading)
            TextField("0", text: value)
                .keyboardType(.decimalPad)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(.white)
                .multilineTextAlignment(.trailing)
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(Color.white.opacity(0.05))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
            Text(measurements.unit.title)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(Theme.textTertiary)
                .frame(width: 40)
        }
    }

    private func saveMeasurements() {
        var m = OnboardingData.BodyMeasurements()
        m.unit = measurements.unit
        if let v = Double(chestText), v > 0 { m.chest = v }
        if let v = Double(waistText), v > 0 { m.waist = v }
        if let v = Double(hipsText), v > 0 { m.hips = v }
        if let v = Double(armsText), v > 0 { m.arms = v }
        if let v = Double(thighsText), v > 0 { m.thighs = v }
        measurements = m
        if m.chest != nil || m.waist != nil || m.hips != nil || m.arms != nil || m.thighs != nil {
            data.bodyMeasurements = m
        }
    }
}

private struct StoppedBeforeStep: View {
    @Binding var data: OnboardingData
    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            StepHeader(kicker: "Past Experience", aiLabel: nil, question: "What has stopped you from reaching your fitness goals in the past?")
            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(OnboardingData.StoppingObstacle.allCases, id: \.self) { obstacle in
                    GridCard(title: obstacle.title, icon: "exclamationmark.triangle.fill", isSelected: data.pastObstacles.contains(obstacle)) {
                        if obstacle == .firstAttempt {
                            data.pastObstacles = [.firstAttempt]
                        } else {
                            data.pastObstacles.removeAll { $0 == .firstAttempt }
                            if data.pastObstacles.contains(obstacle) {
                                data.pastObstacles.removeAll { $0 == obstacle }
                            } else {
                                data.pastObstacles.append(obstacle)
                            }
                        }
                    }
                }
            }
            Text("Select all that apply")
                .font(.caption)
                .foregroundStyle(Theme.textTertiary)
        }
    }
}
