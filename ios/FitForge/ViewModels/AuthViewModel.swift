import SwiftUI

@Observable
@MainActor
final class AuthViewModel {
    var isLoading = false
    var errorMessage: String?
    var isAuthenticated = false
    var currentUser: UserProfile?

    private let service = SupabaseService.shared

    func signUp(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        do {
            let user = try await service.signUp(email: email, password: password)
            currentUser = user
            isAuthenticated = true
        } catch let error as AuthError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Something went wrong. Please try again."
        }
        isLoading = false
    }

    func signIn(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        do {
            let user = try await service.signIn(email: email, password: password)
            currentUser = user
            isAuthenticated = true
        } catch let error as AuthError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Something went wrong. Please try again."
        }
        isLoading = false
    }

    func signInWithApple(idToken: String, fullName: String?) async {
        isLoading = true
        errorMessage = nil
        do {
            let user = try await service.signInWithApple(idToken: idToken, fullName: fullName)
            currentUser = user
            isAuthenticated = true
        } catch let error as AuthError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Apple Sign-In failed. Please try again."
        }
        isLoading = false
    }

    func signInWithGoogle() async {
        isLoading = true
        errorMessage = nil
        do {
            let user = try await service.signInWithGoogle()
            currentUser = user
            isAuthenticated = true
        } catch let error as AuthError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Google Sign-In failed. Please try again."
        }
        isLoading = false
    }

    func signOut() async {
        do {
            try await service.signOut()
            isAuthenticated = false
            currentUser = nil
        } catch {
            errorMessage = "Failed to sign out"
        }
    }

    func restoreSession() async {
        isLoading = true
        errorMessage = nil
        do {
            let user = try await service.restoreSession()
            if let user {
                currentUser = user
                isAuthenticated = true
            }
        } catch {
            // No active session, user needs to sign in
            isAuthenticated = false
            currentUser = nil
        }
        isLoading = false
    }

    func checkAuthStatus() {
        isAuthenticated = service.isAuthenticated
    }
}
