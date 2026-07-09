import Foundation

/// Handles barcode scanning via Open Food Facts and AI vision meal analysis via Gemini.
@MainActor
final class FoodAPIService: Sendable {
    static let shared = FoodAPIService()

    private let session: URLSession

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        config.httpAdditionalHeaders = ["User-Agent": AppConfig.openFoodFactsUserAgent]
        self.session = URLSession(configuration: config)
    }

    // MARK: - Barcode scanning (Open Food Facts)

    /// Fetches nutritional info for a barcode from Open Food Facts.
    /// Returns nil if the product is not found or has no nutrition data.
    func fetchByBarcode(_ barcode: String) async -> NutritionResult? {
        let urlStr = "\(AppConfig.openFoodFactsBaseURL)/\(barcode).json"
        guard let url = URL(string: urlStr) else { return nil }

        do {
            let (data, response) = try await session.data(from: url)
            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode) else { return nil }

            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let product = json["product"] as? [String: Any],
                  let nutriments = product["nutriments"] as? [String: Any] else { return nil }

            let foodName = (product["product_name"] as? String) ?? "Unknown Food"
            let calories = (nutriments["energy-kcal_100g"] as? Double)
                ?? (nutriments["energy-kcal"] as? Double)
                ?? (nutriments["energy-kcal_serving"] as? Double)
                ?? 0
            let protein = (nutriments["proteins_100g"] as? Double)
                ?? (nutriments["proteins"] as? Double)
                ?? (nutriments["proteins_serving"] as? Double)
                ?? 0
            let carbs = (nutriments["carbohydrates_100g"] as? Double)
                ?? (nutriments["carbohydrates"] as? Double)
                ?? (nutriments["carbohydrates_serving"] as? Double)
                ?? 0
            let fat = (nutriments["fat_100g"] as? Double)
                ?? (nutriments["fat"] as? Double)
                ?? (nutriments["fat_serving"] as? Double)
                ?? 0

            guard calories > 0 else { return nil }

            let uid = SupabaseService.shared.userId?.uuidString ?? "unknown"
            return NutritionResult(
                source: .barcode,
                foodName: foodName,
                totalCalories: calories,
                totalProtein: protein,
                totalCarbs: carbs,
                totalFat: fat,
                components: nil,
                userId: uid
            )
        } catch {
            return nil
        }
    }

    // MARK: - AI Vision food scanner

    /// Sends a meal photo to Gemini for multi-component analysis.
    func analyzeMealPhoto(base64Image: String) async -> MealScanResponse? {
        let prompt = """
        You are a professional nutritionist AI. Analyze this photo of a cooked meal. \
        Identify each distinct food component separately, for example rice, chicken, soup, stew, vegetables, or swallow. \
        For each component estimate: the item name, weight in grams, calories, protein in grams, carbs in grams, and fat in grams. \
        Then provide a grand total row that sums all components. \
        Return ONLY a valid JSON object in this exact format with no markdown, no explanation, and no extra text: \
        { "components": [{ "name": "...", "weight_g": 0, "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0 }], \
        "totals": { "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0 } }
        """

        let response = await GeminiService.shared.analyzeImage(
            base64ImageString: base64Image,
            prompt: prompt
        )

        guard !response.isEmpty,
              let json = extractJSON(from: response),
              let data = json.data(using: .utf8) else { return nil }

        return try? JSONDecoder().decode(MealScanResponse.self, from: data)
    }

    // MARK: - Helpers

    private func extractJSON(from content: String) -> String? {
        guard let start = content.firstIndex(of: "{"),
              let end = content.lastIndex(of: "}") else { return nil }
        return String(content[start...end])
    }
}
