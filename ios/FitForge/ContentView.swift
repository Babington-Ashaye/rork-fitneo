import SwiftUI

struct ContentView: View {
    @State private var authViewModel = AuthViewModel()
    @State private var homeViewModel = HomeViewModel()
    @State private var workoutsViewModel = WorkoutsViewModel()
    @State private var progressViewModel = ProgressViewModel()
    @State private var profileViewModel = ProfileViewModel()
    @State private var onboardingViewModel = OnboardingViewModel()
    @State private var showOnboarding = false
    @State private var selectedTab = 0
    @State private var isRestoringSession = true

    var body: some View {
        Group {
            if isRestoringSession {
                SplashView()
            } else if !authViewModel.isAuthenticated {
                LoginView(viewModel: authViewModel) {
                    checkOnboardingStatus()
                }
            } else if showOnboarding {
                OnboardingView(viewModel: onboardingViewModel) {
                    showOnboarding = false
                    Task {
                        await refreshAllData()
                    }
                }
            } else {
                MainTabView(
                    homeViewModel: homeViewModel,
                    workoutsViewModel: workoutsViewModel,
                    progressViewModel: progressViewModel,
                    profileViewModel: profileViewModel,
                    authViewModel: authViewModel,
                    selectedTab: $selectedTab
                )
                .task {
                    await refreshAllData()
                }
            }
        }
        .task {
            await authViewModel.restoreSession()
            isRestoringSession = false
            if authViewModel.isAuthenticated {
                checkOnboardingStatus()
            }
        }
    }

    private func checkOnboardingStatus() {
        Task {
            guard let userId = SupabaseService.shared.userId else { return }
            do {
                let profile = try await SupabaseService.shared.fetchProfile(userId: userId)
                if !profile.onboardingCompleted {
                    showOnboarding = true
                }
            } catch {
                showOnboarding = true
            }
        }
    }

    private func refreshAllData() async {
        await homeViewModel.loadTodaysWorkout()
        await workoutsViewModel.loadWorkouts()
        await progressViewModel.loadHistory()
        await profileViewModel.loadProfile()
    }
}

struct SplashView: View {
    var body: some View {
        ZStack {
            Color(.systemBackground)
                .ignoresSafeArea()

            VStack(spacing: 16) {
                Image(systemName: "flame.fill")
                    .font(.system(size: 80))
                    .foregroundStyle(.linearGradient(colors: [.orange, .red], startPoint: .topLeading, endPoint: .bottomTrailing))

                Text("FitForge")
                    .font(.system(size: 40, weight: .bold, design: .rounded))
                    .foregroundStyle(.primary)

                ProgressView()
                    .tint(.orange)
                    .padding(.top, 20)
            }
        }
    }
}

struct MainTabView: View {
    @Bindable var homeViewModel: HomeViewModel
    @Bindable var workoutsViewModel: WorkoutsViewModel
    @Bindable var progressViewModel: ProgressViewModel
    @Bindable var profileViewModel: ProfileViewModel
    @Bindable var authViewModel: AuthViewModel
    @Binding var selectedTab: Int

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                HomeView(viewModel: homeViewModel)
            }
            .tabItem {
                Label("Home", systemImage: "house.fill")
            }
            .tag(0)

            NavigationStack {
                WorkoutsView(viewModel: workoutsViewModel)
            }
            .tabItem {
                Label("Workouts", systemImage: "dumbbell.fill")
            }
            .tag(1)

            NavigationStack {
                ProgressScreen(viewModel: progressViewModel)
            }
            .tabItem {
                Label("Progress", systemImage: "chart.bar.fill")
            }
            .tag(2)

            NavigationStack {
                ProfileView(viewModel: profileViewModel, onSignOut: {
                    Task {
                        await authViewModel.signOut()
                    }
                })
            }
            .tabItem {
                Label("Profile", systemImage: "person.fill")
            }
            .tag(3)
        }
        .tint(.orange)
    }
}
