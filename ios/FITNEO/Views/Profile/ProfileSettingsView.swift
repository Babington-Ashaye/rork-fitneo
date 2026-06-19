import SwiftUI

struct ProfileSettingsView: View {
    @Environment(FitneoStore.self) private var store
    @State private var showEdit = false
    @State private var showBadges = false
    @State private var showLeaderboard = false
    @State private var showPaywall = false
    @State private var showResetConfirm = false
    @State private var showExport = false

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                // Demo mode banner
                if store.demoMode {
                    HStack(spacing: 8) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundStyle(.black)
                        Text("Demo Mode — Sample Data")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(.black)
                        Spacer()
                    }
                    .padding(.horizontal, 16).padding(.vertical, 10)
                    .background(RoundedRectangle(cornerRadius: 12).fill(Color(red: 1, green: 0.78, blue: 0.2)))
                    .padding(.horizontal, 20)
                }

                profileHeader
                subscriptionCard
                badgesPreview
                NavRow(icon: "trophy.fill", title: "Leaderboard", subtitle: "See where you rank") { showLeaderboard = true }
                NavRow(icon: "person.crop.circle", title: "Edit Profile", subtitle: "Name, stats, goals") { showEdit = true }
                settingsCard
                demoModeToggle
                accountCard
                Color.clear.frame(height: 90)
            }
            .padding(.top, 8)
        }
        .scrollIndicators(.hidden)
        .background(Theme.pageGradient.ignoresSafeArea())
        .sheet(isPresented: $showEdit) { EditProfileSheet() }
        .sheet(isPresented: $showBadges) { BadgesSheet() }
        .sheet(isPresented: $showLeaderboard) { LeaderboardView() }
        .sheet(isPresented: $showPaywall) { PaywallView() }
        .sheet(isPresented: $showExport) { ExportSheet(json: store.exportJSON()).presentationDetents([.medium, .large]) }
        .alert("Reset all data?", isPresented: $showResetConfirm) {
            Button("Cancel", role: .cancel) {}
            Button("Reset", role: .destructive) { store.resetAllData() }
        } message: {
            Text("This permanently deletes your profile, workouts, nutrition and progress.")
        }
    }

    private var profileHeader: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle().fill(Color(hex: store.user.avatarColorHex).opacity(0.25)).frame(width: 96, height: 96).blur(radius: 8)
                Circle().fill(Color(hex: store.user.avatarColorHex)).frame(width: 84, height: 84)
                Text(String(store.user.name.prefix(1)).uppercased())
                    .font(.system(size: 36, weight: .bold)).foregroundStyle(.white)
            }
            Text(store.user.name).font(.system(size: 24, weight: .bold)).foregroundStyle(.white)
            HStack(spacing: 10) {
                tag("LVL \(store.level)")
                tag(store.rank.title)
                tag("\(store.xp) XP")
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .padding(.horizontal, 18)
        .glassCard(cornerRadius: 24)
    }

    private func tag(_ text: String) -> some View {
        Text(text).font(.system(size: 12, weight: .bold))
            .padding(.horizontal, 12).padding(.vertical, 5)
            .background(Capsule().fill(Theme.accent.opacity(0.15)))
            .foregroundStyle(Theme.accent)
    }

    private var subscriptionCard: some View {
        let sub = store.subscription
        return Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            if !sub.isPremium { showPaywall = true }
        } label: {
            HStack(spacing: 14) {
                Image(systemName: sub.isPremium ? "crown.fill" : "lock.fill")
                    .font(.system(size: 20))
                    .foregroundStyle(sub.isPremium ? Color(red: 1, green: 0.78, blue: 0.2) : Theme.textTertiary)
                    .frame(width: 44, height: 44)
                    .background(Circle().fill((sub.isPremium ? Color(red: 1, green: 0.78, blue: 0.2) : Color.white).opacity(0.12)))
                VStack(alignment: .leading, spacing: 2) {
                    Text(planTitle).font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                    if let days = sub.daysRemaining, sub.status == .trial {
                        Text("\(days) days left in your free trial").font(.system(size: 12)).foregroundStyle(Theme.accent)
                    } else if sub.status == .active {
                        Text("Active").font(.system(size: 12)).foregroundStyle(Theme.accent)
                    } else {
                        Text("Tap to start free trial").font(.system(size: 12)).foregroundStyle(Theme.textTertiary)
                    }
                }
                Spacer()
                if !sub.isPremium { Image(systemName: "chevron.right").foregroundStyle(Theme.textTertiary) }
            }
            .padding(16)
            .glassCard(cornerRadius: 20)
        }
        .buttonStyle(.plain)
    }

    private var planTitle: String {
        let sub = store.subscription
        if sub.status == .trial { return "FITNEO Elite Trial" }
        if sub.status == .active { return "FITNEO Elite" }
        return "FITNEO Free"
    }

    private var badgesPreview: some View {
        Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            showBadges = true
        } label: {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("BADGES").font(.system(size: 11, weight: .bold)).tracking(1.5).foregroundStyle(Theme.textTertiary)
                    Spacer()
                    Text("\(store.earnedBadges.count) / \(BadgeCatalog.all.count)").font(.system(size: 12, weight: .bold)).foregroundStyle(Theme.accent)
                }
                HStack(spacing: 12) {
                    ForEach(BadgeCatalog.all.prefix(5)) { badge in
                        Image(systemName: badge.icon)
                            .font(.system(size: 18))
                            .foregroundStyle(store.hasBadge(badge.id) ? Theme.accent : Theme.textTertiary)
                            .frame(width: 44, height: 44)
                            .background(Circle().fill(store.hasBadge(badge.id) ? Theme.accent.opacity(0.15) : Color.white.opacity(0.04)))
                            .opacity(store.hasBadge(badge.id) ? 1 : 0.5)
                    }
                    Spacer()
                    Image(systemName: "chevron.right").foregroundStyle(Theme.textTertiary)
                }
            }
            .padding(16)
            .glassCard(cornerRadius: 20)
        }
        .buttonStyle(.plain)
    }

    private var settingsCard: some View {
        @Bindable var store = store
        return VStack(spacing: 4) {
            HStack {
                Text("NOTIFICATIONS").font(.system(size: 11, weight: .bold)).tracking(1.5).foregroundStyle(Theme.textTertiary)
                Spacer()
            }
            .padding(.bottom, 6)
            toggleRow("Workout reminders", "bell.fill", $store.settings.workoutReminders)
            toggleRow("Streak alerts", "flame.fill", $store.settings.streakAlerts)
            toggleRow("FITNEO AI daily check-in", "brain.head.profile", $store.settings.fitneoAICheckIn)
            toggleRow("Challenge notifications", "flag.fill", $store.settings.challengeNotifications)
            Divider().overlay(Color.white.opacity(0.08)).padding(.vertical, 6)
            toggleRow("Voice mode", "mic.fill", $store.settings.voiceMode)
            toggleRow("FITNEO AI auto-speak", "speaker.wave.2.fill", $store.settings.fitneoAIAutoSpeak)
        }
        .padding(16)
        .glassCard(cornerRadius: 20)
    }

    private var demoModeToggle: some View {
        @Bindable var store = store
        return VStack(spacing: 4) {
            HStack(spacing: 12) {
                Image(systemName: "gearshape.2.fill")
                    .font(.system(size: 15))
                    .foregroundStyle(Color(red: 1, green: 0.78, blue: 0.2))
                    .frame(width: 28)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Demo Mode").font(.system(size: 15)).foregroundStyle(.white)
                    Text("Pre-fills sample data for testing").font(.system(size: 11)).foregroundStyle(Theme.textTertiary)
                }
                Spacer()
                Toggle("", isOn: $store.demoMode)
                    .labelsHidden()
                    .tint(Color(red: 1, green: 0.78, blue: 0.2))
                    .onChange(of: store.demoMode) { _, val in
                        if val { store.loadDemoData() }
                    }
            }
        }
        .padding(16)
        .glassCard(cornerRadius: 20)
    }

    private func toggleRow(_ title: String, _ icon: String, _ binding: Binding<Bool>) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).font(.system(size: 15)).foregroundStyle(Theme.accent).frame(width: 28)
            Text(title).font(.system(size: 15)).foregroundStyle(.white)
            Spacer()
            Toggle("", isOn: binding).labelsHidden().tint(Theme.accent)
        }
        .padding(.vertical, 6)
    }

    private var accountCard: some View {
        VStack(spacing: 4) {
            NavRow(icon: "square.and.arrow.up", title: "Export Data", subtitle: "Download your data as JSON") { showExport = true }
            Button {
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                showResetConfirm = true
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "trash.fill").font(.system(size: 16)).foregroundStyle(Theme.danger).frame(width: 28)
                    Text("Reset All Data").font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.danger)
                    Spacer()
                }
                .padding(.vertical, 10).padding(.horizontal, 4)
            }
            .buttonStyle(.plain)
        }
        .padding(12)
        .glassCard(cornerRadius: 20)
    }
}

