import Foundation

/// Centralised credentials for FITNEO services.
/// Never reference these constants directly from other files —
/// always go through the service layer (SupabaseManager, GeminiService).
enum AppConfig {
    static let supabaseURL = "https://sokjybielakrristebam.supabase.co"
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNva2p5YmllbGFrcnJpc3RlYmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNjc0NjQsImV4cCI6MjA5MzY0MzQ2NH0.qjWolwo-MXw4YSET1iZZxu6RpS8AcfUViqWxdYDds08"
    static let geminiAPIKey = "AIzaSyCTADgdmyViI1OiVEO06Yg6-2knhjuctlA"
}
