import SwiftUI

enum Theme {
    // Backgrounds
    static let background = Color(red: 0x0A / 255, green: 0x0E / 255, blue: 0x1A / 255) // #0A0E1A
    static let backgroundElevated = Color(red: 0x12 / 255, green: 0x18 / 255, blue: 0x28 / 255)
    static let cardFill = Color.white.opacity(0.04)
    static let cardFillSelected = Color(red: 0x0A / 255, green: 0x84 / 255, blue: 0xFF / 255).opacity(0.18)
    static let cardStroke = Color.white.opacity(0.08)
    static let cardStrokeSelected = Color(red: 0x0A / 255, green: 0x84 / 255, blue: 0xFF / 255)

    // Accents
    static let accent = Color(red: 0x0A / 255, green: 0x84 / 255, blue: 0xFF / 255) // #0A84FF
    static let coral = Color(red: 0xFF / 255, green: 0x6B / 255, blue: 0x35 / 255) // #FF6B35
    static let success = Color(red: 0x32 / 255, green: 0xD7 / 255, blue: 0x4D / 255)
    static let danger = Color(red: 0xFF / 255, green: 0x45 / 255, blue: 0x3A / 255)

    // Typography
    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.65)
    static let textTertiary = Color.white.opacity(0.4)

    // Gradients
    static let pageGradient = LinearGradient(
        colors: [
            Color(red: 0x06 / 255, green: 0x09 / 255, blue: 0x14 / 255),
            Color(red: 0x0A / 255, green: 0x0E / 255, blue: 0x1A / 255),
            Color(red: 0x0F / 255, green: 0x16 / 255, blue: 0x2E / 255)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let glowGradient = RadialGradient(
        colors: [accent.opacity(0.35), .clear],
        center: .center,
        startRadius: 0,
        endRadius: 220
    )
}

// MARK: - View modifiers

extension View {
    func glassCard(selected: Bool = false, cornerRadius: CGFloat = 18) -> some View {
        self
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(.ultraThinMaterial)
                    .opacity(0.4)
            )
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(selected ? Theme.cardFillSelected : Theme.cardFill)
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(selected ? Theme.cardStrokeSelected : Theme.cardStroke, lineWidth: selected ? 1.5 : 1)
            )
            .shadow(color: selected ? Theme.accent.opacity(0.35) : .clear, radius: 18, x: 0, y: 0)
    }

    func primaryButtonStyle(disabled: Bool = false) -> some View {
        self
            .font(.headline)
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(disabled ? Theme.accent.opacity(0.4) : Theme.accent)
            )
            .shadow(color: disabled ? .clear : Theme.accent.opacity(0.4), radius: 16, y: 8)
    }
}

struct SectionHeader: View {
    let title: String
    var body: some View {
        Text(title.uppercased())
            .font(.system(size: 12, weight: .bold))
            .tracking(2)
            .foregroundStyle(Theme.accent)
    }
}

struct AILabel: View {
    let text: String
    @State private var pulse = false
    var body: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(Theme.accent)
                .frame(width: 6, height: 6)
                .scaleEffect(pulse ? 1.4 : 0.8)
                .opacity(pulse ? 0.4 : 1)
            Text(text)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(Theme.textSecondary)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1).repeatForever(autoreverses: true)) {
                pulse = true
            }
        }
    }
}
