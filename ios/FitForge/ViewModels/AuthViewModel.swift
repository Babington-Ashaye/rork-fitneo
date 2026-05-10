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
            errorMessage = "Google sign-in failed. Please try again."
        }
        isLoading = false
    }

    func signOut() async {
        do {
            try await service.signOut()
            isAuthenticated = false
            currentUser = nil
        } catch {
            errorMessage = "Failed to sign out."
        }
    }

    func restoreSession() async {
        do {
            let user = try await service.restoreSession()
            if let user {
                currentUser = user
                isAuthenticated = true
            }
        } catch {
            isAuthenticated = false
            currentUser = nil
        }
    }
}
