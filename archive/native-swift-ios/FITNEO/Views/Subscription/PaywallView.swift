import SwiftUI

struct PaywallView: View {
    @Environment(FitneoStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var activated = false
    @State private var isYearly = false
    @State private var selectedTier: SubscriptionTier = .elite

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
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
                // Logo + heading
                VStack(spacing: 10) {
                    ZStack {
                        Circle()
                            .fill(Theme.accent.opacity(0.15))
                            .frame(width: 80, height: 80)
                            .blur(radius: 12)
                        Image(systemName: "bolt.heart.fill")
                            .font(.system(size: 38))
                            .foregroundStyle(Theme.accent)
                            .shadow(color: Theme.accent.opacity(0.5), radius: 10)
                    }
                    .padding(.top, 16)

                    Text("Choose Your Plan")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundStyle(.white)
                    Text("Start your 1 month free trial today")
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.textSecondary)
                }

                // Tier selector tabs
                HStack(spacing: 10) {
                    tierTab(.pro, title: "Pro", price: isYearly ? "$3.33/mo" : "$4.99/mo")
                    tierTab(.elite, title: "Elite", price: isYearly ? "$6.67/mo" : "$9.99/mo")
                }
                .padding(.horizontal, 4)

                // Yearly / Monthly toggle
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

                // Plan cards — only one visible at a time
                VStack(spacing: 16) {
                    if selectedTier == .pro {
                        planCard(
                            tier: .pro,
                            name: "FITNEO Pro",
                            icon: "sparkles",
                            accent: Theme.accent,
                            monthlyPrice: "$4.99",
                            yearlyPrice: "$39.99",
                            features: proFeatures,
                            isBestValue: false
                        )
                    }

                    if selectedTier == .elite {
                        planCard(
                            tier: .elite,
                            name: "FITNEO Elite",
                            icon: "crown.fill",
                            accent: Color(red: 1, green: 0.78, blue: 0.2),
                            monthlyPrice: "$9.99",
                            yearlyPrice: "$79.99",
                            features: eliteFeatures,
                            isBestValue: true
                        )
                    }
                }

                // CTA
                PillButton(title: "Start Your Free Month — No charge today", icon: "sparkles") {
                    store.startTrial()
                    withAnimation(.spring) { activated = true }
                }
                .padding(.top, 4)

                // Disclaimer
                VStack(spacing: 4) {
                    Text("After 30 days choose your plan. Cancel anytime.")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.textSecondary)
                        .multilineTextAlignment(.center)
                    Text("Billed through the App Store.")
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
                .padding(.bottom, 8)

                Color.clear.frame(height: 20)
            }
            .padding(.horizontal, 20)
        }
        .scrollIndicators(.hidden)
    }

    // MARK: - Plan card

    private func planCard(
        tier: SubscriptionTier,
        name: String,
        icon: String,
        accent: Color,
        monthlyPrice: String,
        yearlyPrice: String,
        features: [String],
        isBestValue: Bool
    ) -> some View {
        let isSelected = selectedTier == tier

        return Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            withAnimation(.spring(response: 0.3)) { selectedTier = tier }
        } label: {
            VStack(alignment: .leading, spacing: 14) {
                // Header row
                HStack(spacing: 10) {
                    Image(systemName: icon)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(accent)
                    Text(name)
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(.white)
                    Spacer()

                    if isBestValue {
                        Text("BEST VALUE")
                            .font(.system(size: 9, weight: .bold))
                            .tracking(1.5)
                            .foregroundStyle(.black)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(Capsule().fill(Color(red: 1, green: 0.78, blue: 0.2)))
                    }

                    Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                        .font(.system(size: 20))
                        .foregroundStyle(isSelected ? accent : Theme.textTertiary)
                }

                // Price
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(isYearly ? yearlyPrice : monthlyPrice)
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(.white)
                    Text(isYearly ? "/year" : "/month")
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.textSecondary)
                }

                // Features
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(features, id: \.self) { f in
                        HStack(alignment: .top, spacing: 10) {
                            Image(systemName: "checkmark")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(accent)
                                .padding(.top, 2)
                            Text(f)
                                .font(.system(size: 14))
                                .foregroundStyle(Theme.textSecondary)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
            }
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(isSelected ? accent.opacity(0.06) : Color.white.opacity(0.03))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .stroke(
                        isSelected
                            ? (isBestValue ? accent.opacity(0.5) : accent.opacity(0.35))
                            : Color.white.opacity(0.08),
                        lineWidth: isSelected ? (isBestValue ? 2 : 1.5) : 1
                    )
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Tier tabs (compact picker above cards)

    private func tierTab(_ tier: SubscriptionTier, title: String, price: String) -> some View {
        Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            withAnimation(.spring(response: 0.3)) { selectedTier = tier }
        } label: {
            VStack(spacing: 4) {
                HStack(spacing: 5) {
                    if tier == .elite {
                        Image(systemName: "crown.fill")
                            .font(.system(size: 10))
                            .foregroundStyle(Color(red: 1, green: 0.78, blue: 0.2))
                    }
                    Text(title)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(selectedTier == tier ? .white : Theme.textSecondary)
                }
                Text(price)
                    .font(.system(size: 12))
                    .foregroundStyle(selectedTier == tier ? Theme.accent : Theme.textTertiary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(selectedTier == tier
                          ? (tier == .elite ? Color(red: 1, green: 0.78, blue: 0.2).opacity(0.12) : Theme.accent.opacity(0.12))
                          : Color.white.opacity(0.03))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(selectedTier == tier
                            ? (tier == .elite ? Color(red: 1, green: 0.78, blue: 0.2).opacity(0.4) : Theme.accent.opacity(0.4))
                            : Color.white.opacity(0.06),
                            lineWidth: selectedTier == tier ? 1.5 : 1)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Feature lists

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
        "Nutrition Scanner & AI meal coach",
        "Advanced body metrics",
        "Priority FITNEO AI & exclusive Elite badge"
    ]

    // MARK: - Success view

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
