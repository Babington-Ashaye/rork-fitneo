import SwiftUI

struct ContentView: View {
    @State private var store = FitneoStore()
    @State private var showPlanGeneration = false
    @State private var onboardingData = OnboardingData()

    // Auth
    @State private var isCheckingSession = true
    @State private var needsAuth = true
    @State private var showSignUp = false
    @State private var showSignIn = false

    var body: some View {
        Group {
            if isCheckingSession {
                checkingView
            } else if needsAuth {
                welcomeAuthView
            } else if showPlanGeneration {
                PlanGenerationView(onboardingData: onboardingData) { plan in
                    store.generatedPlan = plan
                    store.onboardingCompleted = true
                    withAnimation(.easeInOut(duration: 0.5)) {
                        showPlanGeneration = false
                    }
                }
                .transition(.opacity)
            } else if store.onboardingCompleted {
                RootShell()
            } else {
                FitneoOnboardingView { data in
                    onboardingData = data
                    withAnimation(.easeInOut(duration: 0.5)) {
                        showPlanGeneration = true
                    }
                }
                .transition(.opacity)
            }
        }
        .environment(store)
        .preferredColorScheme(.dark)
        .animation(.easeInOut, value: store.onboardingCompleted)
        .fullScreenCover(isPresented: $showSignUp) {
            SignUpView(onAuthSuccess: handleAuthResult)
        }
        .fullScreenCover(isPresented: $showSignIn) {
            SignInView(onAuthSuccess: handleAuthResult)
        }
        .onReceive(NotificationCenter.default.publisher(for: .showSignIn)) { _ in
            showSignUp = false
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                showSignIn = true
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .showSignUp)) { _ in
            showSignIn = false
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                showSignUp = true
            }
        }
        .task {
            await checkSession()
        }
    }

    // MARK: - Session check

    private var checkingView: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            ProgressView()
                .tint(Theme.accent)
                .scaleEffect(1.2)
        }
    }

    private func checkSession() async {
        let hasSession = await SupabaseService.shared.hasValidSession()
        try? await Task.sleep(for: .seconds(0.6))
        await MainActor.run {
            needsAuth = !hasSession
            isCheckingSession = false
        }
    }

    // MARK: - Welcome / Auth

    private var welcomeAuthView: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            Theme.glowGradient
                .frame(width: 500, height: 500)
                .offset(y: -260)
                .ignoresSafeArea()
                .allowsHitTesting(false)

            VStack(spacing: 20) {
                Spacer()

                VStack(spacing: 14) {
                    ZStack {
                        Circle()
                            .fill(Theme.accent.opacity(0.25))
                            .frame(width: 160, height: 160)
                            .blur(radius: 30)
                        Image(systemName: "bolt.heart.fill")
                            .font(.system(size: 70))
                            .foregroundStyle(Theme.accent)
                            .shadow(color: Theme.accent, radius: 20)
                    }
                    Text("FITNEO")
                        .font(.system(size: 44, weight: .black, design: .rounded))
                        .tracking(6)
                        .foregroundStyle(.white)
                    Text("Your AI-Powered Fitness OS")
                        .font(.system(size: 17))
                        .foregroundStyle(Theme.textSecondary)
                }

                Spacer()

                VStack(spacing: 14) {
                    PillButton(title: "Get Started", icon: "arrow.right") {
                        showSignUp = true
                    }

                    Button {
                        showSignIn = true
                    } label: {
                        HStack(spacing: 4) {
                            Text("Already have an account?")
                                .font(.footnote)
                                .foregroundStyle(Theme.textTertiary)
                            Text("Sign In")
                                .font(.footnote.weight(.semibold))
                                .foregroundStyle(Theme.accent)
                        }
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 24)

                Spacer().frame(height: 30)
            }
            .frame(maxWidth: min(UIScreen.main.bounds.width - 40, 400))
        }
        .preferredColorScheme(.dark)
    }

    // MARK: - Auth result handler

    private func handleAuthResult(needsOnboarding: Bool) {
        showSignUp = false
        showSignIn = false
        withAnimation(.easeInOut(duration: 0.4)) {
            needsAuth = false
            if needsOnboarding {
                store.onboardingCompleted = false
            } else {
                store.onboardingCompleted = true
            }
        }
    }
}

