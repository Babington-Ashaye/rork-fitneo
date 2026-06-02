import SwiftUI

struct ContentView: View {
    @State private var store = FitneoStore()

    var body: some View {
        Group {
            if store.onboardingCompleted {
                RootShell()
            } else {
                FitneoOnboardingView { /* state flips via store.onboardingCompleted */ }
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
    @State private var showJarvis = false

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

            tabContent
                .ignoresSafeArea(.keyboard)

            FloatingNav(selected: $selectedTab, items: navItems)
                .padding(.bottom, 8)
        }
        .fullScreenCover(item: $activeProgram) { program in
            ActiveSessionView(program: program) { activeProgram = nil }
                .environment(store)
        }
        .sheet(isPresented: $showJarvis) {
            JarvisChatView(onStartWorkout: { startAutopilot() })
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
                          onOpenJarvis: { showJarvis = true })
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
        let program = JarvisAutopilot.selectWorkout(store: store)
        activeProgram = program
    }
}
