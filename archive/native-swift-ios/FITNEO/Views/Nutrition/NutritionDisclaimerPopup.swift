import SwiftUI

/// Medical disclaimer shown on first visit to the Meal Scanning hub.
/// Uses UserDefaults flag "hasAcceptedNutritionDisclaimer" to gate.
struct NutritionDisclaimerPopup: View {
    @Binding var isPresented: Bool
    @State private var accepted = false

    var body: some View {
        ZStack {
            Color.black.opacity(0.5).ignoresSafeArea()
                .onTapGesture { /* block dismiss by tapping outside */ }

            VStack(spacing: 20) {
                VStack(spacing: 10) {
                    Image(systemName: "stethoscope")
                        .font(.system(size: 42))
                        .foregroundStyle(Theme.accent)
                        .shadow(color: Theme.accent.opacity(0.4), radius: 10)

                    Text("Legal & Medical Disclaimer")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(.white)
                }

                ScrollView {
                    Text("FITNEO's Barcode Scanner and Gemini AI Vision Scanner provide estimated nutritional information for informational and motivational purposes only. Weight estimations, ingredient identifications, and macronutrient/caloric counts are calculated via artificial intelligence and may contain discrepancies. FITNEO does not guarantee accuracy, does not screen for allergens, and should not be used as a replacement for professional medical advice or clinical dietetics. Always consult a healthcare professional before altering your diet or fitness routine.")
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.horizontal, 4)
                }
                .frame(maxHeight: 200)

                Button {
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    UserDefaults.standard.set(true, forKey: "hasAcceptedNutritionDisclaimer")
                    accepted = true
                    withAnimation(.easeInOut(duration: 0.3)) {
                        isPresented = false
                    }
                } label: {
                    Text("I Acknowledge & Agree")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .fill(Theme.accent)
                        )
                }
                .buttonStyle(.plain)
            }
            .padding(24)
            .frame(maxWidth: min(UIScreen.main.bounds.width - 48, 420))
            .background(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(Color(red: 0.10, green: 0.12, blue: 0.18))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
            )
        }
    }
}
