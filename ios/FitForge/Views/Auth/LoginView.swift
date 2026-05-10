import SwiftUI

struct LoginView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var isSignUp = false
    @Bindable var viewModel: AuthViewModel
    var onAuthSuccess: () -> Void

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            Theme.glowGradient
                .frame(width: 500, height: 500)
                .offset(y: -260)
                .ignoresSafeArea()
                .allowsHitTesting(false)

            ScrollView {
                VStack(spacing: 28) {
                    Color.clear.frame(height: 1)

                    // MARK: — Logo & Title
                    VStack(spacing: 14) {
                        ZStack {
                            Circle()
                                .fill(Theme.accent.opacity(0.18))
                                .frame(width: 100, height: 100)
                                .blur(radius: 24)
                            Image(systemName: "bolt.heart.fill")
                                .font(.system(size: 48, weight: .bold))
                                .foregroundStyle(Theme.accent)
                                .shadow(color: Theme.accent.opacity(0.6), radius: 16)
                        }
                        .padding(.top, 50)

                        Text("FITNEO")
                            .font(.system(size: 36, weight: .black, design: .rounded))
                            .tracking(6)
                            .foregroundStyle(.white)

                        Text("The future of fitness is you.")
                            .font(.subheadline)
                            .foregroundStyle(Theme.textSecondary)
                    }

                    // MARK: — Form
                    VStack(spacing: 14) {
                        FieldView(
                            label: "Email",
                            placeholder: "you@example.com",
                            text: $email,
                            isSecure: false,
                            keyboard: .emailAddress,
                            contentType: .emailAddress
                        )

                        FieldView(
                            label: "Password",
                            placeholder: "Enter password",
                            text: $password,
                            isSecure: true,
                            keyboard: .default,
                            contentType: isSignUp ? .newPassword : .password
                        )

                        if let error = viewModel.errorMessage {
                            Text(error)
                                .font(.footnote)
                                .foregroundStyle(Theme.danger)
                                .multilineTextAlignment(.center)
                                .frame(maxWidth: .infinity)
                        }

                        // Sign In / Create Account button
                        Button {
                            Task {
                                if isSignUp {
                                    await viewModel.signUp(email: email, password: password)
                                } else {
                                    await viewModel.signIn(email: email, password: password)
                                }
                                if viewModel.isAuthenticated { onAuthSuccess() }
                            }
                        } label: {
                            HStack {
                                if viewModel.isLoading {
                                    ProgressView().tint(.white)
                                } else {
                                    Text(isSignUp ? "Create Account" : "Sign In")
                                        .font(.system(size: 16, weight: .semibold))
                                        .foregroundStyle(.white)
                                }
                            }
                            .frame(maxWidth: .infinity, minHeight: 52)
                            .background(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .fill(Theme.accent)
                            )
                        }
                        .disabled(!canSubmit || viewModel.isLoading)

                        // Divider
                        HStack(spacing: 12) {
                            Rectangle()
                                .fill(Color.white.opacity(0.1))
                                .frame(height: 1)
                            Text("OR")
                                .font(.caption)
                                .foregroundStyle(Theme.textTertiary)
                            Rectangle()
                                .fill(Color.white.opacity(0.1))
                                .frame(height: 1)
                        }
                        .padding(.vertical, 4)

                        // Google button
                        Button {
                            Task {
                                await viewModel.signInWithGoogle()
                                if viewModel.isAuthenticated { onAuthSuccess() }
                            }
                        } label: {
                            HStack(spacing: 12) {
                                GoogleGLogo(size: 20)
                                    .frame(width: 20, height: 20)
                                Text("Continue with Google")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundStyle(Color(red: 0.20, green: 0.20, blue: 0.20))
                                Spacer()
                            }
                            .padding(.horizontal, 16)
                            .frame(maxWidth: .infinity, minHeight: 52)
                            .background(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .fill(Color.white)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .stroke(Color.black.opacity(0.06), lineWidth: 1)
                            )
                            .shadow(color: Color.black.opacity(0.15), radius: 6, x: 0, y: 3)
                        }
                        .disabled(viewModel.isLoading)

                        // Toggle Sign In / Sign Up
                        Button {
                            withAnimation(.easeInOut) {
                                isSignUp.toggle()
                                viewModel.errorMessage = nil
                            }
                        } label: {
                            Text(isSignUp
                                 ? "Already have an account? Sign In"
                                 : "Don't have an account? Sign Up")
                                .font(.footnote)
                                .foregroundStyle(Theme.accent)
                        }
                        .padding(.top, 6)
                    }
                    .padding(.horizontal, 20)

                    Spacer(minLength: 40)
                }
                .padding(.bottom, 32)
                .frame(maxWidth: .infinity)
            }
            .scrollDismissesKeyboard(.interactively)
            .scrollIndicators(.hidden)
        }
        .preferredColorScheme(.dark)
        .ignoresSafeArea(.keyboard, edges: [])
    }

    private var canSubmit: Bool {
        !email.isEmpty && password.count >= 6
    }
}

