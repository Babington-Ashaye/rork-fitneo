import SwiftUI

struct FitneoAIChatView: View {
    @Environment(FitneoStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    var onStartWorkout: (WorkoutProgram) -> Void

    @State private var input = ""
    @State private var typing = false
    @State private var aiWorkoutCard: WorkoutProgram?
    @State private var streamingText = ""
    @State private var currentSessionId: String = UUID().uuidString
    @State private var showSidebar = false
    @State private var sessions: [(id: UUID, title: String, createdAt: Date)] = []
    @State private var sessionTask: Task<Void, Never>?

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
                            if typing {
                                if !streamingText.isEmpty {
                                    HStack {
                                        Text(streamingText)
                                            .font(.system(size: 15))
                                            .foregroundStyle(Theme.textPrimary)
                                            .padding(.horizontal, 14).padding(.vertical, 11)
                                            .background(
                                                RoundedRectangle(cornerRadius: 18, style: .continuous)
                                                    .fill(Color.white.opacity(0.06))
                                            )
                                            .overlay(
                                                RoundedRectangle(cornerRadius: 18, style: .continuous)
                                                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
                                            )
                                            .fixedSize(horizontal: false, vertical: true)
                                        Spacer(minLength: 40)
                                    }
                                    .id("streaming")
                                } else {
                                    TypingIndicator().id("typing")
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 16)
                    }
                    .scrollIndicators(.hidden)
                    .onChange(of: store.messages.count) { _, _ in
                        withAnimation { proxy.scrollTo(store.messages.last?.id, anchor: .bottom) }
                    }
                    .onChange(of: streamingText) { _, _ in
                        withAnimation { proxy.scrollTo("streaming", anchor: .bottom) }
                    }
                    .onChange(of: typing) { _, t in
                        if t, streamingText.isEmpty {
                            withAnimation { proxy.scrollTo("typing", anchor: .bottom) }
                        }
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
        .sheet(isPresented: $showSidebar) {
            sessionsSidebar
        }
        .task {
            await loadChatHistory()
            await loadSessions()
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack(spacing: 12) {
            // Sidebar toggle
            Button {
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                showSidebar = true
            } label: {
                Image(systemName: "sidebar.left")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(.white)
                    .frame(width: 36, height: 36)
                    .background(Circle().fill(Color.white.opacity(0.08)))
            }
            .buttonStyle(.plain)

            ZStack {
                Circle().fill(Theme.accent.opacity(0.25)).frame(width: 44, height: 44)
                Circle().fill(Theme.accent).frame(width: 12, height: 12)
                    .shadow(color: Theme.accent, radius: 8)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text("FITNEO AI").font(.system(size: 18, weight: .bold)).foregroundStyle(.white)
                Text("AI Coach · Gemini").font(.system(size: 12)).foregroundStyle(Theme.accent)
            }
            Spacer()
            Button {
                newSession()
            } label: {
                Image(systemName: "square.and.pencil")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(.white)
                    .frame(width: 36, height: 36)
                    .background(Circle().fill(Color.white.opacity(0.08)))
            }
            .buttonStyle(.plain)
            Button { dismiss() } label: {
                Image(systemName: "xmark").font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                    .frame(width: 36, height: 36).background(Circle().fill(Color.white.opacity(0.08)))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(.ultraThinMaterial.opacity(0.5))
    }

    // MARK: - Sessions sidebar

    private var sessionsSidebar: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            VStack(spacing: 0) {
                HStack {
                    Text("Chat History").font(.system(size: 20, weight: .bold)).foregroundStyle(.white)
                    Spacer()
                    Button { showSidebar = false } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 22)).foregroundStyle(Theme.textTertiary)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 20).padding(.top, 16).padding(.bottom, 12)

                Button {
                    showSidebar = false
                    newSession()
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 18))
                            .foregroundStyle(Theme.accent)
                        Text("New Chat")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(.white)
                        Spacer()
                    }
                    .padding(14)
                    .glassCard(cornerRadius: 14)
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 20)
                .padding(.bottom, 12)

