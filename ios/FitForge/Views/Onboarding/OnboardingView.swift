import SwiftUI

struct OnboardingView: View {
    @Bindable var viewModel: OnboardingViewModel
    var onComplete: () -> Void

    var body: some View {
        ZStack {
            Color(.systemBackground)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Progress bar
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 2)
                            .fill(Color(.systemGray5))
                            .frame(height: 4)

                        RoundedRectangle(cornerRadius: 2)
                            .fill(
                                LinearGradient(colors: [.orange, .red], startPoint: .leading, endPoint: .trailing)
                            )
                            .frame(width: geo.size.width * CGFloat(viewModel.currentStep + 1) / CGFloat(viewModel.totalSteps), height: 4)
                    }
                }
                .frame(height: 4)
                .padding(.horizontal, 24)
                .padding(.top, 16)

                // Step content
                ScrollView {
                    VStack(spacing: 32) {
                        stepContent
                            .padding(.horizontal, 24)
                            .padding(.top, 24)
                    }
                }

                Spacer()

                // Navigation buttons
                VStack(spacing: 16) {
                    if let error = viewModel.errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                            .multilineTextAlignment(.center)
                    }

                    HStack(spacing: 16) {
                        if viewModel.currentStep > 0 {
                            Button("Back") {
                                viewModel.previousStep()
                            }
                            .font(.headline)
                            .foregroundStyle(.secondary)
                        }

                        Button {
                            if viewModel.currentStep == viewModel.totalSteps - 1 {
                                Task {
                                    await viewModel.saveOnboarding()
                                    if viewModel.isComplete {
                                        onComplete()
                                    }
                                }
                            } else {
                                viewModel.nextStep()
                            }
                        } label: {
                            HStack {
                                if viewModel.isSaving {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Text(viewModel.currentStep == viewModel.totalSteps - 1 ? "Get Started" : "Continue")
                                        .font(.headline)
                                }
                                if !viewModel.isSaving && viewModel.currentStep < viewModel.totalSteps - 1 {
                                    Image(systemName: "arrow.right")
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(
                                LinearGradient(colors: [.orange, .red], startPoint: .leading, endPoint: .trailing)
                            )
                            .foregroundStyle(.white)
                            .clipShape(.rect(cornerRadius: 16))
                        }
                        .disabled(!viewModel.canProceed || viewModel.isSaving)
                        .opacity(!viewModel.canProceed ? 0.6 : 1)
                    }
                    .padding(.horizontal, 24)
                }
                .padding(.bottom, 32)
            }
        }
    }

    @ViewBuilder
    private var stepContent: some View {
        switch viewModel.currentStep {
        case 0:
            AgeStepView(data: $viewModel.onboardingData)
        case 1:
            GenderStepView(data: $viewModel.onboardingData)
        case 2:
            GoalStepView(data: $viewModel.onboardingData)
        case 3:
            LevelStepView(data: $viewModel.onboardingData)
        case 4:
            PreferenceStepView(data: $viewModel.onboardingData)
        case 5:
            TargetAreasStepView(data: $viewModel.onboardingData)
        default:
            EmptyView()
        }
    }
}

// MARK: - Step Views

struct AgeStepView: View {
    @Binding var data: OnboardingData

    var body: some View {
        VStack(spacing: 24) {
            Text("How old are you?")
                .font(.title2.bold())
                .multilineTextAlignment(.center)

            Text("This helps us customize your workout intensity")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            VStack(spacing: 16) {
                Text("\(data.age)")
                    .font(.system(size: 72, weight: .bold, design: .rounded))
                    .foregroundStyle(
                        LinearGradient(colors: [.orange, .red], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )

                Slider(value: .init(
                    get: { Double(data.age) },
                    set: { data.age = Int($0) }
                ), in: 13...100, step: 1)
                .tint(.orange)
            }
            .padding(.vertical, 40)
        }
    }
}

struct GenderStepView: View {
    @Binding var data: OnboardingData
    let options = ["Male", "Female", "Non-binary", "Prefer not to say"]

    var body: some View {
        VStack(spacing: 24) {
            Text("What's your gender?")
                .font(.title2.bold())
                .multilineTextAlignment(.center)

            Text("Optional - helps personalize recommendations")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            VStack(spacing: 12) {
                ForEach(options, id: \.self) { option in
                    Button {
                        data.gender = option == "Prefer not to say" ? nil : option.lowercased()
                    } label: {
                        HStack {
                            Text(option)
                                .font(.headline)
                            Spacer()
                            if data.gender == option.lowercased() || (option == "Prefer not to say" && data.gender == nil) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(.orange)
                            }
                        }
                        .padding()
                        .background(
                            (data.gender == option.lowercased() || (option == "Prefer not to say" && data.gender == nil))
                            ? Color.orange.opacity(0.15)
                            : Color(.secondarySystemBackground)
                        )
                        .clipShape(.rect(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(
                                    (data.gender == option.lowercased() || (option == "Prefer not to say" && data.gender == nil))
                                    ? Color.orange : Color.clear,
                                    lineWidth: 2
                                )
                        )
                    }
                    .foregroundStyle(.primary)
                }
            }
        }
    }
}

struct GoalStepView: View {
    @Binding var data: OnboardingData

