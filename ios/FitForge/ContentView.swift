import SwiftUI

struct ContentView: View {
    @State private var authViewModel = AuthViewModel()
    @State private var onboardingViewModel = OnboardingViewModel()
    @State private var showOnboarding = false
    @State private var selectedTab = 0
    @State private var isRestoringSession = true

    var body: some View {
        Group {
            if isRestoringSession {
                SplashView()
                    .transition(.opacity)
            } else if !authViewModel.isAuthenticated {
                LoginView(viewModel: authViewModel) {
                    Task { await checkOnboardingStatus() }
                }
                .transition(.opacity.combined(with: .move(edge: .bottom)))
            } else if showOnboarding {
                OnboardingView(viewModel: onboardingViewModel) {
                    withAnimation(.easeInOut(duration: 0.6)) {
                        showOnboarding = false
                    }
                }
                .transition(.opacity)
            } else {
                MainTabView(
                    selectedTab: $selectedTab,
                    onSignOut: {
                        Task {
                            await authViewModel.signOut()
                            onboardingViewModel = OnboardingViewModel()
                            showOnboarding = false
                            selectedTab = 0
                        }
                    }
                )
                .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.5), value: isRestoringSession)
        .animation(.easeInOut(duration: 0.5), value: authViewModel.isAuthenticated)
        .animation(.easeInOut(duration: 0.5), value: showOnboarding)
        .task {
            await authViewModel.restoreSession()
            if authViewModel.isAuthenticated {
                await checkOnboardingStatus()
            }
            isRestoringSession = false
        }
    }

    private func checkOnboardingStatus() async {
        guard let userId = SupabaseService.shared.userId else { return }
        do {
            let profile = try await SupabaseService.shared.fetchProfile(userId: userId)
            if !profile.onboardingCompleted {
                onboardingViewModel = OnboardingViewModel()
                showOnboarding = true
            }
        } catch {
            // If we can't fetch, default to showing onboarding for new users
            onboardingViewModel = OnboardingViewModel()
            showOnboarding = true
        }
    }
}

// MARK: - Splash

struct SplashView: View {
    @State private var glow = false

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            VStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(Theme.accent.opacity(glow ? 0.5 : 0.2))
                        .frame(width: 160, height: 160)
                        .blur(radius: 40)
                    Image(systemName: "bolt.heart.fill")
                        .font(.system(size: 64, weight: .bold))
                        .foregroundStyle(Theme.accent)
                        .shadow(color: Theme.accent.opacity(0.6), radius: 16)
                }
                Text("FITNEO")
                    .font(.system(size: 36, weight: .black, design: .rounded))
                    .tracking(6)
                    .foregroundStyle(.white)
            }
        }
        .preferredColorScheme(.dark)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.4).repeatForever(autoreverses: true)) {
                glow = true
            }
        }
    }
}

// MARK: - Tabs

struct MainTabView: View {
    @Binding var selectedTab: Int
    var onSignOut: () -> Void

    init(selectedTab: Binding<Int>, onSignOut: @escaping () -> Void) {
        self._selectedTab = selectedTab
        self.onSignOut = onSignOut

        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(Theme.background)
        appearance.shadowColor = UIColor.white.withAlphaComponent(0.06)
        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            PlaceholderTab(title: "Home", icon: "house.fill", subtitle: "Your daily AI workout will live here.")
                .tabItem { Label("Home", systemImage: "house.fill") }
                .tag(0)

            PlaceholderTab(title: "Workouts", icon: "dumbbell.fill", subtitle: "Workout library coming soon.")
                .tabItem { Label("Workouts", systemImage: "dumbbell.fill") }
                .tag(1)

            PlaceholderTab(title: "Nutrition", icon: "leaf.fill", subtitle: "Personalized nutrition plans coming soon.")
                .tabItem { Label("Nutrition", systemImage: "leaf.fill") }
                .tag(2)

            PlaceholderTab(title: "Progress", icon: "chart.bar.fill", subtitle: "Track your streak, stats and growth.")
                .tabItem { Label("Progress", systemImage: "chart.bar.fill") }
                .tag(3)

            ProfileTab(onSignOut: onSignOut)
                .tabItem { Label("Profile", systemImage: "person.fill") }
                .tag(4)
        }
        .tint(Theme.accent)
        .preferredColorScheme(.dark)
    }
}

private struct PlaceholderTab: View {
    let title: String
    let icon: String
    let subtitle: String

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()

            VStack(spacing: 18) {
                Spacer()
                ZStack {
                    Circle()
                        .fill(Theme.accent.opacity(0.18))
                        .frame(width: 120, height: 120)
                        .blur(radius: 28)
                    Image(systemName: icon)
                        .font(.system(size: 44, weight: .semibold))
                        .foregroundStyle(Theme.accent)
                        .frame(width: 96, height: 96)
                        .glassCard(cornerRadius: 28)
                }

                Text(title)
                    .font(.system(size: 32, weight: .bold))
                    .foregroundStyle(.white)
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(Theme.textSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)

                Text("Coming soon")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .tracking(1.5)
                    .foregroundStyle(Theme.accent)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Capsule().fill(Theme.accent.opacity(0.15)))
                Spacer()
            }
        }
    }
}

private struct ProfileTab: View {
    var onSignOut: () -> Void
    @State private var email: String = SupabaseService.shared.currentUserEmail ?? ""

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            VStack(spacing: 22) {
                Spacer().frame(height: 20)
                ZStack {
                    Circle()
                        .fill(Theme.accent.opacity(0.2))
                        .frame(width: 120, height: 120)
                        .blur(radius: 24)
                    Image(systemName: "person.fill")
                        .font(.system(size: 44, weight: .semibold))
                        .foregroundStyle(Theme.accent)
                        .frame(width: 96, height: 96)
                        .glassCard(cornerRadius: 28)
                }
                VStack(spacing: 4) {
                    Text("Profile")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(.white)
                    if !email.isEmpty {
                        Text(email)
                            .font(.subheadline)
                            .foregroundStyle(Theme.textSecondary)
                    }
                }

                VStack(spacing: 10) {
                    InfoRow(icon: "sparkles", title: "Trial Plan", subtitle: "Premium features unlocked")
                    InfoRow(icon: "bell.fill", title: "Notifications", subtitle: "Coming soon")
                    InfoRow(icon: "gearshape.fill", title: "Preferences", subtitle: "Coming soon")
                }
                .padding(.horizontal, 24)

                Spacer()

                Button {
                    onSignOut()
                } label: {
                    Text("Sign Out")
                        .font(.headline)
                        .foregroundStyle(Theme.danger)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .glassCard(cornerRadius: 16)
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 24)
                .padding(.bottom, 24)
            }
        }
    }
}

private struct InfoRow: View {
    let icon: String
    let title: String
    let subtitle: String
    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(Theme.accent)
                .frame(width: 40, height: 40)
                .background(Circle().fill(Theme.accent.opacity(0.15)))
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.weight(.semibold)).foregroundStyle(.white)
                Text(subtitle).font(.caption).foregroundStyle(Theme.textSecondary)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.footnote)
                .foregroundStyle(Theme.textTertiary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .glassCard(cornerRadius: 14)
    }
}
