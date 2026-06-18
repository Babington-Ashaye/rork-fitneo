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

        let responseJSON = await sendRequest(body: body)
        guard let responseJSON = responseJSON else {
            return "DEBUG: sendRequest returned nil — check network or API key"
        }
        return extractText(from: responseJSON)
    }

    // MARK: - Vision analysis

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
            return ["__error__": "Invalid endpoint URL"]
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
        } catch {
            return ["__error__": "Failed to encode body: \(error.localizedDescription)"]
        }

        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                return ["__error__": "Non-HTTP response"]
            }

            guard (200...299).contains(httpResponse.statusCode) else {
                let errorString = String(data: data, encoding: .utf8) ?? "no error body"
                return ["__error__": "HTTP \(httpResponse.statusCode): \(errorString)"]
            }

            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            return json
        } catch {
            return ["__error__": "Request failed: \(error.localizedDescription)"]
        }
    }

    private func extractText(from json: [String: Any]) -> String {
        // Show real error in chat bubble for debugging
        if let error = json["__error__"] as? String {
            return "DEBUG: \(error)"
        }

        guard let candidates = json["candidates"] as? [[String: Any]],
              let first = candidates.first,
              let content = first["content"] as? [String: Any],
              let parts = content["parts"] as? [[String: Any]],
              let text = parts.first?["text"] as? String else {
            return "DEBUG: Unexpected response format: \(json)"
        }
        return text
    }
}