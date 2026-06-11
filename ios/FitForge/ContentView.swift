import SwiftUI

struct ContentView: View {
    @State private var store = FitneoStore()
    @State private var showPlanGeneration = false
    @State private var onboardingData = OnboardingData()

    var body: some View {
        Group {
            if showPlanGeneration {
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
    }
}

struct RootShell: View {
    @Environment(FitneoStore.self) private var store
    @State private var selectedTab = 0
    @State private var activeProgram: WorkoutProgram?
    @State private var showFitneoAI = false
    @State private var showTrialBanner = true

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

    private func startAutopilot() {
        let program = FitneoAIAutopilot.selectWorkout(store: store)
        activeProgram = program
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
