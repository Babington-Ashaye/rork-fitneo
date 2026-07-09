import SwiftUI

/// Full-screen AI plan generation with animated checklist and pulsing avatar.
/// Shown immediately after onboarding completes, before the home screen.
struct PlanGenerationView: View {
    let onboardingData: OnboardingData
    var onComplete: (GeneratedPlan) -> Void

    @State private var phase = 0
    @State private var progress: Double = 0
    @State private var errorMessage: String?
    @State private var generatedPlan: GeneratedPlan?
    @State private var glow = false

    private let messages = [
        "Analyzing your goals",
        "Matching your fitness level",
        "Selecting optimal exercises",
        "Calculating your weekly schedule",
        "Finalizing your plan"
    ]

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            Theme.glowGradient
                .frame(width: 500, height: 500)
                .offset(y: -200)
                .ignoresSafeArea()
                .allowsHitTesting(false)

            VStack(spacing: 28) {
                Spacer().frame(height: 40)

                // Pulsing FITNEO AI avatar
                ZStack {
                    Circle()
                        .fill(Theme.accent.opacity(glow ? 0.35 : 0.12))
                        .frame(width: 160, height: 160)
                        .blur(radius: 30)
                        .scaleEffect(glow ? 1.15 : 0.9)
                        .animation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true), value: glow)

                    Circle()
                        .fill(Theme.accent.opacity(0.1))
                        .frame(width: 110, height: 110)

                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 48, weight: .semibold))
                        .foregroundStyle(Theme.accent)
                        .shadow(color: Theme.accent.opacity(0.6), radius: 16)
                }
                .onAppear { glow = true }

                Text("FITNEO AI")
                    .font(.system(size: 26, weight: .bold))
                    .tracking(3)
                    .foregroundStyle(.white)

                Text(generatedPlan != nil ? "Plan ready!" : "Generating your plan")
                    .font(.system(size: 15))
                    .foregroundStyle(Theme.textSecondary)

                // Animated checklist
                VStack(alignment: .leading, spacing: 14) {
                    ForEach(Array(messages.enumerated()), id: \.offset) { idx, msg in
                        HStack(spacing: 12) {
                            if idx < phase {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(Theme.accent)
                                    .font(.system(size: 18))
                            } else if idx == phase && generatedPlan == nil {
                                PulsingDot()
                            } else {
                                Circle()
                                    .stroke(Theme.textTertiary, lineWidth: 1.5)
                                    .frame(width: 18, height: 18)
                            }
                            Text(msg)
                                .font(.system(size: 15, weight: .medium))
                                .foregroundStyle(idx < phase ? .white : idx == phase && generatedPlan == nil ? Theme.accent : Theme.textTertiary)
                            Spacer()
                        }
                        .opacity(idx > phase && generatedPlan == nil ? 0.4 : 1)
                        .animation(.easeInOut(duration: 0.3), value: phase)
                    }
                }
                .padding(22)
                .glassCard(cornerRadius: 22)

                // Progress bar
                VStack(spacing: 6) {
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.white.opacity(0.08))
                            Capsule()
                                .fill(Theme.accent)
                                .frame(width: max(8, geo.size.width * progress))
                                .shadow(color: Theme.accent.opacity(0.6), radius: 8)
                                .animation(.spring(response: 0.6), value: progress)
                        }
                    }
                    .frame(height: 8)
                    Text("\(Int(progress * 100))%")
                        .font(.caption)
                        .foregroundStyle(Theme.textSecondary)
                }
                .padding(.horizontal, 10)

                if let error = errorMessage {
                    VStack(spacing: 12) {
                        Text(error)
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.danger)
                            .multilineTextAlignment(.center)

                        Button {
                            errorMessage = nil
                            phase = 0
                            progress = 0
                            generatePlan()
                        } label: {
                            HStack(spacing: 6) {
                                Image(systemName: "arrow.clockwise")
                                Text("Retry")
                            }
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Theme.accent)
                            .padding(.horizontal, 24)
                            .padding(.vertical, 12)
                            .glassCard(cornerRadius: 14)
                        }
                        .buttonStyle(.plain)
                    }
                }

                Spacer()
            }
            .padding(.horizontal, 28)
        }
        .onAppear { generatePlan() }
    }

    private func generatePlan() {
        Task {
            do {
                for i in 0..<messages.count {
                    try await Task.sleep(for: .seconds(1.5))
                    withAnimation { phase = i + 1 }
                    withAnimation(.easeInOut(duration: 1.0)) {
                        progress = Double(i + 1) / Double(messages.count) * 0.85
                    }
                }

                let plan = try await PlanGenerationService.generateFitnessPlan(onboarding: onboardingData)
                generatedPlan = plan

                withAnimation(.easeInOut(duration: 0.8)) { progress = 1.0 }
                try await Task.sleep(for: .seconds(0.8))
                await MainActor.run { onComplete(plan) }
            } catch {
                // Falls back to local plan
                let localPlan = PlanGenerationService.generateLocalPlan(onboarding: onboardingData)
                generatedPlan = localPlan
                errorMessage = "AI generation unavailable — using a locally optimized plan instead."
                withAnimation(.easeInOut(duration: 0.8)) { progress = 1.0 }
                try? await Task.sleep(for: .seconds(1.5))
                await MainActor.run { onComplete(localPlan) }
            }
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
