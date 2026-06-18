import SwiftUI

struct FitneoAIChatView: View {
    @Environment(FitneoStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    var onStartWorkout: (WorkoutProgram) -> Void

    @State private var input = ""
    @State private var typing = false
    @State private var aiWorkoutCard: WorkoutProgram?

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            VStack(spacing: 0) {
                header
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 14) {
                            ForEach(store.messages) { msg in
                                MessageBubble(message: msg).id(msg.id)
                            }
                            if let prog = aiWorkoutCard {
                                AIWorkoutCard(program: prog) {
                                    dismiss()
                                    onStartWorkout(prog)
                                }
                                .id("workout_card")
                                .padding(.horizontal, 8)
                            }
                            if typing { TypingIndicator().id("typing") }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 16)
                    }
                    .scrollIndicators(.hidden)
                    .onChange(of: store.messages.count) { _, _ in
                        withAnimation { proxy.scrollTo(store.messages.last?.id, anchor: .bottom) }
                    }
                    .onChange(of: typing) { _, t in
                        if t { withAnimation { proxy.scrollTo("typing", anchor: .bottom) } }
                    }
                    .onChange(of: aiWorkoutCard?.id) { _, _ in
                        withAnimation { proxy.scrollTo("workout_card", anchor: .bottom) }
                    }
                }
                suggestions
                inputBar
            }
        }
        .presentationDragIndicator(.visible)
        .task {
            await loadChatHistory()
        }
    }

    private var header: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle().fill(Theme.accent.opacity(0.25)).frame(width: 44, height: 44)
                Circle().fill(Theme.accent).frame(width: 12, height: 12)
                    .shadow(color: Theme.accent, radius: 8)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text("FITNEO AI").font(.system(size: 18, weight: .bold)).foregroundStyle(.white)
                Text("AI Coach \u{00b7} Gemini").font(.system(size: 12)).foregroundStyle(Theme.accent)
            }
            Spacer()
            Button { dismiss() } label: {
                Image(systemName: "xmark").font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                    .frame(width: 36, height: 36).background(Circle().fill(Color.white.opacity(0.08)))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(.ultraThinMaterial.opacity(0.5))
    }

    private var suggestions: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 8) {
                ForEach(["Train me", "How am I doing?", "Generate HIIT workout", "I need a leg day", "Make it harder"], id: \.self) { s in
                    Button { send(s) } label: {
                        Text(s).font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.accent)
                            .padding(.horizontal, 14).padding(.vertical, 8)
                            .background(Capsule().fill(Theme.accent.opacity(0.12)))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .scrollIndicators(.hidden)
        .contentMargins(.horizontal, 16)
        .padding(.bottom, 8)
    }

    private var inputBar: some View {
        HStack(spacing: 10) {
            TextField("Message FITNEO AI\u{2026}", text: $input)
                .foregroundStyle(.white).tint(Theme.accent)
                .padding(.horizontal, 16).padding(.vertical, 12)
                .background(Capsule().fill(Color.white.opacity(0.06)))
                .overlay(Capsule().stroke(Color.white.opacity(0.1), lineWidth: 1))
            Button { send(input) } label: {
                Image(systemName: "arrow.up")
                    .font(.system(size: 18, weight: .bold)).foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                    .background(Circle().fill(input.isEmpty ? Theme.accent.opacity(0.4) : Theme.accent))
            }
            .buttonStyle(.plain).disabled(input.isEmpty)
        }
        .padding(.horizontal, 16).padding(.vertical, 10)
        .background(.ultraThinMaterial.opacity(0.5))
    }

    // MARK: - Actions

    private func loadChatHistory() async {
        guard let uid = SupabaseService.shared.userId else { return }
        let history = await SupabaseService.shared.fetchChatHistory(userId: uid, limit: 50)
        guard !history.isEmpty else { return }
        // Merge history into store messages, avoiding duplicates
        var existing = Set(store.messages.map { $0.text })
        for msg in history where !existing.contains(msg.text) {
            store.messages.append(msg)
            existing.insert(msg.text)
        }
    }

    private func send(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        let userMsg = FitneoAIMessage(id: UUID(), role: .user, text: trimmed, date: Date())
        store.messages.append(userMsg)
        input = ""
        aiWorkoutCard = nil

        // Save user message to Supabase
        if let uid = SupabaseService.shared.userId {
            Task { await SupabaseService.shared.saveChatMessage(role: "user", content: trimmed, userId: uid) }
        }

        // Detect if this is a workout generation request
        let lower = trimmed.lowercased()
        let isWorkoutRequest = lower.contains("generate") || lower.contains("create") || lower.contains("make me") || lower.contains("build") || lower.contains("workout") || lower.contains("leg day") || lower.contains("chest") || lower.contains("back") || lower.contains("arm") || lower.contains("hiit") || lower.contains("cardio") || lower.contains("strength")

        let intent = FitneoAIBrain.detectIntent(trimmed)

        typing = true

        if isWorkoutRequest, case .chat = intent {
            handleWorkoutGeneration(trimmed)
        } else if case .chat = intent {
            // Use Gemini for general chat
            handleGeminiChat(trimmed)
        } else {
            // Local intent handling
            let reply = FitneoAIBrain.respond(to: trimmed, intent: intent, user: store.user, memory: store.fitneoAIMemory, personality: store.coachPersonality)
            Task {
                try? await Task.sleep(for: .seconds(1.0))
                typing = false
                let coachMsg = FitneoAIMessage(id: UUID(), role: .coach, text: reply, date: Date())
                store.messages.append(coachMsg)
                if let uid = SupabaseService.shared.userId {
                    await SupabaseService.shared.saveChatMessage(role: "coach", content: reply, userId: uid)
                }
                store.checkBadges()

                if case .startWorkout = intent {
                    try? await Task.sleep(for: .seconds(0.6))
                    dismiss()
                    onStartWorkout(FitneoAIAutopilot.selectWorkout(store: store))
                }
                if case .logFood = intent { store.requestedTab = 2 }
            }
        }
    }

    private func handleWorkoutGeneration(_ request: String) {
        let allPrograms = store.allPrograms
        let lower = request.lowercased()
        let matches = allPrograms.filter { p in
            p.name.lowercased().contains(lower) ||
            p.category.title.lowercased().contains(lower) ||
            p.description.lowercased().contains(lower) ||
            p.muscleGroups.contains(where: { lower.contains($0.title.lowercased()) })
        }

        // Try AI generation via Gemini
        Task {
            if let aiResult = await PlanGenerationService.generateWorkoutFromChat(
                request: request,
                user: store.user,
                store: store,
                programIDs: ExerciseLibrary.programs.map { $0.id }
            ) {
                try? await Task.sleep(for: .seconds(0.6))
                typing = false
                let reply = "I created \"\(aiResult.name)\" just for you — \(aiResult.durationMinutes) minutes, \(aiResult.difficulty.title) level, \(aiResult.exerciseIDs.count) exercises. Tap below to start. This workout is saved in your library."
                let coachMsg = FitneoAIMessage(id: UUID(), role: .coach, text: reply, date: Date())
                store.messages.append(coachMsg)
                aiWorkoutCard = aiResult
                if let uid = SupabaseService.shared.userId {
                    await SupabaseService.shared.saveChatMessage(role: "coach", content: reply, userId: uid)
                }
                return
            }

            // Fallback to local matching/generation
            try? await Task.sleep(for: .seconds(1.2))
            typing = false

            if let bestMatch = matches.first {
                let reply = "Found it! \(bestMatch.name) matches your request — \(bestMatch.durationMinutes) minutes, \(bestMatch.difficulty.title) level. Tap below to start."
                store.messages.append(FitneoAIMessage(id: UUID(), role: .coach, text: reply, date: Date()))
                aiWorkoutCard = bestMatch
                if let uid = SupabaseService.shared.userId {
                    await SupabaseService.shared.saveChatMessage(role: "coach", content: reply, userId: uid)
                }
            } else {
                let generated = generateCustomWorkout(for: request)
                store.addCustomProgram(generated)
                let reply = "I created \"\(generated.name)\" just for you — \(generated.durationMinutes) minutes, \(generated.difficulty.title) level, \(generated.exerciseIDs.count) exercises. Tap below to start. This workout is now saved in your library."
                store.messages.append(FitneoAIMessage(id: UUID(), role: .coach, text: reply, date: Date()))
                aiWorkoutCard = generated
                if let uid = SupabaseService.shared.userId {
                    await SupabaseService.shared.saveChatMessage(role: "coach", content: reply, userId: uid)
                }
            }
        }
    }

    private func handleGeminiChat(_ message: String) {
        Task {
            let systemPrompt = buildChatSystemPrompt()
            let geminiReply = await GeminiService.shared.generateText(
                prompt: message,
                systemPrompt: systemPrompt
            )

            try? await Task.sleep(for: .seconds(0.5))
            typing = false

            let reply: String
            if geminiReply.isEmpty {
                // Fallback to local brain
                reply = FitneoAIBrain.respond(
                    to: message, intent: .chat, user: store.user,
                    memory: store.fitneoAIMemory, personality: store.coachPersonality
                )
            } else {
                reply = geminiReply
            }

            let coachMsg = FitneoAIMessage(id: UUID(), role: .coach, text: reply, date: Date())
            store.messages.append(coachMsg)
            if let uid = SupabaseService.shared.userId {
                await SupabaseService.shared.saveChatMessage(role: "coach", content: reply, userId: uid)
            }
            store.checkBadges()
        }
    }

    private func buildChatSystemPrompt() -> String {
        let user = store.user
        let memory = store.fitneoAIMemory
        let injuries = store.demoMode ? [] :
            (UserDefaults.standard.stringArray(forKey: "fitneo_onboarding_injuries") ?? [])

        let lastWorkouts: String = {
            let recent = store.workouts.suffix(5).map { $0.name }
            return recent.isEmpty ? "None yet" : recent.joined(separator: ", ")
        }()

        return """
        You are FITNEO AI, an elite AI fitness coach. You have full memory of the user's fitness journey.
        You speak confidently, motivationally, and precisely — like a world-class personal trainer who also has the analytical mind of a sports scientist.
        Never be generic. Always reference specific user data. Keep responses under 120 words unless doing a full plan.
        Always end with one actionable next step.

        User profile:
        - Name: \(user.name)
        - Fitness level: \(user.fitnessLevel.title)
        - Primary goal: \(user.goals.first ?? "Stay active")
        - Equipment: \(user.equipment.joined(separator: ", "))
        - Current streak: \(memory.currentStreak) days
        - Workouts this week: \(memory.totalWorkoutsThisWeek) of \(user.weeklyWorkoutGoal)
        - Total workouts: \(memory.totalWorkoutsAllTime)
        - Consistency: \(memory.consistencyScore)%
        - Injuries: \(injuries.isEmpty ? "None reported" : injuries.joined(separator: ", "))
        - Last 5 workouts: \(lastWorkouts)
        """
    }

    private func generateCustomWorkout(for request: String) -> WorkoutProgram {
        let lower = request.lowercased()
        let allExercises = ExerciseLibrary.exercises

        let isHIIT = lower.contains("hiit") || lower.contains("cardio") || lower.contains("burn")
        let isLegs = lower.contains("leg") || lower.contains("squat") || lower.contains("lower")
        let isUpper = lower.contains("chest") || lower.contains("upper") || lower.contains("arm") || lower.contains("push")
        let isCore = lower.contains("core") || lower.contains("abs") || lower.contains("ab")
        let isStrength = lower.contains("strength") || lower.contains("power") || lower.contains("muscle")

        let category: WorkoutCategory = isHIIT ? .hiit : isCore ? .core : .strength
        let difficulty: Difficulty = store.user.fitnessLevel

        var picked: [String] = []
        if isLegs {
            picked = ["squats", "lunges", "glute_bridges", "calf_raises", "bulgarian_split_squat"]
        } else if isUpper {
            picked = ["push_ups", "dumbbell_press", "bent_over_rows", "bicep_curls", "tricep_dips"]
        } else if isCore {
            picked = ["plank", "crunches", "russian_twists", "leg_raises", "mountain_climbers"]
        } else if isHIIT {
            picked = ["burpees", "mountain_climbers", "jumping_jacks", "high_knees", "jump_rope"]
        } else {
            picked = ["push_ups", "squats", "bent_over_rows", "plank", "glute_bridges"]
        }

        let name: String
        if isLegs { name = "AI Leg Session" }
        else if isUpper { name = "AI Upper Body" }
        else if isCore { name = "AI Core Burn" }
        else if isHIIT { name = "AI HIIT Blast" }
        else { name = "AI Full Body" }

        return WorkoutProgram(
            id: "ai_gen_\(UUID().uuidString.prefix(8))",
            name: name,
            category: category,
            difficulty: difficulty,
            durationMinutes: isHIIT ? 25 : 35,
            description: "Generated by FITNEO AI based on your request: \"\(request)\"",
            muscleGroups: category == .hiit ? [.cardio, .fullBody] : category == .core ? [.core] : [.fullBody],
            exerciseIDs: picked,
            isPremium: false
        )
    }
}

