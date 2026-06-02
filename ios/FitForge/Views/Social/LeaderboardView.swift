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

    private let tabs = ["XP", "Streak", "This Week"]

    private var users: [LeaderUser] {
        var list = Self.simulated
        list.append(LeaderUser(name: store.user.name, colorHex: store.user.avatarColorHex,
                               xp: store.xp, streak: store.currentStreak, weekWorkouts: store.workoutsThisWeek, isYou: true))
        switch tab {
        case 1: return list.sorted { $0.streak > $1.streak }
        case 2: return list.sorted { $0.weekWorkouts > $1.weekWorkouts }
        default: return list.sorted { $0.xp > $1.xp }
        }
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            Theme.pageGradient.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 16) {
                    Text("Leaderboard").font(.system(size: 26, weight: .bold)).foregroundStyle(.white).padding(.top, 12)
                    Picker("", selection: $tab) {
                        ForEach(Array(tabs.enumerated()), id: \.offset) { i, t in Text(t).tag(i) }
                    }
                    .pickerStyle(.segmented)

                    LazyVStack(spacing: 10) {
                        ForEach(Array(users.enumerated()), id: \.element.id) { rank, u in
                            row(rank: rank + 1, user: u)
                        }
                    }

                    friendsFeed
                    Color.clear.frame(height: 40)
                }
                .padding(20)
            }
            .scrollIndicators(.hidden)

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
        .onChange(of: store.xp) { _, _ in checkTopThree() }
        .onAppear { checkTopThree() }
    }

    private func checkTopThree() {
        if let idx = users.firstIndex(where: { $0.isYou }), idx < 3 {
            store.checkBadges()
        }
    }

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

            Text(user.name + (user.isYou ? " (You)" : ""))
                .font(.system(size: 15, weight: user.isYou ? .bold : .semibold))
                .foregroundStyle(user.isYou ? Theme.accent : .white)
            Spacer()
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
        case 1: return "\(u.streak)🔥"
        case 2: return "\(u.weekWorkouts)"
        default: return "\(u.xp) XP"
        }
    }

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
