import SwiftUI

// MARK: - Progress bar (top of every onboarding screen)

struct OnboardingProgressBar: View {
    let progress: Double // 0 ... 1

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(Color.white.opacity(0.08))
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [Theme.accent, Theme.accent.opacity(0.7)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: max(8, geo.size.width * progress))
                    .shadow(color: Theme.accent.opacity(0.6), radius: 8)
                    .animation(.spring(duration: 0.6), value: progress)
            }
        }
        .frame(height: 6)
    }
}

// MARK: - Selectable card (single + multi)

struct SelectableCard<Trailing: View>: View {
    let title: String
    var subtitle: String? = nil
    var icon: String? = nil
    let isSelected: Bool
    let action: () -> Void
    @ViewBuilder var trailing: () -> Trailing

    init(
        title: String,
        subtitle: String? = nil,
        icon: String? = nil,
        isSelected: Bool,
        action: @escaping () -> Void,
        @ViewBuilder trailing: @escaping () -> Trailing = { EmptyView() }
    ) {
        self.title = title
        self.subtitle = subtitle
        self.icon = icon
        self.isSelected = isSelected
        self.action = action
        self.trailing = trailing
    }

    var body: some View {
        Button(action: {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            action()
        }) {
            HStack(spacing: 14) {
                if let icon {
                    Image(systemName: icon)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(isSelected ? Theme.accent : Theme.textSecondary)
                        .frame(width: 36, height: 36)
                        .background(
                            Circle().fill(isSelected ? Theme.accent.opacity(0.18) : Color.white.opacity(0.05))
                        )
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(.white)
                    if let subtitle {
                        Text(subtitle)
                            .font(.footnote)
                            .foregroundStyle(Theme.textSecondary)
                    }
                }
                Spacer(minLength: 8)
                trailing()
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.title3)
                        .foregroundStyle(Theme.accent)
                }
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .glassCard(selected: isSelected)
            .animation(.spring(duration: 0.3), value: isSelected)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Grid card (used for focus areas etc.)

struct GridCard: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            action()
        }) {
            VStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.system(size: 26, weight: .semibold))
                    .foregroundStyle(isSelected ? Theme.accent : Theme.textSecondary)
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 110)
            .glassCard(selected: isSelected)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Step header

struct StepHeader: View {
    let kicker: String
    let aiLabel: String?
    let question: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                SectionHeader(title: kicker)
                if let aiLabel { AILabel(text: aiLabel) }
            }
            Text(question)
                .font(.system(size: 30, weight: .bold))
                .foregroundStyle(.white)
                .lineLimit(3)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Calibration screen

struct CalibrationView: View {
    let title: String
    let subtitle: String
    let icon: String?
    let items: [String]
    let activeItem: String
    let endProgress: Double // 0..1
    let onFinished: () -> Void

    @State private var visibleCount: Int = 0
    @State private var localProgress: Double = 0

    var body: some View {
        VStack(spacing: 24) {
            Spacer(minLength: 0)
            VStack(spacing: 14) {
                if let icon {
                    ZStack {
                        Circle()
                            .fill(Theme.accent.opacity(0.18))
                            .frame(width: 100, height: 100)
                            .blur(radius: 22)
                        Image(systemName: icon)
                            .font(.system(size: 44, weight: .semibold))
                            .foregroundStyle(Theme.accent)
                            .frame(width: 88, height: 88)
                            .glassCard(cornerRadius: 24)
                    }
                }
                Text(title)
                    .font(.system(size: 28, weight: .bold))
                    .tracking(2)
                    .foregroundStyle(.white)
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(Theme.textSecondary)
            }

            VStack(alignment: .leading, spacing: 14) {
                ForEach(Array(items.enumerated()), id: \.offset) { idx, item in
                    HStack(spacing: 12) {
                        Image(systemName: idx < visibleCount ? "checkmark.circle.fill" : "circle")
                            .foregroundStyle(idx < visibleCount ? Theme.accent : Theme.textTertiary)
                        Text(item)
                            .font(.subheadline)
                            .foregroundStyle(idx < visibleCount ? .white : Theme.textTertiary)
                        Spacer()
                    }
                    .opacity(idx <= visibleCount ? 1 : 0.3)
                    .animation(.easeInOut(duration: 0.3), value: visibleCount)
                }
                HStack(spacing: 12) {
                    PulsingDot()
                    Text(activeItem)
                        .font(.subheadline)
                        .foregroundStyle(Theme.accent)
                    Spacer()
                }
                .opacity(visibleCount >= items.count ? 1 : 0.3)
            }
            .padding(20)
            .glassCard(cornerRadius: 20)

            VStack(spacing: 6) {
                OnboardingProgressBar(progress: localProgress)
                Text("\(Int(localProgress * 100))%")
                    .font(.caption)
                    .foregroundStyle(Theme.textSecondary)
            }
            .padding(.horizontal, 8)

            Spacer(minLength: 0)
        }
        .padding(.horizontal, 24)
        .task {
            for i in 1...items.count {
                try? await Task.sleep(for: .milliseconds(500))
                visibleCount = i
            }
            withAnimation(.easeInOut(duration: 1.0)) {
                localProgress = endProgress
            }
            try? await Task.sleep(for: .milliseconds(1200))
            onFinished()
        }
    }
}

private struct PulsingDot: View {
    @State private var scale: CGFloat = 0.6
    var body: some View {
        Circle()
            .fill(Theme.accent)
            .frame(width: 10, height: 10)
            .scaleEffect(scale)
            .onAppear {
                withAnimation(.easeInOut(duration: 0.7).repeatForever(autoreverses: true)) {
                    scale = 1.2
                }
            }
    }
}

// MARK: - Stats input row

struct StatInputRow<Unit: Hashable>: View {
    let label: String
    @Binding var value: Double
    @Binding var unit: Unit
    let units: [Unit]
    let unitTitle: (Unit) -> String
    let range: ClosedRange<Double>

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(label.uppercased())
                .font(.caption)
                .tracking(1)
                .foregroundStyle(Theme.textSecondary)

            HStack(spacing: 16) {
                TextField("", value: $value, format: .number.precision(.fractionLength(0...1)))
                    .keyboardType(.decimalPad)
                    .font(.system(size: 36, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, alignment: .leading)

                HStack(spacing: 4) {
                    ForEach(units, id: \.self) { u in
                        Button {
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            unit = u
                        } label: {
                            Text(unitTitle(u).uppercased())
                                .font(.caption)
                                .fontWeight(.bold)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(
                                    Capsule().fill(unit == u ? Theme.accent : Color.white.opacity(0.06))
                                )
                                .foregroundStyle(unit == u ? .white : Theme.textSecondary)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            Slider(value: $value, in: range)
                .tint(Theme.accent)
        }
        .padding(20)
        .glassCard(cornerRadius: 18)
    }
}