struct NavRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let action: () -> Void
    var body: some View {
        Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            action()
        } label: {
            HStack(spacing: 14) {
                Image(systemName: icon).font(.system(size: 17)).foregroundStyle(Theme.accent)
                    .frame(width: 40, height: 40).background(Circle().fill(Theme.accent.opacity(0.15)))
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.system(size: 15, weight: .semibold)).foregroundStyle(.white)
                    Text(subtitle).font(.system(size: 12)).foregroundStyle(Theme.textTertiary)
                }
                Spacer()
                Image(systemName: "chevron.right").font(.footnote).foregroundStyle(Theme.textTertiary)
            }
            .padding(14)
            .glassCard(cornerRadius: 18)
        }
        .buttonStyle(.plain)
    }
}

struct BadgesSheet: View {
    @Environment(FitneoStore.self) private var store
    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Badges").font(.system(size: 26, weight: .bold)).foregroundStyle(.white).padding(.top, 12)
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 18) {
                        ForEach(BadgeCatalog.all) { badge in
                            BadgeTile(badge: badge, earned: store.hasBadge(badge.id))
                        }
                    }
                }
                .padding(20)
            }
            .scrollIndicators(.hidden)
        }
        .presentationDragIndicator(.visible)
    }
}

struct ExportSheet: View {
    let json: String
    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            VStack(spacing: 14) {
                Text("Export Data").font(.system(size: 22, weight: .bold)).foregroundStyle(.white).padding(.top, 16)
                ShareLink(item: json) {
                    Label("Share JSON", systemImage: "square.and.arrow.up")
                        .font(.headline).foregroundStyle(.white)
                        .frame(maxWidth: .infinity).padding(.vertical, 14)
                        .background(RoundedRectangle(cornerRadius: 14).fill(Theme.accent))
                }
                .padding(.horizontal, 20)
                ScrollView {
                    Text(json).font(.system(size: 11, design: .monospaced)).foregroundStyle(Theme.textSecondary)
                        .frame(maxWidth: .infinity, alignment: .leading).padding(16)
                }
                .glassCard(cornerRadius: 16).padding(.horizontal, 20)
                Spacer()
            }
        }
        .presentationDragIndicator(.visible)
    }
}
