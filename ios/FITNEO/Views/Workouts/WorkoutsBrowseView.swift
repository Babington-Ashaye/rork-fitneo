import SwiftUI

struct WorkoutsBrowseView: View {
    @Environment(FitneoStore.self) private var store
    var onStart: (WorkoutProgram) -> Void

    @State private var selectedCategory: WorkoutCategory?
    @State private var detailProgram: WorkoutProgram?
    @State private var showPaywall = false
    @State private var searchQuery = ""
    @State private var isSportsMode = false
    @State private var sportSelection = SportSelection()
    @State private var sportsPhase: SportsPhase = .selectSport
    @State private var showSportsGeneration = false
    @State private var sportsPlan: GeneratedPlan?
    @State private var showCustomCreator = false

    enum SportsPhase { case selectSport, selectLevel, selectPosition, showPlan }

    private var allPrograms: [WorkoutProgram] {
        if isSportsMode, let plan = sportsPlan ?? (store.generatedPlan?.isSportsPlan == true ? store.generatedPlan : nil) {
            return []
        }
        return store.allPrograms
    }

    private var filtered: [WorkoutProgram] {
        var result = allPrograms
        if let cat = selectedCategory { result = result.filter { $0.category == cat } }
        if !searchQuery.isEmpty {
            let q = searchQuery.lowercased()
            result = result.filter { $0.name.lowercased().contains(q) || $0.category.title.lowercased().contains(q) || $0.description.lowercased().contains(q) }
        }
        return result
    }

    var body: some View {
        ZStack {
            if isSportsMode {
                sportsModeContent
            } else {
                normalContent
            }
        }
        .background(Theme.pageGradient.ignoresSafeArea())
        .sheet(item: $detailProgram) { program in
            WorkoutDetailSheet(program: program) {
                detailProgram = nil
                onStart(program)
            }
        }
        .sheet(isPresented: $showPaywall) { PaywallView() }
        .fullScreenCover(isPresented: $showSportsGeneration) {
            SportsPlanGenView(
                onboarding: OnboardingData(),
                sport: sportSelection.sport!,
                level: sportSelection.level!,
                position: sportSelection.position
            ) { plan in
                store.generatedPlan = plan
                sportsPlan = plan
                store.sportsSelection = sportSelection
                sportsPhase = .showPlan
                showSportsGeneration = false
            }
        }
        .fullScreenCover(isPresented: $showCustomCreator) {
            CustomWorkoutCreator()
                .environment(store)
        }
    }

    // MARK: - Normal mode

    private var normalContent: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                // Mode toggle
                HStack(spacing: 0) {
                    Button {
                        withAnimation(.spring(response: 0.35)) { isSportsMode = false }
                    } label: {
                        Text("Normal")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(!isSportsMode ? .white : Theme.textSecondary)
                            .frame(maxWidth: .infinity).padding(.vertical, 10)
                            .background(Capsule().fill(!isSportsMode ? Theme.accent : Color.clear))
                    }
                    .buttonStyle(.plain)
                    Button {
                        withAnimation(.spring(response: 0.35)) { isSportsMode = true }
                    } label: {
                        Text("Sports")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(isSportsMode ? .white : Theme.textSecondary)
                            .frame(maxWidth: .infinity).padding(.vertical, 10)
                            .background(Capsule().fill(isSportsMode ? Theme.coral : Color.clear))
                    }
                    .buttonStyle(.plain)
                }
                .padding(3)
                .background(Capsule().fill(Color.white.opacity(0.05)))
                .overlay(Capsule().stroke(Color.white.opacity(0.08), lineWidth: 1))
                .padding(.horizontal, 20)

                ScreenTitle(title: "Workouts", subtitle: "Programs tuned to your level")
                    .padding(.horizontal, 20)