// MARK: — Field View
private struct FieldView: View {
    let label: String
    let placeholder: String
    @Binding var text: String
    let isSecure: Bool
    let keyboard: UIKeyboardType
    let contentType: UITextContentType?

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundStyle(Theme.textSecondary)

            Group {
                if isSecure {
                    SecureField(placeholder, text: $text)
                } else {
                    TextField(placeholder, text: $text)
                        .keyboardType(keyboard)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                }
            }
            .textContentType(contentType)
            .foregroundStyle(.white)
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .frame(maxWidth: .infinity, minHeight: 48)
            .glassCard(cornerRadius: 14)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: — Google G Logo
struct GoogleGLogo: View {
    var size: CGFloat = 20

    private let blue   = Color(red: 0x42/255, green: 0x85/255, blue: 0xF4/255)
    private let red    = Color(red: 0xEA/255, green: 0x43/255, blue: 0x35/255)
    private let yellow = Color(red: 0xFB/255, green: 0xBC/255, blue: 0x05/255)
    private let green  = Color(red: 0x34/255, green: 0xA8/255, blue: 0x53/255)

    var body: some View {
        Canvas { context, canvasSize in
            let w = canvasSize.width
            let h = canvasSize.height
            let center = CGPoint(x: w / 2, y: h / 2)
            let radius = min(w, h) / 2
            let innerRadius = radius * 0.42

            func arcSegment(start: Double, end: Double) -> Path {
                var p = Path()
                p.move(to: CGPoint(
                    x: center.x + cos(start * .pi / 180) * radius,
                    y: center.y + sin(start * .pi / 180) * radius
                ))
                p.addArc(center: center, radius: radius,
                         startAngle: .degrees(start), endAngle: .degrees(end),
                         clockwise: false)
                p.addLine(to: CGPoint(
                    x: center.x + cos(end * .pi / 180) * innerRadius,
                    y: center.y + sin(end * .pi / 180) * innerRadius
                ))
                p.addArc(center: center, radius: innerRadius,
                         startAngle: .degrees(end), endAngle: .degrees(start),
                         clockwise: true)
                p.closeSubpath()
                return p
            }

            context.fill(arcSegment(start: -90, end: 0),   with: .color(blue))
            context.fill(arcSegment(start: 0,   end: 90),  with: .color(green))
            context.fill(arcSegment(start: 90,  end: 180), with: .color(yellow))
            context.fill(arcSegment(start: 180, end: 270), with: .color(red))

            let barHeight = radius * 0.42
            let barRect = CGRect(
                x: center.x,
                y: center.y - barHeight / 2,
                width: radius * 1.05,
                height: barHeight
            )
            context.fill(Path(barRect), with: .color(blue))

            let notchRect = CGRect(
                x: center.x + innerRadius * 0.1,
                y: center.y - barHeight,
                width: radius,
                height: barHeight / 2
            )
            context.blendMode = .destinationOut
            context.fill(Path(notchRect), with: .color(.black))
            context.blendMode = .normal

            context.blendMode = .destinationOut
            context.fill(
                Path(ellipseIn: CGRect(
                    x: center.x - innerRadius,
                    y: center.y - innerRadius,
                    width: innerRadius * 2,
                    height: innerRadius * 2
                )),
                with: .color(.black)
            )
            context.blendMode = .normal
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}