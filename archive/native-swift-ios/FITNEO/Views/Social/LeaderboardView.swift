import SwiftUI

private struct LeaderUser: Identifiable {
    let id = UUID()
    let name: String
    let colorHex: String
    let xp: Int
    let streak: Int
    let weekWorkouts: Int
    var isYou = false
}

struct LeaderboardView: View {
    @Environment(FitneoStore.self) private var store
    @State private var tab = 0
    @State private var toast: String?
    @State private var showShareSheet = false
    @State private var shareImage: UIImage?
    @State private var realUsers: [[String: Any]] = []
    @State private var isLoading = true

    private let tabs = ["XP", "Streak", "This Week"]

    private var users: [LeaderUser] {
        var list = realUsers.map { entry in
            LeaderUser(
                name: entry["display_name"] as? String ?? "User",
                colorHex: entry["avatar_color"] as? String ?? "#0A84FF",
                xp: entry["total_xp"] as? Int ?? 0,
                streak: entry["current_streak"] as? Int ?? 0,
                weekWorkouts: entry["workouts_this_week"] as? Int ?? 0,
                isYou: (entry["user_id"] as? String) == SupabaseService.shared.userId?.uuidString
            )
        }

        // If simulated users still dominate (less than 20 real users), mix in simulated
        if list.count < 20 {
            let simCount = min(10, 20 - list.count)
            let simulated = Self.simulated.prefix(simCount)
            let realIds = Set(list.map { $0.name })
            for sim in simulated where !realIds.contains(sim.name) {
                list.append(sim)
            }
        }

        switch tab {
        case 1: return list.sorted { $0.streak > $1.streak }
        case 2: return list.sorted { $0.weekWorkouts > $1.weekWorkouts }
        default: return list.sorted { $0.xp > $1.xp }
        }
    }

    private var usersWithRank: [(rank: Int, user: LeaderUser)] {
        let sorted = users
        var result: [(rank: Int, user: LeaderUser)] = []
        var currentRank = 1
        for (i, u) in sorted.enumerated() {
            if i > 0 {
                let prev = sorted[i - 1]
                let prevVal = tabValue(prev)
                let curVal = tabValue(u)
                if prevVal != curVal { currentRank = i + 1 }
            }
            result.append((rank: currentRank, user: u))
        }
        return result
    }

    private func tabValue(_ u: LeaderUser) -> Int {
        switch tab {
        case 1: return u.streak
        case 2: return u.weekWorkouts
        default: return u.xp
        }
    }

