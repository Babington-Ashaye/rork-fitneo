import SwiftUI

struct DashboardView: View {
    @Environment(FitneoStore.self) private var store
    @Binding var selectedTab: Int
    var onStartWorkout: (WorkoutProgram) -> Void
    var onOpenJarvis: () -> Void

    @AppStorage("fitneo_myplan_expanded") private var myPlanExpanded: Bool = false
    @State private var selectedPlanWeek = 0

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<12: return "Good morning"
        case 12..<17: return "Good afternoon"
        default: return "Good evening"
        }
    }

    private var recommended: WorkoutProgram {
        JarvisAutopilot.selectWorkout(store: store)
    }

    private var insight: String {
        JarvisBrain.proactiveInsight(
            user: store.user,
            memory: store.jarvisMemory,
            loggedToday: !store.entries(for: Date()).isEmpty,
            workedOutYesterday: store.workoutsThisWeek > 0
        )
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                header
                XPBar(level: store.level, rankTitle: store.rank.title, progress: store.levelProgress, xpInto: store.xpIntoLevel, xpSpan: store.xpForNextLevel)
                if let plan = store.generatedPlan { myPlanSection(plan) }
                heroCard
                if store.generatedPlan == nil { generatePlanCard }
                statsRow
                goalSection
                waterTracker
                insightCard
                recentActivity
                Color.clear.frame(height: 90)
            }
            .padding(.horizontal, 20)
            .padding(.top, 8)
        }
        .scrollIndicators(.hidden)
        .background(Theme.pageGradient.ignoresSafeArea())
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(greeting).font(.system(size: 15, weight: .medium)).foregroundStyle(Theme.textSecondary)
                Text(store.user.name).font(.system(size: 26, weight: .bold)).foregroundStyle(.white)
            }
            Spacer()
            HStack(spacing: 6) {
                StreakFlame(streak: store.currentStreak)
                Text("\(store.currentStreak)")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(.white)
            }
            .padding(.horizontal, 14).padding(.vertical, 8)
            .glassCard(cornerRadius: 16)
        }
        .padding(.top, 8)
    }

    private var heroCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Label("TODAY'S WORKOUT", systemImage: "sparkles")
                    .font(.system(size: 11, weight: .bold)).tracking(1.5)
                    .foregroundStyle(Theme.accent)
                Spacer()
                Text(recommended.category.title)
                    .font(.system(size: 11, weight: .bold))
                    .padding(.horizontal, 10).padding(.vertical, 4)
                    .background(Capsule().fill(recommended.category.tint.opacity(0.2)))
                    .foregroundStyle(recommended.category.tint)
            }
            Text(recommended.name).font(.system(size: 26, weight: .bold)).foregroundStyle(.white)
            HStack(spacing: 18) {
                metaItem("clock", "\(recommended.durationMinutes) min")
                metaItem("flame.fill", "\(recommended.estimatedCalories) kcal")
                metaItem("chart.bar.fill", recommended.difficulty.title)
            }
            HStack(spacing: 10) {
                PillButton(title: "Quick Start", icon: "play.fill") { onStartWorkout(recommended) }
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    onOpenJarvis()
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: "brain.head.profile")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundStyle(Theme.accent)
                            .frame(width: 54, height: 54)
                            .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.05)))
                            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.accent.opacity(0.4), lineWidth: 1))
                        Text("AI")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(Theme.accent)
                            .tracking(1)
                    }
                }
                .buttonStyle(.plain)
            }
        }
        .padding(20)
        .glassCard(cornerRadius: 24)
        .overlay(alignment: .topTrailing) {
            Image(systemName: recommended.category.icon)
                .font(.system(size: 90))
                .foregroundStyle(recommended.category.tint.opacity(0.08))
                .offset(x: 10, y: -10)
                .allowsHitTesting(false)
        }
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }

    private func metaItem(_ icon: String, _ text: String) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 12)).foregroundStyle(Theme.textTertiary)
            Text(text).font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.textSecondary)
        }
    }

    private var statsRow: some View {
        HStack(spacing: 12) {
            StatCard(icon: "flame.fill", value: "\(store.caloriesBurnedToday)", label: "Cal today", tint: Theme.coral)
            StatCard(icon: "dumbbell.fill", value: "\(store.workoutsThisWeek)", label: "This week")
            StatCard(icon: "clock.fill", value: "\(store.activeMinutesToday)", label: "Active min", tint: Color(red: 0, green: 0.85, blue: 0.7))
            StatCard(icon: "flame", value: "\(store.currentStreak)", label: "Streak", tint: .orange)
        }
    }

    private var goalSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("GOALS").font(.system(size: 11, weight: .bold)).tracking(1.5).foregroundStyle(Theme.textTertiary)
            goalRow(title: "Weekly workouts", value: store.workoutsThisWeek, target: store.user.weeklyWorkoutGoal, tint: Theme.accent)
            goalRow(title: "Calories burned", value: store.caloriesBurnedToday, target: 500, tint: Theme.coral)
            goalRow(title: "Calories eaten", value: store.caloriesConsumed(on: Date()), target: store.user.calorieGoal, tint: Color(red: 1, green: 0.78, blue: 0.2))
        }
        .padding(18)
        .glassCard(cornerRadius: 22)
    }

    private func goalRow(title: String, value: Int, target: Int, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(title).font(.system(size: 14, weight: .medium)).foregroundStyle(.white)
                Spacer()
                Text("\(value) / \(target)").font(.system(size: 13, weight: .bold)).foregroundStyle(Theme.textSecondary)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.white.opacity(0.08))
                    Capsule().fill(tint)
                        .frame(width: max(6, geo.size.width * min(1, Double(value) / Double(max(1, target)))))
                }
            }
            .frame(height: 8)
        }
    }

    private var waterTracker: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label("Water intake", systemImage: "drop.fill")
                    .font(.system(size: 14, weight: .semibold)).foregroundStyle(.white)
                Spacer()
                Text("\(store.waterGlasses) / 8").font(.system(size: 13, weight: .bold)).foregroundStyle(Theme.accent)
            }
            HStack(spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    Image(systemName: i < store.waterGlasses ? "drop.fill" : "drop")
                        .font(.system(size: 20))
                        .foregroundStyle(i < store.waterGlasses ? Theme.accent : Theme.textTertiary)
                        .onTapGesture {
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            if i < store.waterGlasses { store.removeWater() } else {
                                while store.waterGlasses <= i { store.addWater() }
                            }
                        }
                }
            }
        }
        .padding(18)
        .glassCard(cornerRadius: 22)
    }

    private var insightCard: some View {
        HStack(alignment: .top, spacing: 14) {
            ZStack {
                Circle().fill(Theme.accent.opacity(0.2)).frame(width: 44, height: 44)
                Image(systemName: "brain.head.profile").foregroundStyle(Theme.accent)
            }
            VStack(alignment: .leading, spacing: 4) {
                Text("Jarvis Insight").font(.system(size: 13, weight: .bold)).foregroundStyle(Theme.accent)
                Text(insight).font(.system(size: 14, weight: .medium)).foregroundStyle(.white).fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(18)
        .glassCard(cornerRadius: 22)
        .onTapGesture { onOpenJarvis() }
    }

    // MARK: - My Plan section (collapsible)

    @ViewBuilder
    private func myPlanSection(_ plan: GeneratedPlan) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            // Collapsed header — always visible
            Button {
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                    myPlanExpanded.toggle()
                }
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "sparkles")
                        .foregroundStyle(Theme.accent)
                        .font(.system(size: 14))
                    Text("MY PLAN")
                        .font(.system(size: 11, weight: .bold))
                        .tracking(1.5)
                        .foregroundStyle(Theme.accent)
                    Text(plan.planName)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                    Spacer()
                    if plan.isSportsPlan, let sport = plan.sportName {
                        Text(sport.uppercased())
                            .font(.system(size: 10, weight: .bold))
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background(Capsule().fill(Theme.coral.opacity(0.2)))
                            .foregroundStyle(Theme.coral)
                    }
                    Image(systemName: "chevron.down")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Theme.textSecondary)
                        .rotationEffect(.degrees(myPlanExpanded ? 180 : 0))
                        .animation(.spring(response: 0.4, dampingFraction: 0.7), value: myPlanExpanded)
                }
                .padding(.horizontal, 16)
                .frame(height: 54)
            }
            .buttonStyle(.plain)
            .glassCard(cornerRadius: myPlanExpanded ? 22 : 16)

            // Expanded content
            if myPlanExpanded {
                VStack(alignment: .leading, spacing: 14) {
                    Text(plan.coachMessage)
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.textSecondary)
                        .lineLimit(3)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.top, 4)

                    let weeks = plan.weeklyStructure
                    ScrollView(.horizontal) {
                        HStack(spacing: 8) {
                            ForEach(Array(weeks.enumerated()), id: \.offset) { idx, week in
                                Button {
                                    withAnimation(.spring(response: 0.3)) { selectedPlanWeek = idx }
                                } label: {
                                    VStack(spacing: 4) {
                                        Text("Week \(week.weekNumber)")
                                            .font(.system(size: 13, weight: .bold))
                                        Text(week.theme)
                                            .font(.system(size: 10))
                                    }
                                    .foregroundStyle(selectedPlanWeek == idx ? .white : Theme.textSecondary)
                                    .padding(.horizontal, 16).padding(.vertical, 10)
                                    .background(
                                        RoundedRectangle(cornerRadius: 14)
                                            .fill(selectedPlanWeek == idx ? Theme.accent.opacity(0.2) : Color.white.opacity(0.04))
                                    )
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 14)
                                            .stroke(selectedPlanWeek == idx ? Theme.accent.opacity(0.5) : Color.white.opacity(0.06), lineWidth: 1)
                                    )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    .scrollIndicators(.hidden)

                    if selectedPlanWeek < weeks.count {
                        let week = weeks[selectedPlanWeek]
                        ForEach(week.days) { day in
                            Button {
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                if let pid = day.programID, let prog = ExerciseLibrary.program(id: pid) {
                                    onStartWorkout(prog)
                                }
                            } label: {
                                HStack(spacing: 14) {
                                    ZStack {
                                        Circle()
                                            .fill(day.programID != nil ? Theme.accent.opacity(0.15) : Color.white.opacity(0.04))
                                            .frame(width: 42, height: 42)
                                        if day.programID != nil {
                                            Image(systemName: "figure.strengthtraining.traditional")
                                                .font(.system(size: 16)).foregroundStyle(Theme.accent)
                                        } else {
                                            Image(systemName: "moon.zzz.fill")
                                                .font(.system(size: 16)).foregroundStyle(Theme.textTertiary)
                                        }
                                    }
                                    VStack(alignment: .leading, spacing: 2) {
                                        HStack {
                                            Text("Day \(day.dayNumber)")
                                                .font(.system(size: 14, weight: .bold)).foregroundStyle(.white)
                                            Text("· \(day.focus)")
                                                .font(.system(size: 13)).foregroundStyle(Theme.accent)
                                        }
                                        Text(day.notes)
                                            .font(.system(size: 12)).foregroundStyle(Theme.textTertiary).lineLimit(1)
                                    }
                                    Spacer()
                                    if day.programID != nil {
                                        Image(systemName: "play.circle.fill")
                                            .font(.system(size: 24)).foregroundStyle(Theme.accent)
                                    }
                                }
                                .padding(14)
                                .glassCard(cornerRadius: 16)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.7), value: myPlanExpanded)
    }

    private var generatePlanCard: some View {
        Button {
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            onOpenJarvis()
        } label: {
            HStack(spacing: 14) {
                ZStack {
                    Circle().fill(Theme.accent.opacity(0.15)).frame(width: 48, height: 48)
                    Image(systemName: "brain.head.profile").font(.system(size: 22)).foregroundStyle(Theme.accent)
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text("FITNEO AI").font(.system(size: 11, weight: .bold)).tracking(1.5).foregroundStyle(Theme.accent)
                    Text("Generate My Plan").font(.system(size: 17, weight: .bold)).foregroundStyle(.white)
                    Text("Get your personalized 4-week AI workout plan")
                        .font(.system(size: 12)).foregroundStyle(Theme.textTertiary)
                }
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(Theme.textTertiary)
            }
            .padding(18)
            .glassCard(cornerRadius: 22)
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder private var recentActivity: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("RECENT ACTIVITY").font(.system(size: 11, weight: .bold)).tracking(1.5).foregroundStyle(Theme.textTertiary)
            if store.workouts.isEmpty {
                Text("No workouts yet — start your first session to see it here.")
                    .font(.system(size: 14)).foregroundStyle(Theme.textTertiary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 8)
            } else {
                ForEach(store.workouts.suffix(5).reversed()) { w in
                    HStack(spacing: 12) {
                        Image(systemName: w.category.icon)
                            .foregroundStyle(w.category.tint)
                            .frame(width: 38, height: 38)
                            .background(Circle().fill(w.category.tint.opacity(0.15)))
                        VStack(alignment: .leading, spacing: 2) {
                            Text(w.name).font(.system(size: 14, weight: .semibold)).foregroundStyle(.white)
                            Text(w.completedAt.formatted(.relative(presentation: .named)))
                                .font(.system(size: 12)).foregroundStyle(Theme.textTertiary)
                        }
                        Spacer()
                        Text("+\(w.xpEarned) XP").font(.system(size: 13, weight: .bold)).foregroundStyle(Theme.accent)
                    }
                }
            }
        }
        .padding(18)
        .glassCard(cornerRadius: 22)
    }
}
