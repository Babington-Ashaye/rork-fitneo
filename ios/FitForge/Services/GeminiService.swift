import Foundation

/// Direct Gemini API integration for FITNEO AI features.
/// Uses gemini-1.5-flash for text generation and vision analysis.
@MainActor
final class GeminiService: Sendable {
    static let shared = GeminiService()

    private let endpoint: String
    private let session: URLSession

    private init() {
        let key = AppConfig.geminiAPIKey
        self.endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\(key)"
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 60
        config.timeoutIntervalForResource = 90
        self.session = URLSession(configuration: config)
    }

    // MARK: - Text generation

    /// Sends a prompt with a system instruction to Gemini and returns the response text.
    /// Returns an empty string on failure (caller should fall back to local logic).
    func generateText(prompt: String, systemPrompt: String) async -> String {
        let body: [String: Any] = [
            "systemInstruction": [
                "parts": [["text": systemPrompt]]
            ],
            "contents": [
                [
                    "role": "user",
                    "parts": [["text": prompt]]
                ]
            ]
        ]

        guard let responseJSON = await sendRequest(body: body) else { return "" }

        return extractText(from: responseJSON)
    }

    // MARK: - Vision analysis

    /// Analyses a base64-encoded JPEG image with the given prompt.
    /// Returns an empty string on failure.
    func analyzeImage(base64ImageString: String, prompt: String) async -> String {
        let body: [String: Any] = [
            "contents": [
                [
                    "role": "user",
                    "parts": [
                        [
                            "inlineData": [
                                "mimeType": "image/jpeg",
                                "data": base64ImageString
                            ]
                        ],
                        ["text": prompt]
                    ]
                ]
            ]
        ]

        guard let responseJSON = await sendRequest(body: body) else { return "" }

        return extractText(from: responseJSON)
    }

    // MARK: - Private helpers

    private func sendRequest(body: [String: Any]) async -> [String: Any]? {
        guard let url = URL(string: endpoint) else {
            print("[GeminiService] Invalid endpoint URL")
            return nil
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
        } catch {
            print("[GeminiService] Failed to encode request body: \(error)")
            return nil
        }

        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                print("[GeminiService] Non-HTTP response")
                return nil
            }

            guard (200...299).contains(httpResponse.statusCode) else {
                if let errorString = String(data: data, encoding: .utf8) {
                    print("[GeminiService] HTTP \(httpResponse.statusCode): \(errorString)")
                }
                return nil
            }

            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            return json
        } catch {
            print("[GeminiService] Request failed: \(error)")
            return nil
        }
    }

    private func extractText(from json: [String: Any]) -> String {
        guard let candidates = json["candidates"] as? [[String: Any]],
              let first = candidates.first,
              let content = first["content"] as? [String: Any],
              let parts = content["parts"] as? [[String: Any]],
              let text = parts.first?["text"] as? String else {
            print("[GeminiService] Unexpected response format: \(json)")
            return ""
        }
        return text
    }
}
