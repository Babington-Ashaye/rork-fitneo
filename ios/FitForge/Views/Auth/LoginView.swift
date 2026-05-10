import SwiftUI
import AuthenticationServices

struct LoginView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var isSignUp = false
    @Bindable var viewModel: AuthViewModel
    var onAuthSuccess: () -> Void

    var body: some View {
        ZStack {
            Color(.systemBackground)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                VStack(spacing: 12) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 64))
                        .foregroundStyle(.linearGradient(colors: [.orange, .red], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .padding(.top, 60)

                    Text("FitForge")
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                        .foregroundStyle(.primary)

                    Text("Forge your best self")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                }
                .padding(.bottom, 40)

                // Form
                VStack(spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Email")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundStyle(.secondary)

                        TextField("you@example.com", text: $email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .padding()
                            .background(Color(.secondarySystemBackground))
                            .clipShape(.rect(cornerRadius: 12))
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Password")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundStyle(.secondary)

                        SecureField("Enter password", text: $password)
                            .textContentType(isSignUp ? .newPassword : .password)
                            .padding()
                            .background(Color(.secondarySystemBackground))
                            .clipShape(.rect(cornerRadius: 12))
                    }

                    if let error = viewModel.errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                            .multilineTextAlignment(.center)
                    }

                    Button {
                        Task {
                            if isSignUp {
                                await viewModel.signUp(email: email, password: password)
                            } else {
                                await viewModel.signIn(email: email, password: password)
                            }
                            if viewModel.isAuthenticated {
                                onAuthSuccess()
                            }
                        }
                    } label: {
                        HStack {
                            if viewModel.isLoading {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text(isSignUp ? "Create Account" : "Sign In")
                                    .font(.headline)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(
                            LinearGradient(colors: [.orange, .red], startPoint: .leading, endPoint: .trailing)
                        )
                        .foregroundStyle(.white)
                        .clipShape(.rect(cornerRadius: 16))
                    }
                    .disabled(email.isEmpty || password.count < 6 || viewModel.isLoading)
                    .opacity(email.isEmpty || password.count < 6 ? 0.6 : 1)

                    // Divider
                    HStack {
                        Rectangle()
                            .fill(Color(.separator))
                            .frame(height: 1)
                        Text("or")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Rectangle()
                            .fill(Color(.separator))
                            .frame(height: 1)
                    }
                    .padding(.vertical, 8)

                    // Social Sign-In Buttons
                    VStack(spacing: 12) {
                        SignInWithAppleButton { request in
                            request.requestedScopes = [.email, .fullName]
                        } onCompletion: { result in
                            handleAppleSignIn(result: result)
                        }
                        .frame(height: 50)
                        .clipShape(.rect(cornerRadius: 12))

                        Button {
                            Task {
                                await viewModel.signInWithGoogle()
                                if viewModel.isAuthenticated {
                                    onAuthSuccess()
                                }
                            }
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: "g.circle.fill")
                                    .font(.title2)
                                    .foregroundStyle(.red)
                                Text("Continue with Google")
                                    .font(.headline)
                                    .foregroundStyle(.primary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(.secondarySystemBackground))
                            .clipShape(.rect(cornerRadius: 12))
                        }
                        .disabled(viewModel.isLoading)
                    }

                    Button {
                        withAnimation {
                            isSignUp.toggle()
                            viewModel.errorMessage = nil
                        }
                    } label: {
                        Text(isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up")
                            .font(.subheadline)
                            .foregroundStyle(.orange)
                    }
                }
                .padding(.horizontal, 24)

                Spacer()
            }
        }
    }

    private func handleAppleSignIn(result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let authorization):
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let idToken = credential.identityToken.flatMap({ String(data: $0, encoding: .utf8) }) else {
                viewModel.errorMessage = "Unable to retrieve Apple credentials"
                return
            }

            let fullName = credential.fullName?.formatted()

            Task {
                await viewModel.signInWithApple(idToken: idToken, fullName: fullName)
                if viewModel.isAuthenticated {
                    onAuthSuccess()
                }
            }

        case .failure(let error):
            viewModel.errorMessage = "Apple Sign-In failed: \(error.localizedDescription)"
        }
    }
}