                // Create custom workout button
                Button {
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    showCustomCreator = true
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 20))
                            .foregroundStyle(Theme.accent)
                        Text("Create Custom Workout")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(.white)
                        Spacer()
                        Image(systemName: "chevron.right").foregroundStyle(Theme.textTertiary)
                    }
                    .padding(16)
                    .glassCard(cornerRadius: 16)
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 20)

                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass").foregroundStyle(Theme.textTertiary)
                    TextField("Search workouts", text: $searchQuery)
                        .foregroundStyle(.white).tint(Theme.accent)
                    if !searchQuery.isEmpty {
                        Button {
                            withAnimation(.easeOut(duration: 0.2)) { searchQuery = "" }
                        } label: {
                            Image(systemName: "xmark.circle.fill").foregroundStyle(Theme.textTertiary)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(14)
                .glassCard(cornerRadius: 14)
                .padding(.horizontal, 20)

                if searchQuery.isEmpty { categoryRow }

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
                    if filtered.isEmpty && !searchQuery.isEmpty {
                        Text("No workouts match \"\(searchQuery)\"")
                            .font(.system(size: 15)).foregroundStyle(Theme.textSecondary)
                            .frame(maxWidth: .infinity).padding(.vertical, 40)
                    }
                }
                .padding(.horizontal, 20)
                Color.clear.frame(height: 90)
            }
            .padding(.top, 8)
        }
        .scrollIndicators(.hidden)
    }

    // MARK: - Sports mode

    private var sportsModeContent: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                // Mode toggle
                HStack(spacing: 0) {
                    Button {
                        withAnimation(.spring(response: 0.35)) { isSportsMode = false }
                    } label: {
                        Text("Normal").font(.system(size: 14, weight: .bold))
                            .foregroundStyle(Theme.textSecondary)
                            .frame(maxWidth: .infinity).padding(.vertical, 10)
                    }
                    .buttonStyle(.plain)
                    Button {
                        withAnimation(.spring(response: 0.35)) { isSportsMode = true }
                    } label: {
                        Text("Sports").font(.system(size: 14, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity).padding(.vertical, 10)
                            .background(Capsule().fill(Theme.coral))
                    }
                    .buttonStyle(.plain)
                }
                .padding(3)
                .background(Capsule().fill(Color.white.opacity(0.05)))
                .overlay(Capsule().stroke(Color.white.opacity(0.08), lineWidth: 1))
                .padding(.horizontal, 20)

                if sportsPhase == .showPlan, let plan = sportsPlan ?? store.generatedPlan {
                    sportsPlanView(plan)
                } else {
                    sportsSelectionContent
                }
                Color.clear.frame(height: 90)
            }
            .padding(.top, 8)
        }
        .scrollIndicators(.hidden)
    }

    private var sportsSelectionContent: some View {
        VStack(alignment: .leading, spacing: 22) {
            let savedHasSport = store.sportsSelection.sport != nil
            if savedHasSport && sportsPhase == .selectSport {
                // Show Change Sport button + saved plan
                Button {
                    sportsPhase = .selectSport; sportSelection = SportSelection()
                } label: {
                    HStack {
                        Image(systemName: "arrow.left.circle.fill").foregroundStyle(Theme.accent)
                        Text("Change Sport").foregroundStyle(Theme.accent)
                    }
                    .font(.system(size: 14, weight: .semibold))
                }
                .buttonStyle(.plain)
            }

            switch sportsPhase {
            case .selectSport:
                ScreenTitle(title: "Sports Mode", subtitle: "Choose your sport")
                    .padding(.horizontal, 20)
                let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(SportType.allCases, id: \.self) { sport in
                        Button {
                            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                            sportSelection.sport = sport
                            if sport == .tennis {
                                sportSelection.level = .startingOut
                                showSportsGeneration = true
                            } else {
                                withAnimation { sportsPhase = .selectLevel }
                            }
                        } label: {
                            VStack(spacing: 10) {
                                Image(systemName: sport.icon)
                                    .font(.system(size: 32)).foregroundStyle(Color(hex: sport.color))
                                Text(sport.title)
                                    .font(.system(size: 14, weight: .bold)).foregroundStyle(.white)
                                    .multilineTextAlignment(.center)
                            }
                            .frame(maxWidth: .infinity).frame(height: 110)
                            .glassCard(cornerRadius: 18)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 20)

            case .selectLevel:
                ScreenTitle(title: "What is your level?", subtitle: sportSelection.sport?.title ?? "")
                    .padding(.horizontal, 20)
                VStack(spacing: 10) {
                    ForEach(SportLevel.allCases, id: \.self) { level in
                        Button {
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            sportSelection.level = level
                            withAnimation { sportsPhase = .selectPosition }
                        } label: {
                            HStack {
                                Text(level.title).font(.system(size: 16, weight: .semibold)).foregroundStyle(.white)
                                Spacer()
                                if sportSelection.level == level {
                                    Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.accent)
                                }
                            }
                            .padding(16).glassCard(selected: sportSelection.level == level, cornerRadius: 16)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 20)

            case .selectPosition:
                if let sport = sportSelection.sport, !sport.positions.isEmpty {
                    ScreenTitle(title: "Your Position", subtitle: sport.title)
                        .padding(.horizontal, 20)
                    VStack(spacing: 10) {
                        ForEach(sport.positions, id: \.self) { pos in
                            Button {
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                sportSelection.position = pos
                                showSportsGeneration = true
                            } label: {
                                HStack {
                                    Text(pos).font(.system(size: 16, weight: .semibold)).foregroundStyle(.white)
                                    Spacer()
                                    Image(systemName: "chevron.right").foregroundStyle(Theme.textTertiary)
                                }
                                .padding(16).glassCard(cornerRadius: 16)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 20)
                }

            case .showPlan:
                EmptyView()
            }
        }
    }

    private func sportsPlanView(_ plan: GeneratedPlan) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            if let sport = plan.sportName {
                ScreenTitle(title: sport, subtitle: plan.position ?? plan.sportFocus ?? "")
                    .padding(.horizontal, 20)
            }

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "sparkles").foregroundStyle(Theme.accent)
                    Text("SPORTS PLAN").font(.system(size: 11, weight: .bold)).tracking(1.5).foregroundStyle(Theme.accent)
                }
                Text(plan.planName).font(.system(size: 22, weight: .bold)).foregroundStyle(.white)
                Text(plan.coachMessage).font(.system(size: 13)).foregroundStyle(Theme.textSecondary)
                    .lineLimit(3)
                if let focus = plan.sportFocus {
                    Text(focus).font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Theme.accent).padding(.top, 2)
                }
            }
            .padding(18)
            .glassCard(cornerRadius: 22)
            .padding(.horizontal, 20)

            ForEach(plan.weeklyStructure) { week in
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("Week \(week.weekNumber)").font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                        Spacer()
                        Text(week.theme).font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Theme.accent)
                            .padding(.horizontal, 10).padding(.vertical, 4)
                            .background(Capsule().fill(Theme.accent.opacity(0.15)))
                    }
                    ForEach(week.days) { day in
                        Button {
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            if let pid = day.programID, let prog = ExerciseLibrary.program(id: pid) {
                                onStart(prog)
                            }
                        } label: {
                            HStack(spacing: 12) {
                                Circle()
                                    .fill(day.programID != nil ? Theme.accent.opacity(0.15) : Color.white.opacity(0.04))
                                    .frame(width: 36, height: 36)
                                    .overlay(
                                        Image(systemName: day.programID != nil ? "figure.strengthtraining.traditional" : "moon.zzz.fill")
                                            .font(.system(size: 14)).foregroundStyle(day.programID != nil ? Theme.accent : Theme.textTertiary)
                                    )
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Day \(day.dayNumber) · \(day.focus)")
                                        .font(.system(size: 14, weight: .semibold)).foregroundStyle(.white)
                                    Text(day.notes).font(.system(size: 11)).foregroundStyle(Theme.textTertiary)
                                }
                                Spacer()
                                if day.programID != nil {
                                    Image(systemName: "play.circle.fill").font(.system(size: 22)).foregroundStyle(Theme.accent)
                                }
                            }
                            .padding(12).glassCard(cornerRadius: 14)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 20)
            }
        }
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

