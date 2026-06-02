import SwiftUI

// MARK: - Stat mini card

struct StatCard: View {
    let icon: String
    let value: String
    let label: String
    var tint: Color = Theme.accent

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(tint)
            Text(value)
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(.white)
                .contentTransition(.numericText())
            Text(label)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(Theme.textTertiary)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .glassCard(cornerRadius: 18)
    }
}

// MARK: - XP Bar

struct XPBar: View {
    let level: Int
    let rankTitle: String
    let progress: Double
    let xpInto: Int
    let xpSpan: Int?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                HStack(spacing: 6) {
                    Image(systemName: "bolt.fill").font(.caption2).foregroundStyle(Theme.accent)
                    Text("LVL \(level) · \(rankTitle)")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.white)
                }
                Spacer()
                if let span = xpSpan {
                    Text("\(xpInto) / \(span) XP")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(Theme.textTertiary)
                } else {
                    Text("MAX")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(Theme.coral)
                }
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.white.opacity(0.08))
                    Capsule()
                        .fill(LinearGradient(colors: [Theme.accent, Color(red: 0, green: 0.95, blue: 0.63)], startPoint: .leading, endPoint: .trailing))
                        .frame(width: max(8, geo.size.width * progress))
                        .shadow(color: Theme.accent.opacity(0.6), radius: 8)
                        .animation(.spring(response: 0.6, dampingFraction: 0.8), value: progress)
                }
            }
            .frame(height: 10)
        }
        .padding(16)
        .glassCard(cornerRadius: 18)
    }
}

// MARK: - Streak flame

struct StreakFlame: View {
    let streak: Int
    @State private var flicker = false

    private var color: Color {
        switch streak {
        case 0: return Color.white.opacity(0.3)
        case 1...3: return Color(red: 0.3, green: 0.85, blue: 0.8)
        case 4...7: return Color.orange
        case 8...14: return Color(red: 1, green: 0.5, blue: 0.1)
        case 15...29: return Color(red: 1, green: 0.3, blue: 0.2)
        default: return Color(red: 1, green: 0.2, blue: 0.1)
        }
    }
    private var size: CGFloat {
        switch streak {
        case 0: return 22
        case 1...3: return 24
        case 4...7: return 28
        case 8...14: return 32
        case 15...29: return 36
        default: return 40
        }
    }

    var body: some View {
        ZStack {
            if streak >= 15 {
                Circle()
                    .fill(color.opacity(0.25))
                    .frame(width: size * 2, height: size * 2)
                    .blur(radius: 14)
                    .scaleEffect(flicker ? 1.15 : 0.9)
            }
            Image(systemName: streak == 0 ? "flame" : "flame.fill")
                .font(.system(size: size, weight: .bold))
                .foregroundStyle(color)
                .shadow(color: streak > 0 ? color.opacity(0.7) : .clear, radius: 10)
                .scaleEffect(streak > 0 && flicker ? 1.08 : 1.0)
        }
        .onAppear {
            guard streak > 0 else { return }
            withAnimation(.easeInOut(duration: 0.7).repeatForever(autoreverses: true)) { flicker = true }
        }
    }
}

// MARK: - Timer ring

