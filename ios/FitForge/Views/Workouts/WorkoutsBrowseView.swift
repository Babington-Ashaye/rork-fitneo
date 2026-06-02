import SwiftUI

struct WorkoutsBrowseView: View {
    @Environment(FitneoStore.self) private var store
    var onStart: (WorkoutProgram) -> Void

    @State private var selectedCategory: WorkoutCategory?
    @State private var detailProgram: WorkoutProgram?
    @State private var showPaywall = false

    private var filtered: [WorkoutProgram] {
        guard let cat = selectedCategory else { return ExerciseLibrary.programs }
        return ExerciseLibrary.programs.filter { $0.category == cat }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                ScreenTitle(title: "Workouts", subtitle: "Programs tuned to your level")
                    .padding(.horizontal, 20)

                categoryRow

                LazyVStack(spacing: 14) {
                    ForEach(filtered) { program in
                        WorkoutCard(program: program, locked: program.isPremium && !store.subscription.isPremium)
                            .onTapGesture {
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                if program.isPremium && !store.subscription.isPremium {
                                    showPaywall = true
                                } else {
                                    detailProgram = program
                                }
                            }
                    }
                }
                .padding(.horizontal, 20)
                Color.clear.frame(height: 90)
            }
            .padding(.top, 8)
        }
        .scrollIndicators(.hidden)
        .background(Theme.pageGradient.ignoresSafeArea())
        .sheet(item: $detailProgram) { program in
            WorkoutDetailSheet(program: program) {
                detailProgram = nil
                onStart(program)
            }
        }
        .sheet(isPresented: $showPaywall) { PaywallView() }
    }

    private var categoryRow: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 10) {
                chip(title: "All", active: selectedCategory == nil) { selectedCategory = nil }
                ForEach(WorkoutCategory.allCases, id: \.self) { cat in
                    chip(title: cat.title, active: selectedCategory == cat) { selectedCategory = cat }
                }
            }
        }
        .scrollIndicators(.hidden)
        .contentMargins(.horizontal, 20)
    }

    private func chip(title: String, active: Bool, action: @escaping () -> Void) -> some View {
        Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            withAnimation(.spring(response: 0.3)) { action() }
        } label: {
            Text(title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(active ? .white : Theme.textSecondary)
                .padding(.horizontal, 16).padding(.vertical, 9)
                .background(Capsule().fill(active ? Theme.accent : Color.white.opacity(0.05)))
                .overlay(Capsule().stroke(active ? Color.clear : Color.white.opacity(0.08), lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}

struct WorkoutCard: View {
    let program: WorkoutProgram
    let locked: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: program.category.icon)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(program.category.tint)
                    .frame(width: 44, height: 44)
                    .background(RoundedRectangle(cornerRadius: 14).fill(program.category.tint.opacity(0.15)))
                VStack(alignment: .leading, spacing: 3) {
                    Text(program.name).font(.system(size: 17, weight: .bold)).foregroundStyle(.white)
                    Text(program.category.title).font(.system(size: 12, weight: .medium)).foregroundStyle(program.category.tint)
                }
                Spacer()
                if locked {
                    Image(systemName: "lock.fill").foregroundStyle(Color(red: 1, green: 0.78, blue: 0.2))
                }
            }
            Text(program.description).font(.system(size: 13)).foregroundStyle(Theme.textSecondary)
                .lineLimit(2).fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 16) {
                meta("clock", "\(program.durationMinutes)m")
                meta("flame.fill", "\(program.estimatedCalories)")
                meta("square.stack.3d.up.fill", "\(program.exerciseIDs.count) ex")
                Spacer()
                DifficultyDots(difficulty: program.difficulty)
            }
        }
        .padding(16)
        .glassCard(cornerRadius: 20)
    }

    private func meta(_ icon: String, _ text: String) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon).font(.system(size: 11)).foregroundStyle(Theme.textTertiary)
            Text(text).font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.textSecondary)
        }
    }
}

struct WorkoutDetailSheet: View {
    let program: WorkoutProgram
    var onStart: () -> Void
    @Environment(\.dismiss) private var dismiss

    private var exercises: [Exercise] { ExerciseLibrary.exercises(ids: program.exerciseIDs) }

    var body: some View {
        ZStack(alignment: .bottom) {
            Theme.pageGradient.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text(program.category.title.uppercased())
                                .font(.system(size: 11, weight: .bold)).tracking(1.5)
                                .padding(.horizontal, 10).padding(.vertical, 4)
                                .background(Capsule().fill(program.category.tint.opacity(0.2)))
                                .foregroundStyle(program.category.tint)
                            Spacer()
                            DifficultyDots(difficulty: program.difficulty)
                        }
                        Text(program.name).font(.system(size: 28, weight: .bold)).foregroundStyle(.white)
                        Text(program.description).font(.system(size: 15)).foregroundStyle(Theme.textSecondary)
                        HStack(spacing: 20) {
                            stat("clock", "\(program.durationMinutes) min")
                            stat("flame.fill", "\(program.estimatedCalories) kcal")
                            stat("square.stack.3d.up.fill", "\(exercises.count) exercises")
                        }
                        .padding(.top, 4)
                    }

                    Text("EXERCISES").font(.system(size: 12, weight: .bold)).tracking(1.5).foregroundStyle(Theme.textTertiary)
                    ForEach(Array(exercises.enumerated()), id: \.element.id) { idx, ex in
                        HStack(spacing: 14) {
                            Text("\(idx + 1)").font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.accent)
                                .frame(width: 30, height: 30)
                                .background(Circle().fill(Theme.accent.opacity(0.15)))
                            VStack(alignment: .leading, spacing: 2) {
                                Text(ex.name).font(.system(size: 15, weight: .semibold)).foregroundStyle(.white)
                                Text(ex.muscleGroup.title).font(.system(size: 12)).foregroundStyle(Theme.textTertiary)
                            }
                            Spacer()
                            Text("\(ex.sets) × \(ex.reps)").font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.textSecondary)
                        }
                        .padding(14)
                        .glassCard(cornerRadius: 16)
                    }
                    Color.clear.frame(height: 90)
                }
                .padding(20)
            }
            .scrollIndicators(.hidden)

            PillButton(title: "Start Workout", icon: "play.fill", action: onStart)
                .padding(.horizontal, 20)
                .padding(.bottom, 8)
                .background(LinearGradient(colors: [.clear, Theme.background], startPoint: .top, endPoint: .bottom).ignoresSafeArea())
        }
        .presentationDragIndicator(.visible)
    }

    private func stat(_ icon: String, _ text: String) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 12)).foregroundStyle(Theme.accent)
            Text(text).font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.textSecondary)
        }
    }
}
