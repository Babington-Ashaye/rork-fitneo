import SwiftUI

struct ProgressScreen: View {
    @Bindable var viewModel: ProgressViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Time range picker
                timeRangePicker

                // Stats cards
                statsSection

                // Weekly chart
                weeklyChart

                // Recent history
                historySection
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 24)
        }
        .navigationTitle("Progress")
        .refreshable {
            await viewModel.loadHistory()
        }
        .task {
            await viewModel.loadHistory()
        }
    }

    private var timeRangePicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(ProgressViewModel.TimeRange.allCases, id: \.self) { range in
                    Button {
                        withAnimation(.spring(duration: 0.3)) {
                            viewModel.selectedTimeRange = range
                        }
                    } label: {
                        Text(range.rawValue)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .padding(.vertical, 8)
                            .padding(.horizontal, 16)
                            .background(viewModel.selectedTimeRange == range ? Color.orange : Color(.secondarySystemBackground))
                            .foregroundStyle(viewModel.selectedTimeRange == range ? .white : .primary)
                            .clipShape(.rect(cornerRadius: 20))
                    }
                }
            }
        }
        .contentMargins(.horizontal, 16, for: .scrollContent)
    }

    private var statsSection: some View {
        VStack(spacing: 16) {
            if let stats = viewModel.stats {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    StatCard(
                        value: "\(stats.totalWorkouts)",
                        label: "Total Workouts",
                        icon: "figure.run",
                        color: .orange
                    )
                    StatCard(
                        value: "\(stats.totalMinutes)",
                        label: "Total Minutes",
                        icon: "clock.fill",
                        color: .blue
                    )
                    StatCard(
                        value: "\(stats.currentStreak)",
                        label: "Current Streak",
                        icon: "flame.fill",
                        color: .red
                    )
                    StatCard(
                        value: "\(stats.longestStreak)",
                        label: "Best Streak",
                        icon: "trophy.fill",
                        color: .yellow
                    )
                }
            } else {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    ForEach(0..<4) { _ in
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color(.secondarySystemBackground))
                            .frame(height: 100)
                    }
                }
            }
        }
    }

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Weekly Activity")
                .font(.headline)

            if viewModel.weeklyData.allSatisfy({ $0.1 == 0 }) {
                ContentUnavailableView(
                    "No activity yet",
                    systemImage: "chart.bar",
                    description: Text("Complete your first workout to see your activity")
                )
                .frame(height: 150)
            } else {
                HStack(alignment: .bottom, spacing: 12) {
                    ForEach(viewModel.weeklyData, id: \.0) { day, count in
                        VStack(spacing: 6) {
                            Text("\(count)")
                                .font(.caption2)
                                .fontWeight(.semibold)
                                .foregroundStyle(count > 0 ? .orange : .secondary)

                            GeometryReader { geo in
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(count > 0 ? Color.orange : Color(.systemGray4))
                                    .frame(height: geo.size.height * CGFloat(min(count, 5)) / 5.0)
                                    .frame(maxHeight: .infinity, alignment: .bottom)
                            }
                            .frame(height: 80)

                            Text(day)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(.secondarySystemBackground))
        )
    }

    private var historySection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Recent Workouts")
                    .font(.headline)
                Spacer()
                Text("\(viewModel.filteredHistory.count) total")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if viewModel.filteredHistory.isEmpty {
                ContentUnavailableView(
                    "No workouts yet",
                    systemImage: "dumbbell",
                    description: Text("Complete workouts to see your history here")
                )
                .frame(height: 150)
            } else {
                ForEach(viewModel.filteredHistory.prefix(10)) { item in
                    HistoryRow(item: item)
                }
            }
        }
    }
}

struct HistoryRow: View {
    let item: WorkoutHistory

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color.green.opacity(0.15))
                    .frame(width: 40, height: 40)

                Image(systemName: "checkmark")
                    .font(.caption.bold())
                    .foregroundStyle(.green)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(item.workoutTitle)
                    .font(.subheadline)
                    .fontWeight(.semibold)

                HStack(spacing: 8) {
                    Text(item.completedAt, style: .date)
                        .font(.caption2)
                        .foregroundStyle(.secondary)

                    Text("\(item.durationMinutes) min")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.secondarySystemBackground))
        )
    }
}
