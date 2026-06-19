import SwiftUI

struct CustomWorkoutCreator: View {
    @Environment(FitneoStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var step = 0
    @State private var workoutName = ""
    @State private var selectedExerciseIDs: [String] = []
    @State private var searchEx = ""
    @State private var category: WorkoutCategory = .strength
    @State private var difficulty: Difficulty = .beginner
    @State private var exerciseConfigs: [String: (sets: Int, reps: String, rest: Int)] = [:]

    private let exercises = ExerciseLibrary.exercises

    private var filteredExercises: [Exercise] {
        guard !searchEx.isEmpty else { return exercises }
        let q = searchEx.lowercased()
        return exercises.filter { $0.name.lowercased().contains(q) || $0.muscleGroup.title.lowercased().contains(q) }
    }

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            VStack(spacing: 0) {
                // Step indicator
                HStack(spacing: 4) {
                    ForEach(0..<5) { i in
                        Capsule()
                            .fill(i <= step ? Theme.accent : Color.white.opacity(0.15))
                            .frame(height: 3)
                    }
                }
                .padding(.horizontal, 24).padding(.top, 16)

                ScrollView {
                    VStack(spacing: 20) {
                        switch step {
                        case 0: nameStep
                        case 1: exercisesStep
                        case 2: configureStep
                        case 3: categoryStep
                        case 4: saveStep
                        default: EmptyView()
                        }
                    }
                    .padding(24)
                }
                .scrollIndicators(.hidden)

                // Bottom nav
                HStack(spacing: 12) {
                    if step > 0 {
                        Button { withAnimation { step -= 1 } } label: {
                            Text("Back").font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(Theme.textSecondary)
                                .padding(.vertical, 14).padding(.horizontal, 24)
                                .background(RoundedRectangle(cornerRadius: 14).fill(Color.white.opacity(0.06)))
                        }
                        .buttonStyle(.plain)
                    }
                    if step < 4 {
                        Button {
                            if canAdvance { withAnimation(.spring(response: 0.35)) { step += 1 } }
                        } label: {
                            Text("Next").font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                                .frame(maxWidth: .infinity).padding(.vertical, 14)
                                .background(RoundedRectangle(cornerRadius: 14).fill(canAdvance ? Theme.accent : Theme.accent.opacity(0.3)))
                        }
                        .buttonStyle(.plain).disabled(!canAdvance)
                    }
                }
                .padding(.horizontal, 24).padding(.bottom, 12)
            }
        }
        .presentationDragIndicator(.visible)
    }

    private var canAdvance: Bool {
        switch step {
        case 0: !workoutName.trimmingCharacters(in: .whitespaces).isEmpty
        case 1: !selectedExerciseIDs.isEmpty
        default: true
        }
    }

    // STEP 0: Name
    private var nameStep: some View {
        VStack(alignment: .leading, spacing: 22) {
            Text("NAME YOUR WORKOUT").font(.system(size: 12, weight: .bold)).tracking(2).foregroundStyle(Theme.accent)
            Text("What do you want to call it?").font(.system(size: 26, weight: .bold)).foregroundStyle(.white)
            TextField("e.g. My Saturday Burn", text: $workoutName)
                .foregroundStyle(.white).tint(Theme.accent)
                .padding(16)
                .glassCard(cornerRadius: 14)
            Text("\(workoutName.count)/40").font(.caption).foregroundStyle(Theme.textTertiary)
                .onChange(of: workoutName) { _, val in
                    if val.count > 40 { workoutName = String(val.prefix(40)) }
                }
        }
    }

    // STEP 1: Add exercises
    private var exercisesStep: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("ADD EXERCISES").font(.system(size: 12, weight: .bold)).tracking(2).foregroundStyle(Theme.accent)
            Text("Select your exercises").font(.system(size: 26, weight: .bold)).foregroundStyle(.white)
            HStack {
                Image(systemName: "magnifyingglass").foregroundStyle(Theme.textTertiary)
                TextField("Search exercises…", text: $searchEx)
                    .foregroundStyle(.white).tint(Theme.accent)
            }
            .padding(14).glassCard(cornerRadius: 14)

            Text("\(selectedExerciseIDs.count) selected").font(.caption).foregroundStyle(Theme.accent)

            LazyVStack(spacing: 8) {
                ForEach(filteredExercises) { ex in
                    let isSelected = selectedExerciseIDs.contains(ex.id)
                    Button {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        if isSelected {
                            selectedExerciseIDs.removeAll { $0 == ex.id }
                            exerciseConfigs.removeValue(forKey: ex.id)
                        } else {
                            selectedExerciseIDs.append(ex.id)
                            exerciseConfigs[ex.id] = (ex.sets, ex.reps, ex.restSeconds)
                        }
                    } label: {
                        HStack(spacing: 12) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(ex.name).font(.system(size: 15, weight: .semibold)).foregroundStyle(.white)
                                Text(ex.muscleGroup.title).font(.system(size: 12)).foregroundStyle(Theme.textTertiary)
                            }
                            Spacer()
                            Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                                .font(.system(size: 22))
                                .foregroundStyle(isSelected ? Theme.accent : Theme.textTertiary)
                        }
                        .padding(14).glassCard(selected: isSelected, cornerRadius: 14)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    // STEP 2: Configure sets/reps/rest
    private var configureStep: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("CONFIGURE").font(.system(size: 12, weight: .bold)).tracking(2).foregroundStyle(Theme.accent)
            Text("Customize each exercise").font(.system(size: 26, weight: .bold)).foregroundStyle(.white)

            ForEach(selectedExerciseIDs, id: \.self) { exID in
                if let ex = ExerciseLibrary.exercise(id: exID) {
                    let cfg = exerciseConfigs[exID] ?? (ex.sets, ex.reps, ex.restSeconds)
                    VStack(alignment: .leading, spacing: 12) {
                        Text(ex.name).font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                        HStack(spacing: 12) {
                            stepperColumn(label: "Sets", value: cfg.sets) { newVal in
                                var c = exerciseConfigs[exID] ?? (ex.sets, ex.reps, ex.restSeconds)
                                c.sets = max(1, newVal)
                                exerciseConfigs[exID] = c
                            }
                            stepperColumn(label: "Reps", value: Int(cfg.reps.filter { $0.isNumber }) ?? 12) { newVal in
                                var c = exerciseConfigs[exID] ?? (ex.sets, ex.reps, ex.restSeconds)
                                c.reps = "\(newVal)"
                                exerciseConfigs[exID] = c
                            }
                            stepperColumn(label: "Rest (s)", value: cfg.rest) { newVal in
                                var c = exerciseConfigs[exID] ?? (ex.sets, ex.reps, ex.restSeconds)
                                c.rest = max(15, newVal)
                                exerciseConfigs[exID] = c
                            }
                        }
                    }
                    .padding(14)
                    .glassCard(cornerRadius: 14)
                }
            }
        }
    }

    private func stepperColumn(label: String, value: Int, onChange: @escaping (Int) -> Void) -> some View {
        VStack(spacing: 4) {
            Text(label).font(.system(size: 10, weight: .bold)).foregroundStyle(Theme.textTertiary)
            HStack(spacing: 4) {
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    onChange(max(1, value - 1))
                } label: {
                    Image(systemName: "minus").font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Theme.accent).frame(width: 28, height: 28)
                        .background(Circle().fill(Theme.accent.opacity(0.12)))
                }
                .buttonStyle(.plain)
                Text("\(value)")
                    .font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                    .frame(minWidth: 30)
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    onChange(value + 1)
                } label: {
                    Image(systemName: "plus").font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Theme.accent).frame(width: 28, height: 28)
                        .background(Circle().fill(Theme.accent.opacity(0.12)))
                }
                .buttonStyle(.plain)
            }
        }
    }

    // STEP 3: Category & difficulty
    private var categoryStep: some View {
        VStack(alignment: .leading, spacing: 22) {
            Text("CATEGORIZE").font(.system(size: 12, weight: .bold)).tracking(2).foregroundStyle(Theme.accent)
            Text("Choose category").font(.system(size: 26, weight: .bold)).foregroundStyle(.white)
            ForEach(WorkoutCategory.allCases, id: \.self) { cat in
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    category = cat
                } label: {
                    HStack(spacing: 14) {
                        Image(systemName: cat.icon).font(.system(size: 20)).foregroundStyle(cat.tint)
                            .frame(width: 44, height: 44).background(Circle().fill(cat.tint.opacity(0.15)))
                        Text(cat.title).font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                        Spacer()
                        if category == cat {
                            Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.accent)
                        }
                    }
                    .padding(16).glassCard(selected: category == cat, cornerRadius: 16)
                }
                .buttonStyle(.plain)
            }

            Text("Choose difficulty").font(.system(size: 26, weight: .bold)).foregroundStyle(.white).padding(.top, 10)
            ForEach(Difficulty.allCases, id: \.self) { d in
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    difficulty = d
                } label: {
                    HStack {
                        Text(d.title).font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                        Spacer()
                        if difficulty == d {
                            Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.accent)
                        }
                    }
                    .padding(16).glassCard(selected: difficulty == d, cornerRadius: 16)
                }
                .buttonStyle(.plain)
            }
        }
    }

    // STEP 4: Save
    private var saveStep: some View {
        VStack(spacing: 24) {
            Spacer()
            ZStack {
                Circle().fill(Theme.accent.opacity(0.2)).frame(width: 100, height: 100).blur(radius: 20)
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 60, weight: .bold)).foregroundStyle(Theme.accent)
            }
            Text(workoutName).font(.system(size: 24, weight: .bold)).foregroundStyle(.white)
            Text("\(selectedExerciseIDs.count) exercises · \(category.title) · \(difficulty.title)")
                .font(.system(size: 14)).foregroundStyle(Theme.textSecondary)

            let totalMin = selectedExerciseIDs.reduce(0) { acc, id in
                let cfg = exerciseConfigs[id] ?? (3, "12", 60)
                let reps = Int(cfg.reps.filter { $0.isNumber }) ?? 12
                return acc + cfg.sets * reps * 3 + cfg.rest * cfg.sets
            } / 60

            Text("~\(max(5, totalMin)) min estimated").font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.accent)

            Button {
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                saveWorkout()
            } label: {
                Text("Save Workout").primaryButtonStyle()
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 32)

            Text("Saved to your library under a Custom category")
                .font(.system(size: 12)).foregroundStyle(Theme.textTertiary)
            Spacer()
        }
    }

    private func saveWorkout() {
        let name = workoutName.trimmingCharacters(in: .whitespaces)
        let totalMin = max(5, selectedExerciseIDs.reduce(0) { acc, id in
            let cfg = exerciseConfigs[id] ?? (3, "12", 60)
            let reps = Int(cfg.reps.filter { $0.isNumber }) ?? 12
            return acc + cfg.sets * reps * 3 + cfg.rest * cfg.sets
        } / 60)

        let muscleGroups = Array(Set(selectedExerciseIDs.compactMap { ExerciseLibrary.exercise(id: $0)?.muscleGroup }))

        let program = WorkoutProgram(
            id: "custom_\(UUID().uuidString.prefix(8))",
            name: name,
            category: category,
            difficulty: difficulty,
            durationMinutes: totalMin,
            description: "Custom workout: \(selectedExerciseIDs.count) exercises",
            muscleGroups: muscleGroups,
            exerciseIDs: selectedExerciseIDs,
            isPremium: false
        )
        store.addCustomProgram(program)
        dismiss()
    }
}