struct TimerRing: View {
    let progress: Double      // 0..1 remaining
    let secondsRemaining: Int
    var size: CGFloat = 200

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.white.opacity(0.08), lineWidth: 14)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    AngularGradient(colors: [Theme.coral, Theme.accent, Theme.coral], center: .center),
                    style: StrokeStyle(lineWidth: 14, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .shadow(color: Theme.accent.opacity(0.5), radius: 10)
                .animation(.linear(duration: 0.3), value: progress)
            VStack(spacing: 2) {
                Text("\(secondsRemaining)")
                    .font(.system(size: 56, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .contentTransition(.numericText())
                Text("REST").font(.system(size: 12, weight: .bold)).tracking(2).foregroundStyle(Theme.textTertiary)
            }
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Macro ring (donut)

struct MacroRing: View {
    let protein: Double
    let carbs: Double
    let fat: Double
    var size: CGFloat = 130

    private var total: Double { max(1, protein + carbs + fat) }

    var body: some View {
        let pFrac = protein / total
        let cFrac = carbs / total
        ZStack {
            ringSegment(from: 0, to: pFrac, color: Theme.accent)
            ringSegment(from: pFrac, to: pFrac + cFrac, color: Theme.coral)
            ringSegment(from: pFrac + cFrac, to: 1, color: Color(red: 1, green: 0.78, blue: 0.2))
            VStack(spacing: 0) {
                Text("\(Int(total))g").font(.system(size: 20, weight: .bold)).foregroundStyle(.white)
                Text("macros").font(.system(size: 10, weight: .medium)).foregroundStyle(Theme.textTertiary)
            }
        }
        .frame(width: size, height: size)
    }

    private func ringSegment(from: Double, to: Double, color: Color) -> some View {
        Circle()
            .trim(from: from, to: to)
            .stroke(color, style: StrokeStyle(lineWidth: 16, lineCap: .butt))
            .rotationEffect(.degrees(-90))
    }
}

// MARK: - Section title

struct ScreenTitle: View {
    let title: String
    var subtitle: String?
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(size: 30, weight: .bold))
                .foregroundStyle(.white)
            if let subtitle {
                Text(subtitle).font(.subheadline).foregroundStyle(Theme.textSecondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Difficulty dots

struct DifficultyDots: View {
    let difficulty: Difficulty
    var body: some View {
        HStack(spacing: 3) {
            ForEach(1...3, id: \.self) { i in
                Circle()
                    .fill(i <= difficulty.rawValue ? Theme.accent : Color.white.opacity(0.15))
                    .frame(width: 6, height: 6)
            }
        }
    }
}

// MARK: - Pill button

struct PillButton: View {
    let title: String
    var icon: String?
    var filled: Bool = true
    let action: () -> Void
    @State private var pressed = false

    var body: some View {
        Button {
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            action()
        } label: {
            HStack(spacing: 8) {
                if let icon { Image(systemName: icon) }
                Text(title).fontWeight(.semibold)
            }
            .font(.headline)
            .foregroundStyle(filled ? .white : Theme.accent)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(filled ? Theme.accent : Color.white.opacity(0.05))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(filled ? Color.clear : Theme.accent.opacity(0.4), lineWidth: 1)
            )
            .shadow(color: filled ? Theme.accent.opacity(0.4) : .clear, radius: 14, y: 6)
            .scaleEffect(pressed ? 0.96 : 1)
        }
        .buttonStyle(.plain)
        .simultaneousGesture(DragGesture(minimumDistance: 0)
            .onChanged { _ in withAnimation(.easeOut(duration: 0.15)) { pressed = true } }
            .onEnded { _ in withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) { pressed = false } })
    }
}

// MARK: - Badge tile

struct BadgeTile: View {
    let badge: Badge
    let earned: Bool

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .fill(earned ? Theme.accent.opacity(0.18) : Color.white.opacity(0.04))
                    .frame(width: 60, height: 60)
                Image(systemName: badge.icon)
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundStyle(earned ? Theme.accent : Theme.textTertiary)
            }
            .overlay(
                Circle().stroke(earned ? Theme.accent.opacity(0.5) : Color.white.opacity(0.08), lineWidth: 1)
            )
            .shadow(color: earned ? Theme.accent.opacity(0.4) : .clear, radius: 10)
            Text(badge.name)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(earned ? .white : Theme.textTertiary)
                .multilineTextAlignment(.center)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity)
        .opacity(earned ? 1 : 0.55)
    }
}

// MARK: - Badge unlock overlay

struct BadgeUnlockOverlay: View {
    let badge: Badge
    let onDismiss: () -> Void
    @State private var appear = false