// MARK: - Shared components

struct AIWorkoutCard: View {
    let program: WorkoutProgram
    let onStart: () -> Void

    var body: some View {
        Button {
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            onStart()
        } label: {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Label("AI GENERATED", systemImage: "sparkles")
                        .font(.system(size: 10, weight: .bold)).tracking(1.5)
                        .foregroundStyle(Theme.accent)
                    Spacer()
                    Text(program.difficulty.title)
                        .font(.system(size: 10, weight: .bold))
                        .padding(.horizontal, 8).padding(.vertical, 3)
                        .background(Capsule().fill(program.category.tint.opacity(0.2)))
                        .foregroundStyle(program.category.tint)
                }
                Text(program.name).font(.system(size: 17, weight: .bold)).foregroundStyle(.white)
                HStack(spacing: 14) {
                    HStack(spacing: 4) {
                        Image(systemName: "clock").font(.system(size: 11)).foregroundStyle(Theme.textTertiary)
                        Text("\(program.durationMinutes)m").font(.system(size: 12)).foregroundStyle(Theme.textSecondary)
                    }
                    HStack(spacing: 4) {
                        Image(systemName: "square.stack.3d.up.fill").font(.system(size: 11)).foregroundStyle(Theme.textTertiary)
                        Text("\(program.exerciseIDs.count) ex").font(.system(size: 12)).foregroundStyle(Theme.textSecondary)
                    }
                    Spacer()
                    Image(systemName: "play.circle.fill").font(.system(size: 28)).foregroundStyle(Theme.accent)
                }
            }
            .padding(16)
            .glassCard(selected: true, cornerRadius: 20)
        }
        .buttonStyle(.plain)
    }
}

