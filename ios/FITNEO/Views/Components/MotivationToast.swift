import SwiftUI

/// Shows the AI-generated motivational message as a toast that slides up
/// and auto-dismisses after 3 seconds.
struct MotivationToast: View {
    let message: String
    let onDismiss: () -> Void

    @State private var offset: CGFloat = 120
    @State private var opacity: Double = 0

    var body: some View {
        VStack {
            Spacer()
            HStack(spacing: 12) {
                Image(systemName: "sparkles")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.accent)
                Text(message)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.white)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer()
                Button {
                    dismissToast()
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(Theme.textTertiary)
                }
                .buttonStyle(.plain)
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(Color(red: 0.12, green: 0.16, blue: 0.28).opacity(0.95))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(Theme.accent.opacity(0.25), lineWidth: 1)
            )
            .shadow(color: Theme.accent.opacity(0.15), radius: 20, y: -4)
            .padding(.horizontal, 20)
            .padding(.bottom, 100)
            .offset(y: offset)
            .opacity(opacity)
        }
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
                offset = 0
                opacity = 1
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                dismissToast()
            }
        }
    }

    private func dismissToast() {
        withAnimation(.easeInOut(duration: 0.3)) {
            offset = 120
            opacity = 0
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
            onDismiss()
        }
    }
}

// MARK: - Toast overlay modifier

struct MotivationToastOverlay: ViewModifier {
    let show: Bool
    let onDismissToast: () -> Void
    @State private var message: String = ""
    @State private var loading = true

    func body(content: Content) -> some View {
        content.overlay {
            if show {
                MotivationToast(message: loading ? "You're doing amazing! Keep pushing forward." : message) {
                    onDismissToast()
                }
                .task {
                    if let generated = await generateMotivation() {
                        message = generated
                    }
                    loading = false
                }
            }
        }
    }

    private func generateMotivation() async -> String? {
        let msg = await GeminiService.shared.generateMotivation()
        guard !msg.isEmpty, msg.count < 120 else { return nil }
        return msg
    }
}

extension View {
    func motivationToast(show: Bool, onDismiss: @escaping () -> Void) -> some View {
        modifier(MotivationToastOverlay(show: show, onDismissToast: onDismiss))
    }
}