    private var userRank: Int? {
        usersWithRank.first(where: { $0.user.isYou })?.rank
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            Theme.pageGradient.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 16) {
                    // Weekly competition card
                    weeklyCompCard

                    // User rank context card
                    if let rank = userRank {
                        rankContextCard(rank: rank)
                    }

                    Text("Leaderboard").font(.system(size: 26, weight: .bold)).foregroundStyle(.white).padding(.top, 4)
                    Picker("", selection: $tab) {
                        ForEach(Array(tabs.enumerated()), id: \.offset) { i, t in Text(t).tag(i) }
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: tab) { _, _ in Task { await loadLeaderboard() } }

                    if isLoading {
                        ProgressView().tint(Theme.accent).padding(.vertical, 40)
                    } else {
                        LazyVStack(spacing: 10) {
                            ForEach(usersWithRank, id: \.user.id) { entry in
                                row(rank: entry.rank, user: entry.user)
                            }
                        }
                    }

                    friendsFeed
                    shareCard
                    Color.clear.frame(height: 40)
                }
                .padding(20)
            }
            .scrollIndicators(.hidden)
            .refreshable { await loadLeaderboard() }

            if let toast {
                Text(toast)
                    .font(.system(size: 14, weight: .semibold)).foregroundStyle(.white)
                    .padding(.horizontal, 20).padding(.vertical, 12)
                    .background(Capsule().fill(Theme.accent))
                    .padding(.bottom, 30)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .presentationDragIndicator(.visible)
        .task { await loadLeaderboard() }
        .onChange(of: store.xp) { _, _ in checkTopThree() }
        .onAppear { checkTopThree() }
    }

    // MARK: - Leaderboard loading

    private func loadLeaderboard() async {
        isLoading = true
        let tabKey = tab == 0 ? "xp" : tab == 1 ? "streak" : "weekly"
        let data = await SupabaseService.shared.fetchLeaderboard(by: tabKey)
        await MainActor.run {
            realUsers = data
            isLoading = false
        }
    }

    // MARK: - Weekly competition

    private var weeklyCompCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "trophy.fill").foregroundStyle(Color(red: 1, green: 0.78, blue: 0.2))
                Text("THIS WEEK COMPETITION").font(.system(size: 11, weight: .bold)).tracking(1.5).foregroundStyle(Theme.textTertiary)
                Spacer()
                Text("Resets Monday").font(.system(size: 10)).foregroundStyle(Theme.textTertiary)
            }
            if users.isEmpty {
                Text("No activity yet this week")
                    .font(.system(size: 13)).foregroundStyle(Theme.textTertiary)
                    .frame(maxWidth: .infinity).padding(.vertical, 12)
            } else {
                HStack(spacing: 8) {
                    let top5 = Array(users.sorted(by: { $0.weekWorkouts > $1.weekWorkouts }).prefix(5).enumerated())
                    ForEach(top5, id: \.element.id) { rank, u in
                        VStack(spacing: 4) {
                            Circle()
                                .fill(rank == 0 ? Color(red: 1, green: 0.78, blue: 0.2) : rank == 1 ? Color.gray : Color(red: 0.8, green: 0.5, blue: 0.3))
                                .frame(width: 36, height: 36)
                                .overlay(Text("#\(rank + 1)").font(.system(size: 12, weight: .bold)).foregroundStyle(.white))
                            Text(String(u.name.prefix(6))).font(.system(size: 10, weight: .semibold)).foregroundStyle(.white)
                            Text("\(u.weekWorkouts)").font(.system(size: 9)).foregroundStyle(Theme.textSecondary)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
            }
        }
        .padding(14)
        .glassCard(cornerRadius: 18)
    }

    // MARK: - Rank context

    private func rankContextCard(rank: Int) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "medal.fill")
                .font(.system(size: 24))
                .foregroundStyle(rank <= 3 ? Color(red: 1, green: 0.78, blue: 0.2) : Theme.accent)
            VStack(alignment: .leading, spacing: 2) {
                Text("You are Rank #\(rank)").font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                Text("out of \(max(users.count, 1)) users").font(.system(size: 12)).foregroundStyle(Theme.textTertiary)
            }
            Spacer()
        }
        .padding(14)
        .glassCard(cornerRadius: 16)
    }

    // MARK: - Share

    private var shareCard: some View {
        Button {
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            generateShareImage()
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "square.and.arrow.up.fill")
                    .font(.system(size: 18)).foregroundStyle(Theme.accent)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Share Progress").font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                    Text("Share your stats with friends").font(.system(size: 12)).foregroundStyle(Theme.textTertiary)
                }
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(Theme.textTertiary)
            }
            .padding(14)
            .glassCard(cornerRadius: 16)
        }
        .buttonStyle(.plain)
        .sheet(isPresented: $showShareSheet) {
            if let img = shareImage {
                ShareSheet(image: img)
            }
        }
    }

    private func generateShareImage() {
        let renderer = ImageRenderer(content: ShareCardView(
            name: store.user.name,
            level: store.level,
            rankTitle: store.rank.title,
            xp: store.xp,
            streak: store.currentStreak,
            workouts: store.workouts.count
        ))
        renderer.scale = 3.0
        if let uiImage = renderer.uiImage {
            shareImage = uiImage
            showShareSheet = true
        }
    }

    private func checkTopThree() {
        // Trigger weekly champion badge check
        if let rank = userRank, rank <= 3 {
            store.checkBadges()
        }
    }

    // MARK: - Row

    private func row(rank: Int, user: LeaderUser) -> some View {
        HStack(spacing: 14) {
            ZStack {
                if rank <= 3 {
                    Image(systemName: "medal.fill")
                        .font(.system(size: 22))
                        .foregroundStyle(rank == 1 ? Color(red: 1, green: 0.8, blue: 0.2) : rank == 2 ? Color.gray : Color(red: 0.8, green: 0.5, blue: 0.3))
                } else {
                    Text("\(rank)").font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.textTertiary)
                }
            }
            .frame(width: 30)

            Circle().fill(Color(hex: user.colorHex)).frame(width: 38, height: 38)
                .overlay(Text(String(user.name.prefix(1))).font(.system(size: 15, weight: .bold)).foregroundStyle(.white))

            VStack(alignment: .leading, spacing: 1) {
                Text(user.name + (user.isYou ? " (You)" : ""))
                    .font(.system(size: 15, weight: user.isYou ? .bold : .semibold))
                    .foregroundStyle(user.isYou ? Theme.accent : .white)
                Text("Level \(FitnessRank.rank(forXP: user.xp).rawValue)")
                    .font(.system(size: 10)).foregroundStyle(Theme.textTertiary)
            }

            Spacer()
            // Nudge button for friends
            if !user.isYou {
                Button {
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    withAnimation { toast = "Nudge sent to \(user.name)!" }
                    Task { try? await Task.sleep(for: .seconds(2)); withAnimation { toast = nil } }
                } label: {
                    Image(systemName: "hand.point.right.fill")
                        .font(.system(size: 11)).foregroundStyle(Theme.accent)
                        .padding(.horizontal, 10).padding(.vertical, 6)
                        .background(Capsule().fill(Theme.accent.opacity(0.12)))
                }
                .buttonStyle(.plain)
            }
            Text(value(for: user)).font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.textSecondary)
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(user.isYou ? Theme.accent.opacity(0.12) : Color.white.opacity(0.04))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(user.isYou ? Theme.accent.opacity(0.5) : Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    private func value(for u: LeaderUser) -> String {
        switch tab {
        case 1: return "\(u.streak)\u{1F525}"
        case 2: return "\(u.weekWorkouts)"
        default: return "\(u.xp) XP"
        }
    }

    // MARK: - Friends feed

    private var friendsFeed: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("FRIENDS ACTIVITY").font(.system(size: 11, weight: .bold)).tracking(1.5).foregroundStyle(Theme.textTertiary)
            ForEach(Self.feed, id: \.self) { item in
                HStack(spacing: 12) {
                    Circle().fill(Theme.accent.opacity(0.2)).frame(width: 34, height: 34)
                        .overlay(Image(systemName: "figure.run").font(.system(size: 14)).foregroundStyle(Theme.accent))
                    Text(item).font(.system(size: 13)).foregroundStyle(Theme.textSecondary)
                    Spacer()
                }
            }
            Button {
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                withAnimation { toast = "Challenge sent!" }
                Task { try? await Task.sleep(for: .seconds(2)); withAnimation { toast = nil } }
            } label: {
                Label("Challenge a Friend", systemImage: "flag.fill")
                    .font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.accent)
                    .frame(maxWidth: .infinity).padding(.vertical, 12)
                    .background(RoundedRectangle(cornerRadius: 14).fill(Theme.accent.opacity(0.12)))
            }
            .buttonStyle(.plain)
        }
        .padding(16)
        .glassCard(cornerRadius: 20)
    }

    fileprivate static let simulated: [LeaderUser] = [
        LeaderUser(name: "Alex", colorHex: "#0A84FF", xp: 18450, streak: 23, weekWorkouts: 6),
        LeaderUser(name: "Maya", colorHex: "#FF6B35", xp: 14200, streak: 14, weekWorkouts: 5),
        LeaderUser(name: "Jordan", colorHex: "#7c3aed", xp: 9800, streak: 9, weekWorkouts: 4),
        LeaderUser(name: "Sam", colorHex: "#22d3ee", xp: 7600, streak: 6, weekWorkouts: 5),
        LeaderUser(name: "Riley", colorHex: "#f59e0b", xp: 5400, streak: 4, weekWorkouts: 3),
        LeaderUser(name: "Chris", colorHex: "#ec4899", xp: 4100, streak: 3, weekWorkouts: 4),
        LeaderUser(name: "Taylor", colorHex: "#34d399", xp: 3200, streak: 2, weekWorkouts: 2),
        LeaderUser(name: "Jamie", colorHex: "#0A84FF", xp: 2100, streak: 5, weekWorkouts: 3),
        LeaderUser(name: "Morgan", colorHex: "#FF6B35", xp: 1500, streak: 1, weekWorkouts: 2),
        LeaderUser(name: "Casey", colorHex: "#7c3aed", xp: 900, streak: 0, weekWorkouts: 1)
    ]

    fileprivate static let feed: [String] = [
        "Alex just completed Push Day — 245 XP earned",
        "Maya hit a 14-day streak 🔥",
        "Jordan unlocked the Iron Will badge",
        "Sam logged all meals today",
        "Riley crushed HIIT Burn — 280 kcal"
    ]
}