struct MessageBubble: View {
    let message: FitneoAIMessage
    var body: some View {
        HStack {
            if message.role == .user { Spacer(minLength: 40) }
            Text(message.text)
                .font(.system(size: 15))
                .foregroundStyle(message.role == .user ? .white : Theme.textPrimary)
                .padding(.horizontal, 14).padding(.vertical, 11)
                .background(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(message.role == .user ? Theme.accent : Color.white.opacity(0.06))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(message.role == .user ? Color.clear : Color.white.opacity(0.08), lineWidth: 1)
                )
                .fixedSize(horizontal: false, vertical: true)
            if message.role == .coach { Spacer(minLength: 40) }
        }
    }
}

struct TypingIndicator: View {
    @State private var phase = 0.0
    var body: some View {
        HStack(spacing: 5) {
            ForEach(0..<3) { i in
                Circle().fill(Theme.accent)
                    .frame(width: 7, height: 7)
                    .scaleEffect(phase == Double(i) ? 1.3 : 0.7)
                    .opacity(phase == Double(i) ? 1 : 0.4)
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(RoundedRectangle(cornerRadius: 18).fill(Color.white.opacity(0.06)))
        .frame(maxWidth: .infinity, alignment: .leading)
        .onAppear {
            withAnimation(.easeInOut(duration: 0.4).repeatForever()) { phase = 2 }
        }
    }
}
