import Foundation

/// Centralised credentials for FITNEO services.
enum AppConfig {
    static let supabaseURL = "https://sokjybielakrristebam.supabase.co"
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNva2p5YmllbGFrcnJpc3RlYmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNjc0NjQsImV4cCI6MjA5MzY0MzQ2NH0.qjWolwo-MXw4YSET1iZZxu6RpS8AcfUViqWxdYDds08"
    static let supabaseAuthCallbackURL = "https://sokjybielakrristebam.supabase.co/auth/v1/callback"

    static let geminiAPIKey = "AIzaSyAb8RN6LQrDIL3lUXnNJEmOOwVfwypRsCr6BLwOx3VgRlvYYsuw"
    static let geminiModel = "gemini-1.5-flash"
    static let geminiBaseURL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash"

    static let googleIOSClientID = "750062892332-jsghf2s9kd13uccuinl5qskenv9gb6a3.apps.googleusercontent.com"
    static let googleWebClientID = "750062892332-o6c4fnpigamfekiahjp3a7lmo8rk8cle.apps.googleusercontent.com"

    static let openFoodFactsBaseURL = "https://world.openfoodfacts.org/api/v3/product"
    static let openFoodFactsUserAgent = "FITNEOApp - iOS - Version 1.0"
}