struct ShareCardView: View {
    let name: String
    let level: Int
    let rankTitle: String
    let xp: Int
    let streak: Int
    let workouts: Int

    var body: some View {
        VStack(spacing: 18) {
            Text("FITNEO").font(.system(size: 20, weight: .black)).tracking(4).foregroundStyle(.white)
            Text(name).font(.system(size: 28, weight: .bold)).foregroundStyle(.white)
            HStack(spacing: 16) {
                statView("LVL \(level)", rankTitle)
                statView("\(xp)", "XP")
                statView("\(streak)\u{1F525}", "Streak")
                statView("\(workouts)", "Workouts")
            }
            Text("Powered by FITNEO AI").font(.system(size: 11)).foregroundStyle(Theme.textTertiary)
        }
        .padding(28)
        .frame(width: 350, height: 350)
        .background(
            LinearGradient(colors: [Color(red: 0x06/255, green: 0x09/255, blue: 0x14/255), Color(red: 0x0F/255, green: 0x16/255, blue: 0x2E/255)], startPoint: .topLeading, endPoint: .bottomTrailing)
        )
    }

    private func statView(_ value: String, _ label: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.accent)
            Text(label).font(.system(size: 10)).foregroundStyle(Theme.textSecondary)
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let image: UIImage
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: [image], applicationActivities: nil)
    }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
