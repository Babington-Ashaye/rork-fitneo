import SwiftUI

struct PaywallView: View {
    @Environment(FitneoStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var activated = false

    private let features = [
        "All 11 workout programs",
        "Elite Physique Mode (8-week system)",
        "Unlimited Jarvis AI coaching",
        "Full nutrition database",
        "Advanced analytics & charts",
        "Social leaderboard & friends",
        "All badges & challenges",
        "Streak freeze protection"
    ]

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            if activated {
                successView
            } else {
                content
            }
        }
        .presentationDragIndicator(.visible)
    }

    private var content: some View {
        ScrollView {
            VStack(spacing: 22) {
                ZStack {
                    Circle().fill(Color(red: 1, green: 0.78, blue: 0.2).opacity(0.2)).frame(width: 110, height: 110).blur(radius: 16)
                    Image(systemName: "crown.fill").font(.system(size: 50)).foregroundStyle(Color(red: 1, green: 0.78, blue: 0.2))
                }
                .padding(.top, 20)
                VStack(spacing: 6) {
                    Text("FITNEO Premium").font(.system(size: 28, weight: .bold)).foregroundStyle(.white)
                    Text("Unlock your full AI fitness OS").font(.system(size: 15)).foregroundStyle(Theme.textSecondary)
                }
                VStack(alignment: .leading, spacing: 14) {
                    ForEach(features, id: \.self) { f in
                        HStack(spacing: 12) {
                            Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.accent)
                            Text(f).font(.system(size: 15, weight: .medium)).foregroundStyle(.white)
                            Spacer()
                        }
                    }
                }
                .padding(20)
                .glassCard(cornerRadius: 22)

                VStack(spacing: 4) {
                    Text("1 month free").font(.system(size: 22, weight: .bold)).foregroundStyle(Theme.accent)
                    Text("then $5/month · cancel anytime").font(.system(size: 13)).foregroundStyle(Theme.textTertiary)
                }

                PillButton(title: "Start Free Trial", icon: "sparkles") {
                    store.startTrial()
                    withAnimation(.spring) { activated = true }
                }
                Button("Maybe Later") { dismiss() }
                    .font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.textTertiary)
                Color.clear.frame(height: 20)
            }
            .padding(.horizontal, 20)
        }
        .scrollIndicators(.hidden)
    }

    private var successView: some View {
        VStack(spacing: 20) {
            Spacer()
            Image(systemName: "checkmark.seal.fill").font(.system(size: 90)).foregroundStyle(Theme.accent)
                .shadow(color: Theme.accent, radius: 20)
            Text("You're Premium!").font(.system(size: 28, weight: .bold)).foregroundStyle(.white)
            Text("All features unlocked. Welcome to the elite tier.").font(.system(size: 15)).foregroundStyle(Theme.textSecondary)
                .multilineTextAlignment(.center).padding(.horizontal, 40)
            Spacer()
            PillButton(title: "Let's Train", action: { dismiss() }).padding(.horizontal, 40)
            Spacer().frame(height: 30)
        }
        .onAppear { UINotificationFeedbackGenerator().notificationOccurred(.success) }
    }
}
