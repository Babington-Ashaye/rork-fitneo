import SwiftUI

/// Full-screen sheet displaying legal text (Terms of Service or Privacy Policy).
struct LegalPolicySheet: View {
    @Environment(\.dismiss) private var dismiss
    let title: String
    let content: String

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()

            VStack(spacing: 0) {
                HStack {
                    Text(title)
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(.white)
                    Spacer()
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 26))
                            .foregroundStyle(Theme.textTertiary)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
                .padding(.bottom, 12)

                ScrollView {
                    Text(content)
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.horizontal, 20)
                        .padding(.bottom, 40)
                }
                .scrollIndicators(.hidden)
            }
        }
        .presentationDragIndicator(.visible)
        .preferredColorScheme(.dark)
    }
}