                if sessions.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "bubble.left.and.bubble.right")
                            .font(.system(size: 40))
                            .foregroundStyle(Theme.textTertiary)
                        Text("No past conversations")
                            .font(.system(size: 15))
                            .foregroundStyle(Theme.textSecondary)
                    }
                    .frame(maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVStack(spacing: 8) {
                            ForEach(sessions, id: \.id) { session in
                                Button {
                                    showSidebar = false
                                    switchToSession(session.id, title: session.title)
                                } label: {
                                    HStack(spacing: 12) {
                                        Image(systemName: "bubble.left.fill")
                                            .font(.system(size: 14))
                                            .foregroundStyle(session.id.uuidString == currentSessionId ? Theme.accent : Theme.textTertiary)
                                            .frame(width: 34, height: 34)
                                            .background(
                                                Circle()
                                                    .fill(session.id.uuidString == currentSessionId
                                                          ? Theme.accent.opacity(0.15)
                                                          : Color.white.opacity(0.04))
                                            )
                                        VStack(alignment: .leading, spacing: 3) {
                                            Text(session.title)
                                                .font(.system(size: 14, weight: .semibold))
                                                .foregroundStyle(.white)
                                                .lineLimit(1)
                                            Text(session.createdAt.formatted(.relative(presentation: .named)))
                                                .font(.system(size: 11))
                                                .foregroundStyle(Theme.textTertiary)
                                        }
                                        Spacer()
                                    }
                                    .padding(12)
                                    .glassCard(
                                        selected: session.id.uuidString == currentSessionId,
                                        cornerRadius: 14
                                    )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal, 20)
                    }
                    .scrollIndicators(.hidden)
                }
            }
        }
        .presentationDragIndicator(.visible)
        .presentationDetents([.medium, .large])
    }

    // MARK: - Suggestions

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

    // MARK: - Input bar

    private var inputBar: some View {
        HStack(spacing: 10) {
            TextField("Message FITNEO AI…", text: $input)
                .foregroundStyle(.white).tint(Theme.accent)
                .padding(.horizontal, 16).padding(.vertical, 12)
                .background(Capsule().fill(Color.white.opacity(0.06)))
                .overlay(Capsule().stroke(Color.white.opacity(0.1), lineWidth: 1))
            Button {
                let text = input
                input = ""
                send(text)
            } label: {
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

    // MARK: - Session management

    private func newSession() {
        sessionTask?.cancel()
        store.messages.removeAll()
        streamingText = ""
        typing = false
        aiWorkoutCard = nil
        currentSessionId = UUID().uuidString

        // Create session in Supabase
        if let uid = SupabaseService.shared.userId {
            Task {
                let sid = await SupabaseService.shared.createChatSession(
                    userId: uid,
                    title: "New Chat"
                )
                currentSessionId = sid.uuidString
                await loadSessions()
            }
        }
    }

    private func switchToSession(_ sessionId: UUID, title: String) {
        sessionTask?.cancel()
        store.messages.removeAll()
        streamingText = ""
        typing = false
        aiWorkoutCard = nil
        currentSessionId = sessionId.uuidString

        Task {
            guard let uid = SupabaseService.shared.userId else { return }
            let history = await SupabaseService.shared.fetchChatHistory(
                userId: uid,
                sessionId: sessionId.uuidString,
                limit: 100
            )
            await MainActor.run {
                store.messages = history
            }
        }
    }

    private func loadSessions() async {
        guard let uid = SupabaseService.shared.userId else { return }
        sessions = await SupabaseService.shared.fetchChatSessions(userId: uid)
    }

    // MARK: - Chat history

    private func loadChatHistory() async {
        guard let uid = SupabaseService.shared.userId else { return }
        // If there's already an active session, load its history
        if currentSessionId != UUID().uuidString {
            let history = await SupabaseService.shared.fetchChatHistory(
                userId: uid,
                sessionId: currentSessionId,
                limit: 100
            )
            await MainActor.run {
                if !history.isEmpty && store.messages.isEmpty {
                    store.messages = history
                }
            }
        }
    }

    // MARK: - Send message

    private func send(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        UIImpactFeedbackGenerator(style: .light).impactOccurred()

        let userMsg = FitneoAIMessage(id: UUID(), role: .user, text: trimmed, date: Date())
        store.messages.append(userMsg)
        input = ""
        aiWorkoutCard = nil
        streamingText = ""

        // Save user message to Supabase
        if let uid = SupabaseService.shared.userId {
            let sid = currentSessionId
            Task { await SupabaseService.shared.saveChatMessage(role: "user", content: trimmed, userId: uid, sessionId: sid) }
        }

        // Detect if this is a workout generation request
        let lower = trimmed.lowercased()
        let isWorkoutRequest = lower.contains("generate") || lower.contains("create") || lower.contains("make me") || lower.contains("build") || lower.contains("workout") || lower.contains("leg day") || lower.contains("chest") || lower.contains("back") || lower.contains("arm") || lower.contains("hiit") || lower.contains("cardio") || lower.contains("strength")

        if isWorkoutRequest {
            handleWorkoutGeneration(trimmed)
        } else {
            handleStreamingChat(trimmed)
        }
    }

    // MARK: - Streaming chat (Gemini real-time)

    private func handleStreamingChat(_ message: String) {
        typing = true
        var fullResponse = ""

        sessionTask = Task {
            let systemPrompt = buildChatSystemPrompt()
            let stream = GeminiService.shared.generateTextStream(
                prompt: message,
                systemPrompt: systemPrompt
            )

            do {
                for try await token in stream {
                    guard !Task.isCancelled else { break }
                    await MainActor.run {
                        fullResponse += token
                        streamingText = fullResponse
                    }
                }
            } catch {
                await MainActor.run {
                    if fullResponse.isEmpty {
                        fullResponse = "I'm having trouble connecting right now. Please try again."
                    }
                }
            }

            await MainActor.run {
                typing = false
                streamingText = ""

                let coachMsg = FitneoAIMessage(id: UUID(), role: .coach, text: fullResponse, date: Date())
                store.messages.append(coachMsg)

                if let uid = SupabaseService.shared.userId {
                    let sid = currentSessionId
                    Task {
                        await SupabaseService.shared.saveChatMessage(role: "coach", content: fullResponse, userId: uid, sessionId: sid)
                    }
                }
                store.checkBadges()
            }
        }
    }

    // MARK: - Workout generation

    private func handleWorkoutGeneration(_ request: String) {
        typing = true
        let allPrograms = store.allPrograms
        let lower = request.lowercased()
        let matches = allPrograms.filter { p in
            p.name.lowercased().contains(lower) ||
            p.category.title.lowercased().contains(lower) ||
            p.description.lowercased().contains(lower) ||
            p.muscleGroups.contains(where: { lower.contains($0.title.lowercased()) })
        }

        sessionTask = Task {
            // Try AI generation via Gemini
            if let aiResult = await PlanGenerationService.generateWorkoutFromChat(
                request: request,
                user: store.user,
                store: store,
                programIDs: ExerciseLibrary.programs.map { $0.id }
            ) {
                await MainActor.run {
                    typing = false
                    let reply = "I created \"\(aiResult.name)\" just for you — \(aiResult.durationMinutes) minutes, \(aiResult.difficulty.title) level, \(aiResult.exerciseIDs.count) exercises. Tap below to start. This workout is saved in your library."
                    let coachMsg = FitneoAIMessage(id: UUID(), role: .coach, text: reply, date: Date())
                    store.messages.append(coachMsg)
                    aiWorkoutCard = aiResult
                    if let uid = SupabaseService.shared.userId {
                        let sid = currentSessionId
                        Task {
                            await SupabaseService.shared.saveChatMessage(role: "coach", content: reply, userId: uid, sessionId: sid)
                        }
                    }
                }
                return
            }

            // Fallback: local matching/generation
            try? await Task.sleep(for: .seconds(1.2))
            await MainActor.run {
                typing = false

                if let bestMatch = matches.first {
                    let reply = "Found it! \(bestMatch.name) matches your request — \(bestMatch.durationMinutes) minutes, \(bestMatch.difficulty.title) level. Tap below to start."
                    store.messages.append(FitneoAIMessage(id: UUID(), role: .coach, text: reply, date: Date()))
                    aiWorkoutCard = bestMatch
                    if let uid = SupabaseService.shared.userId {
                        let sid = currentSessionId
                        Task {
                            await SupabaseService.shared.saveChatMessage(role: "coach", content: reply, userId: uid, sessionId: sid)
                        }
                    }
                } else {
                    let generated = generateCustomWorkout(for: request)
                    store.addCustomProgram(generated)
                    let reply = "I created \"\(generated.name)\" just for you — \(generated.durationMinutes) minutes, \(generated.difficulty.title) level, \(generated.exerciseIDs.count) exercises. Tap below to start. This workout is now saved in your library."
                    store.messages.append(FitneoAIMessage(id: UUID(), role: .coach, text: reply, date: Date()))
                    aiWorkoutCard = generated
                    if let uid = SupabaseService.shared.userId {
                        let sid = currentSessionId
                        Task {
                            await SupabaseService.shared.saveChatMessage(role: "coach", content: reply, userId: uid, sessionId: sid)
                        }
                    }
                }
            }
        }
    }

    // MARK: - System prompt builder

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
        You are FITNEO AI, a world-class personal fitness coach. You know this user personally:
        - Name: \(user.name)
        - Fitness goal: \(user.goals.first ?? "Stay active")
        - Fitness level: \(user.fitnessLevel.title)
        - Current streak: \(memory.currentStreak) days

        Additional context:
        - Equipment: \(user.equipment.joined(separator: ", "))
        - Workouts this week: \(memory.totalWorkoutsThisWeek) of \(user.weeklyWorkoutGoal)
        - Total workouts: \(memory.totalWorkoutsAllTime)
        - Consistency: \(memory.consistencyScore)%
        - Injuries: \(injuries.isEmpty ? "None reported" : injuries.joined(separator: ", "))
        - Last 5 workouts: \(lastWorkouts)

        Respond in a conversational, motivating, and personalized way. Keep responses under 150 words.
        If the user asks for a workout give them a specific plan. If they describe pain or injury advise them to rest that muscle group.
        """
    }

    // MARK: - Local workout generator (fallback)

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

// MARK: - Shared components (unchanged)

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