    var body: some View {
        VStack(spacing: 24) {
            Text("What's your fitness goal?")
                .font(.title2.bold())
                .multilineTextAlignment(.center)

            VStack(spacing: 12) {
                ForEach(OnboardingData.FitnessGoal.allCases, id: \.self) { goal in
                    Button {
                        withAnimation(.spring(duration: 0.3)) {
                            data.fitnessGoal = goal
                        }
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(goal.displayName)
                                    .font(.headline)
                                Text(goalDescription(for: goal))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            if data.fitnessGoal == goal {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(.orange)
                                    .font(.title3)
                            }
                        }
                        .padding()
                        .background(
                            data.fitnessGoal == goal
                            ? Color.orange.opacity(0.15)
                            : Color(.secondarySystemBackground)
                        )
                        .clipShape(.rect(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(data.fitnessGoal == goal ? Color.orange : Color.clear, lineWidth: 2)
                        )
                    }
                    .foregroundStyle(.primary)
                }
            }
        }
    }

    private func goalDescription(for goal: OnboardingData.FitnessGoal) -> String {
        switch goal {
        case .loseWeight: return "Burn calories and shed pounds"
        case .buildMuscle: return "Gain strength and muscle mass"
        case .maintainFitness: return "Stay active and healthy"
        case .improveEndurance: return "Boost stamina and cardio"
        }
    }
}

struct LevelStepView: View {
    @Binding var data: OnboardingData

    var body: some View {
        VStack(spacing: 24) {
            Text("What's your fitness level?")
                .font(.title2.bold())
                .multilineTextAlignment(.center)

            VStack(spacing: 12) {
                ForEach(OnboardingData.FitnessLevel.allCases, id: \.self) { level in
                    Button {
                        withAnimation(.spring(duration: 0.3)) {
                            data.fitnessLevel = level
                        }
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(level.displayName)
                                    .font(.headline)
                                Text(levelDescription(for: level))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            if data.fitnessLevel == level {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(.orange)
                                    .font(.title3)
                            }
                        }
                        .padding()
                        .background(
                            data.fitnessLevel == level
                            ? Color.orange.opacity(0.15)
                            : Color(.secondarySystemBackground)
                        )
                        .clipShape(.rect(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(data.fitnessLevel == level ? Color.orange : Color.clear, lineWidth: 2)
                        )
                    }
                    .foregroundStyle(.primary)
                }
            }
        }
    }

    private func levelDescription(for level: OnboardingData.FitnessLevel) -> String {
        switch level {
        case .beginner: return "New to working out or returning after a break"
        case .intermediate: return "Work out regularly, comfortable with exercises"
        case .advanced: return "Experienced, looking for challenging workouts"
        }
    }
}

struct PreferenceStepView: View {
    @Binding var data: OnboardingData

    var body: some View {
        VStack(spacing: 24) {
            Text("How do you prefer to work out?")
                .font(.title2.bold())
                .multilineTextAlignment(.center)

            VStack(spacing: 12) {
                ForEach(OnboardingData.WorkoutPreference.allCases, id: \.self) { preference in
                    Button {
                        withAnimation(.spring(duration: 0.3)) {
                            data.workoutPreference = preference
                        }
                    } label: {
                        HStack {
                            Text(preference.displayName)
                                .font(.headline)
                            Spacer()
                            if data.workoutPreference == preference {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(.orange)
                                    .font(.title3)
                            }
                        }
                        .padding()
                        .background(
                            data.workoutPreference == preference
                            ? Color.orange.opacity(0.15)
                            : Color(.secondarySystemBackground)
                        )
                        .clipShape(.rect(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(data.workoutPreference == preference ? Color.orange : Color.clear, lineWidth: 2)
                        )
                    }
                    .foregroundStyle(.primary)
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Workout Duration")
                    .font(.headline)
                    .padding(.top, 8)

                HStack(spacing: 8) {
                    ForEach(OnboardingData.WorkoutDuration.allCases, id: \.self) { duration in
                        Button {
                            data.workoutDuration = duration
                        } label: {
                            Text(duration.displayName)
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .padding(.vertical, 10)
                                .padding(.horizontal, 16)
                                .background(data.workoutDuration == duration ? Color.orange : Color(.secondarySystemBackground))
                                .foregroundStyle(data.workoutDuration == duration ? .white : .primary)
                                .clipShape(.rect(cornerRadius: 20))
                        }
                    }
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Days per week: \(data.daysPerWeek)")
                    .font(.headline)

                Slider(value: .init(
                    get: { Double(data.daysPerWeek) },
                    set: { data.daysPerWeek = Int($0) }
                ), in: 1...7, step: 1)
                .tint(.orange)
            }
        }
    }
}

struct TargetAreasStepView: View {
    @Binding var data: OnboardingData

    let columns = [GridItem(.adaptive(minimum: 100), spacing: 8)]

    var body: some View {
        VStack(spacing: 24) {
            Text("Target areas")
                .font(.title2.bold())
                .multilineTextAlignment(.center)

            Text("Select the areas you want to focus on")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            LazyVGrid(columns: columns, spacing: 8) {
                ForEach(OnboardingData.TargetArea.allCases, id: \.self) { area in
                    Button {
                        withAnimation(.spring(duration: 0.2)) {
                            if data.targetAreas.contains(area) {
                                data.targetAreas.removeAll { $0 == area }
                            } else {
                                data.targetAreas.append(area)
                            }
                        }
                    } label: {
                        Text(area.displayName)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .padding(.vertical, 12)
                            .frame(maxWidth: .infinity)
                            .background(
                                data.targetAreas.contains(area)
                                ? Color.orange.opacity(0.2)
                                : Color(.secondarySystemBackground)
                            )
                            .foregroundStyle(data.targetAreas.contains(area) ? .orange : .primary)
                            .clipShape(.rect(cornerRadius: 20))
                            .overlay(
                                RoundedRectangle(cornerRadius: 20)
                                    .stroke(data.targetAreas.contains(area) ? Color.orange : Color.clear, lineWidth: 1.5)
                            )
                    }
                }
            }
        }
    }
}
