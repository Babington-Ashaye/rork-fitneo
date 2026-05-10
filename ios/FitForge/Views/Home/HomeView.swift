import SwiftUI

struct HomeView: View {
    @Bindable var viewModel: HomeViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header greeting
                headerSection

                // Today's workout card
                todaysWorkoutSection

                // Quick stats
                statsSection

                // Motivational quote
                quoteSection
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 24)
        }
        .refreshable {
            await viewModel.loadTodaysWorkout()
        }
        .task {
            await viewModel.loadTodaysWorkout()
        }
    }

    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(greeting())
                    .font(.title2.bold())
                    .foregroundStyle(.primary)

                Text("Ready to crush your goals?")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
    }

    private var todaysWorkoutSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Today's Workout")
                    .font(.headline)
                Spacer()
                if viewModel.isLoading {
                    ProgressView()
                }
            }

            if let workout = viewModel.todaysWorkout {
                WorkoutCard(workout: workout, onComplete: {
                    Task {
                        await viewModel.markWorkoutCompleted()
                    }
                })
            } else {
                ContentUnavailableView(
                    "No workout today",
                    systemImage: "dumbbell.fill",
                    description: Text("Complete onboarding to get personalized workouts")
                )
                .frame(height: 200)
            }
        }
    }

    private var statsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("This Week")
                .font(.headline)

            if let stats = viewModel.stats {
                HStack(spacing: 12) {
                    StatCard(
                        value: "\(stats.thisWeekWorkouts)",
                        label: "Workouts",
                        icon: "figure.run",
                        color: .orange
                    )
                    StatCard(
                        value: "\(stats.thisWeekMinutes)",
                        label: "Minutes",
                        icon: "clock.fill",
                        color: .red
                    )
                    StatCard(
                        value: "\(stats.currentStreak)",
                        label: "Day Streak",
                        icon: "flame.fill",
                        color: .orange
                    )
                }
            } else {
                HStack(spacing: 12) {
                    ForEach(0..<3) { _ in
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color(.secondarySystemBackground))
                            .frame(height: 100)
                    }
                }
            }
        }
    }

    private var quoteSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Daily Motivation")
                .font(.headline)

            if !viewModel.motivationalQuote.isEmpty {
                HStack(spacing: 12) {
                    Image(systemName: "quote.opening")
                        .font(.title2)
                        .foregroundStyle(.orange.opacity(0.6))

                    Text(viewModel.motivationalQuote)
                        .font(.subheadline)
                        .italic()
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.leading)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color(.secondarySystemBackground))
                )
            }
        }
    }

    private func greeting() -> String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<12: return "Good morning"
        case 12..<17: return "Good afternoon"
        case 17..<22: return "Good evening"
        default: return "Welcome back"
        }
    }
}

struct WorkoutCard: View {
    let workout: WorkoutPlan
    let onComplete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(workout.title)
                        .font(.title3.bold())

                    Text(workout.subtitle)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Spacer()

                if workout.isCompleted {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.title2)
                        .foregroundStyle(.green)
                }
            }

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

            HStack(spacing: 8) {
                ForEach(workout.exercises.prefix(4)) { exercise in
                    Text(exercise.targetArea.displayName)
                        .font(.caption2)
                        .fontWeight(.medium)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.orange.opacity(0.15))
                        .foregroundStyle(.orange)
                        .clipShape(.rect(cornerRadius: 8))
                }
            }

            if !workout.isCompleted {
                Button(action: onComplete) {
                    HStack {
                        Image(systemName: "play.fill")
                        Text("Complete Workout")
                            .font(.headline)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(
                        LinearGradient(colors: [.orange, .red], startPoint: .leading, endPoint: .trailing)
                    )
                    .foregroundStyle(.white)
                    .clipShape(.rect(cornerRadius: 14))
                }
            } else {
                HStack {
                    Image(systemName: "checkmark")
                    Text("Completed")
                        .font(.headline)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.green.opacity(0.15))
                .foregroundStyle(.green)
                .clipShape(.rect(cornerRadius: 14))
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(.secondarySystemBackground))
        )
    }
}

struct StatCard: View {
    let value: String
    let label: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)

            Text(value)
                .font(.title2.bold())
                .foregroundStyle(.primary)

            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.secondarySystemBackground))
        )
    }
}
