import SwiftUI

struct WorkoutDetailView: View {
    let workout: WorkoutPlan
    @Environment(\.dismiss) private var dismiss
    @State private var completedExercises: Set<UUID> = []
    @State private var showCompletionCelebration = false

    var progress: Double {
        guard !workout.exercises.isEmpty else { return 0 }
        return Double(completedExercises.count) / Double(workout.exercises.count)
    }

    var isComplete: Bool {
        completedExercises.count == workout.exercises.count
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    workoutHeader

                    // Progress bar
                    if !workout.exercises.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("Progress")
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                                Spacer()
                                Text("\(completedExercises.count)/\(workout.exercises.count)")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }

                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(Color(.systemGray5))
                                        .frame(height: 8)

                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(
                                            LinearGradient(colors: [.orange, .red], startPoint: .leading, endPoint: .trailing)
                                        )
                                        .frame(width: geo.size.width * progress, height: 8)
                                }
                            }
                            .frame(height: 8)
                        }
                        .padding(.horizontal, 16)
                    }

                    // Exercises
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Exercises")
                            .font(.headline)
                            .padding(.horizontal, 16)

                        ForEach(workout.exercises) { exercise in
                            ExerciseRow(
                                exercise: exercise,
                                isCompleted: completedExercises.contains(exercise.id)
                            ) {
                                if completedExercises.contains(exercise.id) {
                                    completedExercises.remove(exercise.id)
                                } else {
                                    completedExercises.insert(exercise.id)
                                    if isComplete {
                                        showCompletionCelebration = true
                                    }
                                }
                            }
                            .padding(.horizontal, 16)
                        }
                    }
                }
                .padding(.vertical, 16)
            }
            .navigationTitle(workout.title)
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .overlay(alignment: .bottom) {
                if isComplete {
                    VStack {
                        Button {
                            dismiss()
                        } label: {
                            HStack {
                                Image(systemName: "checkmark.circle.fill")
                                Text("Workout Complete!")
                                    .font(.headline)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(
                                LinearGradient(colors: [.green, .mint], startPoint: .leading, endPoint: .trailing)
                            )
                            .foregroundStyle(.white)
                            .clipShape(.rect(cornerRadius: 16))
                        }
                    }
                    .padding()
                    .background(.ultraThinMaterial)
                }
            }
        }
    }

    private var workoutHeader: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(workout.subtitle)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    HStack(spacing: 16) {
                        Label("\(workout.totalDuration) min", systemImage: "clock")
                            .font(.caption)
                            .foregroundStyle(.secondary)

                        Label("\(workout.exercises.count) exercises", systemImage: "list.bullet")
                            .font(.caption)
                            .foregroundStyle(.secondary)

                        Label(workout.difficulty.displayName, systemImage: "chart.bar")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer()
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color(.secondarySystemBackground))
            )
            .padding(.horizontal, 16)
        }
    }
}

struct ExerciseRow: View {
    let exercise: Exercise
    let isCompleted: Bool
    let onToggle: () -> Void
    @State private var showDetail = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 12) {
                Button(action: onToggle) {
                    ZStack {
                        Circle()
                            .fill(isCompleted ? Color.green.opacity(0.2) : Color(.systemGray5))
                            .frame(width: 32, height: 32)

                        if isCompleted {
                            Image(systemName: "checkmark")
                                .font(.caption.bold())
                                .foregroundStyle(.green)
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(exercise.name)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .strikethrough(isCompleted)
                        .foregroundStyle(isCompleted ? .secondary : .primary)

                    Text(exercise.displaySetsReps)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Button {
                    showDetail.toggle()
                } label: {
                    Image(systemName: showDetail ? "chevron.up" : "chevron.down")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color(.secondarySystemBackground))
            )

            if showDetail {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Instructions")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.secondary)

                    Text(exercise.instructions)
                        .font(.subheadline)
                        .foregroundStyle(.primary)
                        .fixedSize(horizontal: false, vertical: true)

                    HStack(spacing: 12) {
                        Label(exercise.equipment.displayName, systemImage: "dumbbell")
                            .font(.caption)
                            .foregroundStyle(.secondary)

                        Label("Rest: \(exercise.restSeconds)s", systemImage: "timer")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color(.tertiarySystemBackground))
                )
                .padding(.top, 8)
                .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
    }
}
