import SwiftUI

struct WorkoutsView: View {
    @Bindable var viewModel: WorkoutsViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Category filter
                categoryFilter

                // Workout grid
                workoutGrid
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 24)
        }
        .navigationTitle("Workouts")
        .task {
            await viewModel.loadWorkouts()
        }
        .sheet(item: $viewModel.selectedWorkout) { workout in
            WorkoutDetailView(workout: workout)
        }
        .alert("Premium Required", isPresented: $viewModel.showPremiumPrompt) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("Upgrade to FitForge Premium to unlock this workout and more advanced training programs.")
        }
    }

    private var categoryFilter: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                FilterChip(
                    title: "All",
                    isSelected: viewModel.selectedCategory == nil,
                    action: { viewModel.selectCategory(nil) }
                )

                ForEach(viewModel.categories, id: \.self) { category in
                    FilterChip(
                        title: category.displayName,
                        isSelected: viewModel.selectedCategory == category,
                        action: { viewModel.selectCategory(category) }
                    )
                }
            }
            .padding(.horizontal, 4)
        }
        .contentMargins(.horizontal, 16, for: .scrollContent)
    }

    private var workoutGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible())], spacing: 16) {
            ForEach(viewModel.filteredWorkouts) { workout in
                WorkoutListCard(
                    workout: workout,
                    isPremiumLocked: !viewModel.canAccessWorkout(workout)
                )
                .onTapGesture {
                    viewModel.selectWorkout(workout)
                }
            }
        }
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.semibold)
                .padding(.vertical, 8)
                .padding(.horizontal, 16)
                .background(isSelected ? Color.orange : Color(.secondarySystemBackground))
                .foregroundStyle(isSelected ? .white : .primary)
                .clipShape(.rect(cornerRadius: 20))
        }
    }
}

struct WorkoutListCard: View {
    let workout: WorkoutPlan
    let isPremiumLocked: Bool

    var body: some View {
        HStack(spacing: 16) {
            // Icon container
            ZStack {
                RoundedRectangle(cornerRadius: 16)
                    .fill(categoryColor.opacity(0.15))
                    .frame(width: 64, height: 64)

                Image(systemName: categoryIcon)
                    .font(.title2)
                    .foregroundStyle(categoryColor)
            }

            // Content
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(workout.title)
                        .font(.headline)

                    if workout.isPremium {
                        Image(systemName: "crown.fill")
                            .font(.caption)
                            .foregroundStyle(.yellow)
                    }
                }

                Text(workout.subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)

                HStack(spacing: 12) {
                    Label("\(workout.totalDuration) min", systemImage: "clock")
                        .font(.caption2)
                        .foregroundStyle(.secondary)

                    Label("\(workout.exercises.count) exercises", systemImage: "list.bullet")
                        .font(.caption2)
                        .foregroundStyle(.secondary)

                    Label(workout.difficulty.displayName, systemImage: "chart.bar")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            if isPremiumLocked {
                Image(systemName: "lock.fill")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(.secondarySystemBackground))
        )
        .opacity(isPremiumLocked ? 0.7 : 1)
    }

    private var categoryColor: Color {
        switch workout.category {
        case .home: return .green
        case .gym: return .blue
        case .yoga: return .purple
        case .hiit: return .red
        case .strength: return .orange
        case .cardio: return .cyan
        }
    }

    private var categoryIcon: String {
        switch workout.category {
        case .home: return "house.fill"
        case .gym: return "dumbbell.fill"
        case .yoga: return "figure.mind.and.body"
        case .hiit: return "bolt.fill"
        case .strength: return "figure.strengthtraining.traditional"
        case .cardio: return "heart.fill"
        }
    }
}
