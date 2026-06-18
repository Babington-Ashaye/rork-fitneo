import SwiftUI

struct SignInView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false

    @State private var isLoading = false
    @State private var emailError: String?
    @State private var passwordError: String?
    @State private var generalError: String?

    @State private var showForgotAlert = false
    @State private var forgotEmail = ""
    @State private var showResetSent = false

    private let service = SupabaseService.shared
    var onAuthSuccess: (Bool) -> Void

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 26) {
                    Color.clear.frame(height: 1)

                    VStack(spacing: 12) {
                        ZStack {
                            Circle()
                                .fill(Theme.accent.opacity(0.18))
                                .frame(width: 88, height: 88)
                                .blur(radius: 22)
                            Image(systemName: "bolt.heart.fill")
                                .font(.system(size: 42, weight: .bold))
                                .foregroundStyle(Theme.accent)
                                .shadow(color: Theme.accent.opacity(0.5), radius: 14)
                        }
                        Text("FITNEO")
                            .font(.system(size: 34, weight: .black, design: .rounded))
                            .tracking(6)
                            .foregroundStyle(.white)
                    }
                    .padding(.top, 40)

                    Text("Welcome Back")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 4)

                    VStack(spacing: 16) {
                        // Email
                        TextField("Email Address", text: $email)
                            .keyboardType(.emailAddress)
                            .textContentType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .foregroundStyle(.white)
                            .tint(Theme.accent)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 14)
                            .background(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .fill(Color.white.opacity(0.05))
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .stroke(Color.white.opacity(0.12), lineWidth: 1)
                            )
                        if let err = emailError {
                            errorText(err)
                        }

                        // Password with eye toggle
                        ZStack(alignment: .trailing) {
                            if showPassword {
                                TextField("Password", text: $password)
                                    .foregroundStyle(.white)
                            } else {
                                SecureField("Password", text: $password)
                                    .foregroundStyle(.white)
                            }
                            Button {
                                showPassword.toggle()
                            } label: {
                                Image(systemName: showPassword ? "eye.fill" : "eye.slash.fill")
                                    .font(.system(size: 16))
                                    .foregroundStyle(Theme.textTertiary)
                                    .frame(width: 40, height: 40)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 14)
                        .background(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .fill(Color.white.opacity(0.05))
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .stroke(Color.white.opacity(0.12), lineWidth: 1)
                        )

                        // Forgot Password
                        HStack {
                            Spacer()
                            Button {
                                forgotEmail = email
                                showForgotAlert = true
                            } label: {
                                Text("Forgot Password?")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundStyle(Theme.accent)
                            }
                            .buttonStyle(.plain)
                        }

                        if let err = passwordError {
                            errorText(err)
                        }
                        if let err = generalError {
                            errorText(err)
                        }

                        // Sign In button
                        Button {
                            Task { await submit() }
                        } label: {
                            HStack {
                                if isLoading {
                                    ProgressView().tint(.white)
                                } else {
                                    Text("Sign In")
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
                        .disabled(isLoading)

                        // Divider
                        HStack(spacing: 12) {
                            Rectangle().fill(Color.white.opacity(0.1)).frame(height: 1)
                            Text("or").font(.caption).foregroundStyle(Theme.textTertiary)
                            Rectangle().fill(Color.white.opacity(0.1)).frame(height: 1)
                        }
                        .padding(.vertical, 4)

                        // Google button
                        Button {
                            Task { await signInWithGoogle() }
                        } label: {
                            HStack(spacing: 10) {
                                GoogleGLogo(size: 20)
                                    .frame(width: 20, height: 20)
                                Text("Continue with Google")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundStyle(Color(red: 0.20, green: 0.20, blue: 0.20))
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                            .background(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .fill(Color.white)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .stroke(Color.black.opacity(0.06), lineWidth: 1)
                            )
                        }
                        .disabled(isLoading)

                        // Sign Up link
                        HStack(spacing: 4) {
                            Text("Don't have an account?")
                                .font(.footnote)
                                .foregroundStyle(Theme.textTertiary)
                            Button {
                                dismiss()
                                NotificationCenter.default.post(name: .showSignUp, object: nil)
                            } label: {
                                Text("Sign Up")
                                    .font(.footnote.weight(.semibold))
                                    .foregroundStyle(Theme.accent)
                            }
                        }
                        .padding(.top, 4)
                    }
                    .frame(maxWidth: min(UIScreen.main.bounds.width - 48, 400))

                    Spacer(minLength: 40)
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 32)
            }
            .scrollDismissesKeyboard(.interactively)
            .scrollIndicators(.hidden)
        }
        .preferredColorScheme(.dark)
        .toolbarVisibility(.hidden, for: .navigationBar)
        .alert("Reset Password", isPresented: $showForgotAlert) {
            TextField("Email address", text: $forgotEmail)
                .keyboardType(.emailAddress)
            Button("Send Reset Link") {
                Task { await resetPassword() }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Enter your email to receive a reset link.")
        }
        .alert("Check Your Email", isPresented: $showResetSent) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("If an account exists for that email, a reset link has been sent.")
        }
    }

    // MARK: - Submit

    private func submit() async {
        clearErrors()
        guard validate() else { return }

        isLoading = true
        defer { isLoading = false }

        do {
            let profile = try await service.signIn(email: email, password: password)
            let needsOnboarding = !(UserDefaults.standard.bool(forKey: "hasCompletedOnboarding"))
            await MainActor.run {
                onAuthSuccess(needsOnboarding)
            }
        } catch {
            generalError = "Incorrect email or password. Please try again."
        }
    }

    private func signInWithGoogle() async {
        clearErrors()
        isLoading = true
        defer { isLoading = false }

        do {
            let profile = try await service.signInWithGoogle()
            let needsOnboarding = !(UserDefaults.standard.bool(forKey: "hasCompletedOnboarding"))
            await MainActor.run {
                onAuthSuccess(needsOnboarding)
            }
        } catch {
            generalError = "Google sign-in failed. Please try again."
        }
    }

    private func resetPassword() async {
        do {
            try await service.resetPassword(email: forgotEmail)
            showResetSent = true
        } catch {
            generalError = "Failed to send reset link. Please try again."
        }
    }

    // MARK: - Validation

    private func validate() -> Bool {
        var valid = true
        if email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            emailError = "Please enter your email"
            valid = false
        }
        if password.isEmpty {
            passwordError = "Please enter your password"
            valid = false
        }
        return valid
    }

    private func clearErrors() {
        emailError = nil
        passwordError = nil
        generalError = nil
    }

    private func errorText(_ message: String) -> some View {
        Text(message)
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(Theme.danger)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 4)
    }
}

extension Notification.Name {
    static let showSignUp = Notification.Name("showSignUp")
}
