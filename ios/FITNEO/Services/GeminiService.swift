import Foundation

/// Direct Gemini API integration for FITNEO AI features.
/// Uses the AIza. key format with the key in the URL query string.
/// Supports single-shot, streaming, and vision analysis.
@MainActor
final class GeminiService: Sendable {
    static let shared = GeminiService()

    private let session: URLSession

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 60
        config.timeoutIntervalForResource = 120
        self.session = URLSession(configuration: config)
    }

    // MARK: - URL builders

    private var generateContentURL: URL {
        URL(string: "\(AppConfig.geminiBaseURL):generateContent?key=\(AppConfig.geminiAPIKey)")!
    }

    private var streamGenerateContentURL: URL {
        URL(string: "\(AppConfig.geminiBaseURL):streamGenerateContent?alt=sse&key=\(AppConfig.geminiAPIKey)")!
    }

    // MARK: - Text generation (single-shot)

    func generateText(prompt: String, systemPrompt: String) async -> String {
        let body = buildRequestBody(prompt: prompt, systemPrompt: systemPrompt)
        guard let responseJSON = await sendRequest(url: generateContentURL, body: body) else { return "" }
        return extractText(from: responseJSON)
    }

    func generateTextWithHistory(messages: [[String: Any]], systemPrompt: String) async -> String {
        let body: [String: Any] = [
            "systemInstruction": ["parts": [["text": systemPrompt]]],
            "contents": messages
        ]
        guard let responseJSON = await sendRequest(url: generateContentURL, body: body) else { return "" }
        return extractText(from: responseJSON)
    }

    // MARK: - Streaming text generation

    func generateTextStream(prompt: String, systemPrompt: String) -> AsyncThrowingStream<String, Error> {
        streamWithBody(buildRequestBody(prompt: prompt, systemPrompt: systemPrompt))
    }

    func generateTextStreamWithHistory(messages: [[String: Any]], systemPrompt: String) -> AsyncThrowingStream<String, Error> {
        let body: [String: Any] = [
            "systemInstruction": ["parts": [["text": systemPrompt]]],
            "contents": messages
        ]
        return streamWithBody(body)
    }

    private func streamWithBody(_ body: [String: Any]) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            Task {
                var request = URLRequest(url: streamGenerateContentURL)
                request.httpMethod = "POST"
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.timeoutInterval = 120
                do { request.httpBody = try JSONSerialization.data(withJSONObject: body, options: []) }
                catch { continuation.finish(throwing: error); return }

                do {
                    let (bytes, response) = try await session.bytes(for: request)
                    guard let httpResponse = response as? HTTPURLResponse,
                          (200...299).contains(httpResponse.statusCode) else {
                        continuation.finish(throwing: StreamError.httpError); return
                    }
                    var buffer = ""
                    for try await line in bytes.lines {
                        guard !Task.isCancelled else { continuation.finish(); return }
                        if line.hasPrefix("data: ") {
                            let jsonStr = String(line.dropFirst(6))
                            if jsonStr == "[DONE]" { continue }
                            buffer += jsonStr
                            while let closingBrace = buffer.firstIndex(of: "}") {
                                let candidate = String(buffer[...closingBrace])
                                buffer = String(buffer[buffer.index(after: closingBrace)...]).trimmingCharacters(in: .whitespacesAndNewlines)
                                if let json = try? JSONSerialization.jsonObject(with: Data(candidate.utf8)) as? [String: Any] {
                                    let text = extractText(from: json)
                                    if !text.isEmpty { continuation.yield(text) }
                                }
                            }
                        }
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }

    // MARK: - Vision analysis

    func analyzeImage(base64ImageString: String, prompt: String) async -> String {
        let body: [String: Any] = [
            "contents": [
                ["role": "user", "parts": [
                    ["inlineData": ["mimeType": "image/jpeg", "data": base64ImageString]],
                    ["text": prompt]
                ]]
            ]
        ]
        guard let responseJSON = await sendRequest(url: generateContentURL, body: body) else { return "" }
        return extractText(from: responseJSON)
    }

    // MARK: - Short motivational message

    func generateMotivation() async -> String {
        let prompt = "Give one short powerful motivational fitness message in 20 words or less. Return only the message text, no quotes, no explanation."
        let body: [String: Any] = ["contents": [["role": "user", "parts": [["text": prompt]]]]]
        guard let responseJSON = await sendRequest(url: generateContentURL, body: body) else { return "" }
        return extractText(from: responseJSON).trimmingCharacters(in: CharacterSet(charactersIn: "\""))
    }

    // MARK: - Private helpers

    private func buildRequestBody(prompt: String, systemPrompt: String) -> [String: Any] {
        [
            "systemInstruction": ["parts": [["text": systemPrompt]]],
            "contents": [["role": "user", "parts": [["text": prompt]]]]
        ]
    }

    private func sendRequest(url: URL, body: [String: Any]) async -> [String: Any]? {
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 120
        do { request.httpBody = try JSONSerialization.data(withJSONObject: body, options: []) }
        catch { return ["__error__": "Failed to encode body: \(error.localizedDescription)"] }

        do {
            let (data, response) = try await session.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse else {
                return ["__error__": "Non-HTTP response"]
            }
            guard (200...299).contains(httpResponse.statusCode) else {
                let errorString = String(data: data, encoding: .utf8) ?? "no error body"
                return ["__error__": "HTTP \(httpResponse.statusCode): \(errorString)"]
            }
            return try JSONSerialization.jsonObject(with: data) as? [String: Any]
        } catch {
            return ["__error__": "Request failed: \(error.localizedDescription)"]
        }
    }

    private func extractText(from json: [String: Any]) -> String {
        if let error = json["__error__"] as? String { return "" }
        guard let candidates = json["candidates"] as? [[String: Any]],
              let first = candidates.first,
              let content = first["content"] as? [String: Any],
              let parts = content["parts"] as? [[String: Any]],
              let text = parts.first?["text"] as? String else { return "" }
        return text
    }

    enum StreamError: Error {
        case invalidURL
        case httpError
    }
}
