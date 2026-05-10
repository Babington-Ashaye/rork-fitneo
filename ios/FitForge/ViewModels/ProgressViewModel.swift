import SwiftUI

@Observable
@MainActor
final class ProgressViewModel {
    var history: [WorkoutHistory] = []
    var stats: WorkoutStats?
    var isLoading = false
    var errorMessage: String?
    var selectedTimeRange: TimeRange = .week

    enum TimeRange: String, CaseIterable {
        case week = "Week"
        case month = "Month"
        case year = "Year"
        case all = "All Time"
    }

    private let service = SupabaseService.shared

    var filteredHistory: [WorkoutHistory] {
        let calendar = Calendar.current
        let now = Date()

        return history.filter { item in
            switch selectedTimeRange {
            case .week:
                let weekStart = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: now)) ?? now
                return item.completedAt >= weekStart
            case .month:
                let monthStart = calendar.date(from: calendar.dateComponents([.year, .month], from: now)) ?? now
                return item.completedAt >= monthStart
            case .year:
                let yearStart = calendar.date(from: calendar.dateComponents([.year], from: now)) ?? now
                return item.completedAt >= yearStart
            case .all:
                return true
            }
        }
    }

    var weeklyData: [(String, Int)] {
        let calendar = Calendar.current
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"

        var data: [(String, Int)] = []
        for dayOffset in 0..<7 {
            guard let date = calendar.date(byAdding: .day, value: -dayOffset, to: Date()) else { continue }
            let dayName = formatter.string(from: date)
            let dayStart = calendar.startOfDay(for: date)
            let dayEnd = calendar.date(byAdding: .day, value: 1, to: dayStart) ?? dayStart
            let count = filteredHistory.filter { $0.completedAt >= dayStart && $0.completedAt < dayEnd }.count
            data.append((dayName, count))
        }
        return data.reversed()
    }

    func loadHistory() async {
        isLoading = true
        errorMessage = nil

        guard let userId = service.userId else {
            errorMessage = "Not authenticated"
            isLoading = false
            return
        }

        do {
            history = try await service.fetchWorkoutHistory(userId: userId)
            calculateStats()
        } catch {
            errorMessage = "Failed to load progress"
        }

        isLoading = false
    }

    private func calculateStats() {
        let totalWorkouts = history.count
        let totalMinutes = history.reduce(0) { $0 + $1.durationMinutes }

        var currentStreak = 0
        var longestStreak = 0
        var tempStreak = 0

        let calendar = Calendar.current
        let sortedDates = history.map { $0.completedAt }.sorted(by: >)

        if let lastWorkout = sortedDates.first {
            let daysSince = calendar.dateComponents([.day], from: calendar.startOfDay(for: lastWorkout), to: calendar.startOfDay(for: Date())).day ?? 0
            if daysSince <= 1 {
                currentStreak = 1
                for i in 1..<sortedDates.count {
                    let dayDiff = calendar.dateComponents([.day], from: calendar.startOfDay(for: sortedDates[i]), to: calendar.startOfDay(for: sortedDates[i-1])).day ?? 0
                    if dayDiff == 1 {
                        currentStreak += 1
                    } else {
                        break
                    }
                }
            }
        }

        tempStreak = 1
        for i in 1..<sortedDates.count {
            let dayDiff = calendar.dateComponents([.day], from: calendar.startOfDay(for: sortedDates[i]), to: calendar.startOfDay(for: sortedDates[i-1])).day ?? 0
            if dayDiff == 1 {
                tempStreak += 1
            } else {
                longestStreak = max(longestStreak, tempStreak)
                tempStreak = 1
            }
        }
        longestStreak = max(longestStreak, tempStreak)

        let weekStart = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: Date())) ?? Date()
        let thisWeekHistory = history.filter { $0.completedAt >= weekStart }
        let thisWeekWorkouts = thisWeekHistory.count
        let thisWeekMinutes = thisWeekHistory.reduce(0) { $0 + $1.durationMinutes }

        stats = WorkoutStats(
            totalWorkouts: totalWorkouts,
            currentStreak: currentStreak,
            longestStreak: longestStreak,
            totalMinutes: totalMinutes,
            thisWeekWorkouts: thisWeekWorkouts,
            thisWeekMinutes: thisWeekMinutes
        )
    }
}
