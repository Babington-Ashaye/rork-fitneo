import SwiftUI

struct PaywallView: View {
    @Environment(FitneoStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var activated = false
    @State private var isYearly = false
    @State private var selectedTier: SubscriptionTier = .elite

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
                // Crown icon
                ZStack {
                    Circle()
                        .fill(selectedTier == .elite ? Color(red: 1, green: 0.78, blue: 0.2).opacity(0.2) : Theme.accent.opacity(0.2))
                        .frame(width: 110, height: 110)
                        .blur(radius: 16)
                    Image(systemName: selectedTier == .elite ? "crown.fill" : "sparkles")
                        .font(.system(size: 50))
                        .foregroundStyle(selectedTier == .elite ? Color(red: 1, green: 0.78, blue: 0.2) : Theme.accent)
                }
                .padding(.top, 20)

                VStack(spacing: 6) {
                    Text(selectedTier == .elite ? "FITNEO Elite" : "FITNEO Pro")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(.white)
                    Text("1 month free trial included")
                        .font(.system(size: 15))
                        .foregroundStyle(Theme.textSecondary)
                }

                // Tier selector
                HStack(spacing: 10) {
                    tierButton(.pro, title: "Pro", price: isYearly ? "$3.33/mo" : "$4.99/mo")
                    tierButton(.elite, title: "Elite", price: isYearly ? "$6.67/mo" : "$9.99/mo")
                }

                // Yearly toggle
                HStack(spacing: 12) {
                    Text("Monthly")
                        .font(.system(size: 13, weight: isYearly ? .regular : .bold))
                        .foregroundStyle(isYearly ? Theme.textSecondary : .white)
                    Toggle("", isOn: $isYearly)
                        .labelsHidden()
                        .tint(Theme.accent)
                    Text("Yearly")
                        .font(.system(size: 13, weight: isYearly ? .bold : .regular))
                        .foregroundStyle(isYearly ? .white : Theme.textSecondary)
                    if isYearly {
                        Text("Save 33%")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(Theme.success)
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background(Capsule().fill(Theme.success.opacity(0.15)))
                    }
                }
                .padding(.horizontal, 20)

                // Total price
                Text(isYearly
                     ? (selectedTier == .elite ? "$79.99/year" : "$39.99/year")
                     : (selectedTier == .elite ? "$9.99/month" : "$4.99/month"))
                    .font(.system(size: 32, weight: .bold))
                    .foregroundStyle(.white)

                // Feature list
                let features = selectedTier == .elite ? eliteFeatures : proFeatures
                VStack(alignment: .leading, spacing: 14) {
                    ForEach(features, id: \.self) { f in
                        HStack(spacing: 12) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(selectedTier == .elite ? Color(red: 1, green: 0.78, blue: 0.2) : Theme.accent)
                            Text(f).font(.system(size: 15, weight: .medium)).foregroundStyle(.white)
                            Spacer()
                        }
                    }
                }
                .padding(20)
                .glassCard(cornerRadius: 22)
                .overlay(
                    selectedTier == .elite ?
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .stroke(Color(red: 1, green: 0.78, blue: 0.2).opacity(0.4), lineWidth: 1.5)
                    : nil
                )

                // Best value badge
                if selectedTier == .elite {
                    Text("BEST VALUE")
                        .font(.system(size: 10, weight: .bold))
                        .tracking(2)
                        .foregroundStyle(.black)
                        .padding(.horizontal, 14).padding(.vertical, 5)
                        .background(Capsule().fill(Color(red: 1, green: 0.78, blue: 0.2)))
                }

                // CTA
                PillButton(title: "Start Free Trial", icon: "sparkles") {
                    store.subscription = Subscription(
                        status: .trial,
                        startDate: Date(),
                        expiryDate: Calendar.current.date(byAdding: .day, value: 30, to: Date())
                    )
                    withAnimation(.spring) { activated = true }
                }

                VStack(spacing: 4) {
                    Text("After 30 days, choose Pro at $4.99 or Elite at $9.99")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.textTertiary)
                        .multilineTextAlignment(.center)
                    Text("Cancel anytime. Billed through the App Store.")
                        .font(.system(size: 11))
                        .foregroundStyle(Theme.textTertiary)
                }

                // Restore purchases
                Button("Restore Purchases") {
                    Task {
                        let restored = await SubscriptionService.shared.restorePurchases()
                        if restored {
                            store.subscription = Subscription(status: .active, startDate: Date(), expiryDate: nil)
                            withAnimation(.spring) { activated = true }
                        }
                    }
                }
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Theme.accent)
                .padding(.bottom, 16)

                Button("Maybe Later") { dismiss() }
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.textTertiary)
                Color.clear.frame(height: 20)
            }
            .padding(.horizontal, 20)
        }
        .scrollIndicators(.hidden)
    }

    private func tierButton(_ tier: SubscriptionTier, title: String, price: String) -> some View {
        Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            withAnimation(.spring(response: 0.3)) { selectedTier = tier }
        } label: {
            VStack(spacing: 6) {
                HStack(spacing: 6) {
                    if tier == .elite {
                        Image(systemName: "crown.fill")
                            .font(.system(size: 12))
                            .foregroundStyle(Color(red: 1, green: 0.78, blue: 0.2))
                    }
                    Text(title)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(selectedTier == tier ? .white : Theme.textSecondary)
                }
                Text(price)
                    .font(.system(size: 13))
                    .foregroundStyle(selectedTier == tier ? Theme.accent : Theme.textTertiary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(selectedTier == tier
                          ? (tier == .elite ? Color(red: 1, green: 0.78, blue: 0.2).opacity(0.15) : Theme.accent.opacity(0.15))
                          : Color.white.opacity(0.03))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(selectedTier == tier
                            ? (tier == .elite ? Color(red: 1, green: 0.78, blue: 0.2).opacity(0.5) : Theme.accent.opacity(0.5))
                            : Color.white.opacity(0.06),
                            lineWidth: selectedTier == tier ? 1.5 : 1)
            )
        }
        .buttonStyle(.plain)
    }

    private let proFeatures = [
        "All standard workout programs",
        "Unlimited FITNEO AI conversations",
        "AI generated workout plans",
        "Full nutrition tracking",
        "Progress analytics & weight tracking",
        "Streak & XP system",
        "Leaderboard & weekly fitness reports",
        "Badges, workout history & demo mode"
    ]

    private let eliteFeatures = [
        "Everything in Pro",
        "Sports Mode with 10 sports",
        "Elite Physique program (8-week system)",
        "Power & Conditioning program",
        "Bodyweight Beast program",
        "Nutrition Scanner & Coach meal scoring",
        "Advanced body metrics",
        "Priority FITNEO AI & exclusive Elite badge"
    ]

    private var successView: some View {
        VStack(spacing: 20) {
            Spacer()
            Image(systemName: selectedTier == .elite ? "crown.fill" : "checkmark.seal.fill")
                .font(.system(size: 90))
                .foregroundStyle(selectedTier == .elite ? Color(red: 1, green: 0.78, blue: 0.2) : Theme.accent)
                .shadow(color: selectedTier == .elite ? Color(red: 1, green: 0.78, blue: 0.2) : Theme.accent, radius: 20)
            Text(selectedTier == .elite ? "You're Elite!" : "You're Pro!")
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(.white)
            Text("1 month free trial — all features unlocked.")
                .font(.system(size: 15))
                .foregroundStyle(Theme.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            Spacer()
            PillButton(title: "Let's Train", action: { dismiss() })
                .padding(.horizontal, 40)
            Spacer().frame(height: 30)
        }
        .onAppear {
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        }
    }
}