    var body: some View {
        ZStack {
            Color.black.opacity(0.7).ignoresSafeArea()
                .onTapGesture(perform: onDismiss)
            VStack(spacing: 18) {
                Text("BADGE UNLOCKED")
                    .font(.system(size: 13, weight: .bold)).tracking(3).foregroundStyle(Theme.accent)
                ZStack {
                    Circle().fill(Theme.accent.opacity(0.2)).frame(width: 140, height: 140).blur(radius: 20)
                    Image(systemName: badge.icon)
                        .font(.system(size: 60, weight: .bold))
                        .foregroundStyle(Theme.accent)
                        .shadow(color: Theme.accent, radius: 16)
                }
                .scaleEffect(appear ? 1 : 0.4)
                .rotationEffect(.degrees(appear ? 0 : -30))
                Text(badge.name).font(.system(size: 24, weight: .bold)).foregroundStyle(.white)
                Text(badge.description).font(.subheadline).foregroundStyle(Theme.textSecondary)
                    .multilineTextAlignment(.center)
                PillButton(title: "Awesome", action: onDismiss)
                    .frame(maxWidth: 200)
                    .padding(.top, 8)
            }
            .padding(32)
            .frame(maxWidth: 340)
            .glassCard(cornerRadius: 28)
            .padding(40)
            .scaleEffect(appear ? 1 : 0.8)
            .opacity(appear ? 1 : 0)
        }
        .onAppear {
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            withAnimation(.spring(response: 0.5, dampingFraction: 0.6)) { appear = true }
        }
    }
}

// MARK: - Level up overlay

struct LevelUpOverlay: View {
    let level: Int
    let rankTitle: String
    let onDismiss: () -> Void
    @State private var appear = false

    var body: some View {
        ZStack {
            Color.black.opacity(0.8).ignoresSafeArea().onTapGesture(perform: onDismiss)
            VStack(spacing: 16) {
                Text("LEVEL UP").font(.system(size: 14, weight: .bold)).tracking(4).foregroundStyle(Theme.coral)
                Text("\(level)")
                    .font(.system(size: 96, weight: .bold, design: .rounded))
                    .foregroundStyle(LinearGradient(colors: [Theme.accent, Theme.coral], startPoint: .top, endPoint: .bottom))
                    .shadow(color: Theme.accent.opacity(0.6), radius: 20)
                    .scaleEffect(appear ? 1 : 0.3)
                Text(rankTitle).font(.system(size: 26, weight: .bold)).foregroundStyle(.white)
                PillButton(title: "Let's go", action: onDismiss).frame(maxWidth: 200).padding(.top, 8)
            }
            .padding(36)
        }
        .onAppear {
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            withAnimation(.spring(response: 0.6, dampingFraction: 0.5)) { appear = true }
        }
    }
}

// MARK: - Floating glass nav

struct FloatingNav: View {
    @Binding var selected: Int
    let items: [(icon: String, label: String)]

    var body: some View {
        HStack(spacing: 4) {
            ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                let isActive = selected == index
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) { selected = index }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: item.icon)
                            .font(.system(size: 18, weight: .semibold))
                            .scaleEffect(isActive ? 1.15 : 1)
                        if isActive {
                            Text(item.label)
                                .font(.system(size: 13, weight: .bold))
                                .fixedSize()
                        }
                    }
                    .foregroundStyle(isActive ? Theme.accent : Theme.textTertiary)
                    .padding(.vertical, 10)
                    .padding(.horizontal, isActive ? 14 : 10)
                    .background(
                        Capsule().fill(isActive ? Theme.accent.opacity(0.15) : Color.clear)
                    )
                    .shadow(color: isActive ? Theme.accent.opacity(0.4) : .clear, radius: 8)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(
            Capsule()
                .fill(.ultraThinMaterial)
                .environment(\.colorScheme, .dark)
        )
        .overlay(Capsule().stroke(Color.white.opacity(0.12), lineWidth: 1))
        .shadow(color: .black.opacity(0.4), radius: 16, y: 8)
    }
}
