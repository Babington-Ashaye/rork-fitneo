import SwiftUI

struct SignUpView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var fullName = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""

    @State private var isLoading = false
    @State private var nameError: String?
    @State private var emailError: String?
    @State private var passwordError: String?
    @State private var confirmError: String?
    @State private var generalError: String?
    @State private var showTermsSheet = false
    @State private var showPrivacySheet = false

    private let service = SupabaseService.shared
    var onAuthSuccess: (Bool) -> Void   // true = needs onboarding, false = go home

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 26) {
                    Color.clear.frame(height: 1)

                    // Logo
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

                    Text("Create Your Account")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 4)

                    // Fields
                    VStack(spacing: 16) {
                        authField(
                            placeholder: "Full Name",
                            text: $fullName,
                            keyboardType: .default,
                            contentType: .name
                        )
                        .textInputAutocapitalization(.words)
                        if let err = nameError {
                            errorText(err)
                        }

                        authField(
                            placeholder: "Email Address",
                            text: $email,
                            keyboardType: .emailAddress,
                            contentType: .emailAddress
                        )
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        if let err = emailError {
                            errorText(err)
                        }

                        SecureField("Password", text: $password)
                            .textContentType(.newPassword)
                            .foregroundStyle(.white)
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
                        if let err = passwordError {
                            errorText(err)
                        }

                        SecureField("Confirm Password", text: $confirmPassword)
                            .foregroundStyle(.white)
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
                        if let err = confirmError {
                            errorText(err)
                        }

                        if let err = generalError {
                            errorText(err)
                        }

                        // Create Account button
                        Button {
                            Task { await submit() }
                        } label: {
                            HStack {
                                if isLoading {
                                    ProgressView().tint(.white)
                                } else {
                                    Text("Create Account")
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

                        // Legal consent
                        legalConsentText
                            .padding(.horizontal, 4)

                        // Sign In link
                        HStack(spacing: 4) {
                            Text("Already have an account?")
                                .font(.footnote)
                                .foregroundStyle(Theme.textTertiary)
                            Button {
                                dismiss()
                                NotificationCenter.default.post(name: .showSignIn, object: nil)
                            } label: {
                                Text("Sign In")
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
        .sheet(isPresented: $showTermsSheet) {
            LegalPolicySheet(title: "Consumer Terms & Usage Policy", content: termsText)
        }
        .sheet(isPresented: $showPrivacySheet) {
            LegalPolicySheet(title: "Privacy Policy", content: privacyText)
        }
    }

    // MARK: - Submit

    private func submit() async {
        clearErrors()
        guard validate() else { return }

        isLoading = true
        defer { isLoading = false }

        do {
            let profile = try await service.signUp(email: email, password: password, displayName: fullName)
            UserDefaults.standard.set(false, forKey: "hasCompletedOnboarding")
            await MainActor.run {
                onAuthSuccess(true)   // needs onboarding
            }
        } catch let error as AuthError {
            if case .emailAlreadyExists = error {
                emailError = "An account with this email already exists. Sign in instead."
            } else {
                generalError = error.localizedDescription
            }
        } catch {
            // Shows the REAL error instead of the generic message — for debugging
            generalError = error.localizedDescription
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

    // MARK: - Validation

    private func validate() -> Bool {
        var valid = true

        if fullName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            nameError = "Please enter your full name"
            valid = false
        }

        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedEmail.contains("@") {
            emailError = "Please enter a valid email"
            valid = false
        }

        if password.count < 6 {
            passwordError = "Password must be at least 6 characters"
            valid = false
        }

        if password != confirmPassword {
            confirmError = "Passwords do not match"
            valid = false
        }

        return valid
    }

    private func clearErrors() {
        nameError = nil
        emailError = nil
        passwordError = nil
        confirmError = nil
        generalError = nil
    }

    // MARK: - Helpers

    private func authField(placeholder: String, text: Binding<String>, keyboardType: UIKeyboardType, contentType: UITextContentType?) -> some View {
        TextField(placeholder, text: text)
            .keyboardType(keyboardType)
            .textContentType(contentType)
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
    }

    private func errorText(_ message: String) -> some View {
        Text(message)
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(Theme.danger)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 4)
    }

    // MARK: - Legal consent

    private var legalConsentText: some View {
        VStack(spacing: 2) {
            Text(consentPrefix)
                .font(.system(size: 11))
                .foregroundStyle(Theme.textTertiary)
            HStack(spacing: 0) {
                Button {
                    showTermsSheet = true
                } label: {
                    Text("Consumer Terms & Usage Policy")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(Theme.accent)
                }
                .buttonStyle(.plain)
                Text(" and ")
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.textTertiary)
                Button {
                    showPrivacySheet = true
                } label: {
                    Text("Privacy Policy")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(Theme.accent)
                }
                .buttonStyle(.plain)
            }
            Text(consentSuffix)
                .font(.system(size: 11))
                .foregroundStyle(Theme.textTertiary)
                .multilineTextAlignment(.center)
        }
        .fixedSize(horizontal: false, vertical: true)
    }

    private var consentPrefix: String { "By continuing, you agree to FITNEO's" }
    private var consentSuffix: String { "and acknowledge our Privacy Policy. You understand that FITNEO's AI insights do not constitute medical or professional nutritional advice." }

    private let termsText = """
    FITNEO CONSUMER TERMS & USAGE POLICY

    Last Updated: June 2026

    1. ACCEPTANCE OF TERMS
    By accessing or using FITNEO, you agree to be bound by these Terms. If you do not agree, do not use the app.

    2. DESCRIPTION OF SERVICE
    FITNEO provides AI-powered fitness coaching, workout planning, nutrition tracking, and related services. The app is for informational and motivational purposes only.

    3. MEDICAL DISCLAIMER
    FITNEO is not a medical device or healthcare provider. The AI-generated insights, workout recommendations, and nutritional estimates do not constitute professional medical advice. Always consult a qualified healthcare professional before beginning any fitness regimen or making dietary changes.

    4. USER RESPONSIBILITIES
    You are responsible for your own health and safety. Listen to your body. Stop exercising immediately if you experience pain, dizziness, or discomfort.

    5. DATA & PRIVACY
    Your personal data is handled in accordance with our Privacy Policy. We use Supabase for secure data storage and Google Gemini for AI features.

    6. SUBSCRIPTION & PAYMENTS
    FITNEO offers optional subscription plans. Free trials convert to paid subscriptions unless cancelled. All payments are processed through the App Store.

    7. LIMITATION OF LIABILITY
    FITNEO and its creators shall not be liable for any injuries, damages, or losses resulting from the use of the app.
    """

    private let privacyText = """
    FITNEO PRIVACY POLICY

    Last Updated: June 2026

    1. INFORMATION WE COLLECT
    - Account information: email address, name (when you sign up)
    - Fitness data: workout history, nutrition logs, weight entries, fitness goals
    - Usage data: app interaction analytics to improve the service

    2. HOW WE USE YOUR DATA
    - To personalize your fitness coaching experience
    - To generate AI-powered workout plans and nutrition insights
    - To display your progress, streaks, and leaderboard rankings
    - To improve FITNEO's AI models and features

    3. DATA STORAGE
    Your data is stored securely on Supabase with Row Level Security (RLS) enabled. Only you can access your own data.

    4. THIRD-PARTY SERVICES
    - Supabase: database and authentication
    - Google Gemini: AI coaching and meal analysis
    - Open Food Facts: barcode nutrition lookup
    These services process data according to their own privacy policies.

    5. YOUR RIGHTS
    You can request deletion of your data at any time by contacting us. You can also delete your account from within the app settings.

    6. CONTACT
    For privacy-related inquiries, contact us through the app's support channel.
    """
}

// MARK: - Notification names

extension Notification.Name {
    static let showSignIn = Notification.Name("showSignIn")
}