struct RootShell: View {
    @Environment(FitneoStore.self) private var store
    @State private var selectedTab = 0
    @State private var activeProgram: WorkoutProgram?
    @State private var showFitneoAI = false
    @State private var showTrialBanner = true
    @State private var showMotivationToast = false
    @State private var toastMessage = ""

    private let navItems = [
        ("house.fill", "Home"),
        ("dumbbell.fill", "Workouts"),
        ("leaf.fill", "Nutrition"),
        ("chart.bar.fill", "Progress"),
        ("person.fill", "Profile")
    ]

    var body: some View {
        ZStack(alignment: .bottom) {
            Theme.background.ignoresSafeArea()

            VStack(spacing: 0) {
                // Trial banner
                if showTrialBanner, let days = store.subscription.daysRemaining, store.subscription.status == .trial {
                    trialBanner(days: days)
                }

                tabContent
                    .ignoresSafeArea(.keyboard)
            }

            FloatingNav(selected: $selectedTab, items: navItems)
                .padding(.bottom, 8)
        }
        .fullScreenCover(item: $activeProgram) { program in
            ActiveSessionView(program: program) { activeProgram = nil }
                .environment(store)
        }
        .sheet(isPresented: $showFitneoAI) {
            FitneoAIChatView(onStartWorkout: { activeProgram = $0 })
                .environment(store)
                .presentationDetents([.large])
        }
        .overlay {
            if showMotivationToast {
                MotivationToast(message: toastMessage) {
                    showMotivationToast = false
                }
                .zIndex(9)
            }
        }
        .overlay {
            if let badge = store.newlyUnlockedBadge {
                BadgeUnlockOverlay(badge: badge) { store.newlyUnlockedBadge = nil }
                    .zIndex(10)
            }
        }
        .overlay {
            if store.didLevelUp {
                LevelUpOverlay(level: store.level, rankTitle: store.rank.title) { store.didLevelUp = false }
                    .zIndex(11)
            }
        }
        .onChange(of: store.requestedTab) { _, newValue in
            if let t = newValue { selectedTab = t; store.requestedTab = nil }
        }
        .onChange(of: store.workouts.count) { _, _ in
            triggerMotivationToast()
        }
        .onChange(of: store.foodEntries.count) { _, _ in
            triggerMotivationToast()
        }
    }

    private func triggerMotivationToast() {
        guard !showMotivationToast else { return }
        Task {
            let msg = await GeminiService.shared.generateMotivation()
            guard !msg.isEmpty, msg.count < 150 else { return }
            await MainActor.run {
                toastMessage = msg
                showMotivationToast = true
            }
        }
    }

    @ViewBuilder private var tabContent: some View {
        switch selectedTab {
        case 0:
            DashboardView(selectedTab: $selectedTab,
                          onStartWorkout: { activeProgram = $0 },
                          onOpenFitneoAI: { showFitneoAI = true })
        case 1:
            WorkoutsBrowseView(onStart: { activeProgram = $0 })
        case 2:
            NutritionView()
        case 3:
            ProgressDashboardView()
        default:
            ProfileSettingsView()
        }
    }

    private func trialBanner(days: Int) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "crown.fill")
                .foregroundStyle(Color(red: 1, green: 0.78, blue: 0.2))
            Text("\(days) days left in your free trial")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.white)
            Spacer()
            Button("Upgrade") {
                selectedTab = 4
            }
            .font(.system(size: 12, weight: .bold))
            .foregroundStyle(Theme.accent)
            .padding(.horizontal, 12).padding(.vertical, 5)
            .background(Capsule().fill(Theme.accent.opacity(0.15)))
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 10)
        .background(days <= 3 ? Theme.danger.opacity(0.85) : days <= 7 ? Color(red: 1, green: 0.78, blue: 0.2).opacity(0.85) : Theme.accent.opacity(0.85))
        .animation(.easeInOut, value: days)
    }
}