// MARK: - Sports plan generation overlay

struct SportsPlanGenView: View {
    let onboarding: OnboardingData
    let sport: SportType
    let level: SportLevel
    let position: String?
    var onComplete: (GeneratedPlan) -> Void

    @State private var phase = 0
    @State private var progress: Double = 0
    @State private var errorMessage: String?
    @State private var glow = false

    private let messages = ["Analyzing sport demands", "Evaluating position needs", "Building sport-specific drills", "Calibrating intensity", "Finalizing your sports plan"]

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            VStack(spacing: 24) {
                Spacer().frame(height: 40)
                ZStack {
                    Circle().fill(Color(hex: sport.color).opacity(glow ? 0.3 : 0.1))
                        .frame(width: 140, height: 140).blur(radius: 25)
                        .scaleEffect(glow ? 1.15 : 0.9)
                        .animation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true), value: glow)
                    Image(systemName: sport.icon).font(.system(size: 52)).foregroundStyle(Color(hex: sport.color))
                }
                .onAppear { glow = true }

                Text("FITNEO AI").font(.system(size: 24, weight: .bold)).tracking(3).foregroundStyle(.white)
                Text("Sports Mode").font(.system(size: 15)).foregroundStyle(Theme.textSecondary)

                VStack(alignment: .leading, spacing: 14) {
                    ForEach(Array(messages.enumerated()), id: \.offset) { idx, msg in
                        HStack(spacing: 12) {
                            if idx < phase {
                                Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.accent)
                            } else if idx == phase {
                                Circle().fill(Theme.accent).frame(width: 10, height: 10)
                                    .scaleEffect(1.2).animation(.easeInOut(duration: 0.7).repeatForever(autoreverses: true), value: phase)
                            } else {
                                Circle().stroke(Theme.textTertiary, lineWidth: 1.5).frame(width: 18, height: 18)
                            }
                            Text(msg).font(.system(size: 15)).foregroundStyle(idx < phase ? .white : idx == phase ? Theme.accent : Theme.textTertiary)
                            Spacer()
                        }
                    }
                }
                .padding(22).glassCard(cornerRadius: 22)

                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(Color.white.opacity(0.08))
                        Capsule().fill(Theme.coral)
                            .frame(width: max(8, geo.size.width * progress))
                    }
                }
                .frame(height: 8)

                if let error = errorMessage {
                    VStack(spacing: 10) {
                        Text(error).font(.system(size: 14)).foregroundStyle(Theme.danger)
                        Button("Retry") {
                            errorMessage = nil; phase = 0; progress = 0; generatePlan()
                        }
                        .foregroundStyle(Theme.accent)
                    }
                }
                Spacer()
            }
            .padding(.horizontal, 28)
        }
        .onAppear { generatePlan() }
    }

    private func generatePlan() {
        Task {
            do {
                for i in 0..<messages.count {
                    try await Task.sleep(for: .seconds(1.2))
                    withAnimation { phase = i + 1 }
                    withAnimation(.easeInOut(duration: 0.8)) { progress = Double(i + 1) / Double(messages.count) * 0.85 }
                }
                let plan = try await PlanGenerationService.generateSportsPlan(onboarding: onboarding, sport: sport, level: level, position: position)
                withAnimation(.easeInOut(duration: 0.8)) { progress = 1.0 }
                try await Task.sleep(for: .seconds(0.6))
                await MainActor.run { onComplete(plan) }
            } catch {
                let localPlan = PlanGenerationService.generateLocalSportsPlan(onboarding: onboarding, sport: sport, level: level, position: position)
                errorMessage = "AI unavailable — using locally optimized sports plan."
                withAnimation { progress = 1.0 }
                try? await Task.sleep(for: .seconds(1.2))
                await MainActor.run { onComplete(localPlan) }
            }
        }
    }
}

// MARK: - Workout detail sheet

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
                            Text("\(ex.sets) x \(ex.reps)").font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.textSecondary)
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

// MARK: - Workout card

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
