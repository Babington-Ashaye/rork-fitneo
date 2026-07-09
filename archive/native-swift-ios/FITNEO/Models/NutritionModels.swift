import Foundation

// MARK: - Scan source

enum ScanSource: String, Codable, Sendable {
    case barcode
    case aiVision
}

// MARK: - Food component (from AI vision)

struct FoodComponent: Codable, Sendable, Identifiable {
    var id: String { name }
    let name: String
    let weightGrams: Double
    let calories: Double
    let protein: Double
    let carbs: Double
    let fat: Double

    enum CodingKeys: String, CodingKey {
        case name, weightGrams = "weight_g", calories, proteinGrams = "protein_g", carbsGrams = "carbs_g", fatGrams = "fat_g"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        name = try container.decode(String.self, forKey: .name)
        weightGrams = try container.decode(Double.self, forKey: .weightGrams)
        calories = try container.decode(Double.self, forKey: .calories)
        protein = try container.decode(Double.self, forKey: .proteinGrams)
        carbs = try container.decode(Double.self, forKey: .carbsGrams)
        fat = try container.decode(Double.self, forKey: .fatGrams)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(name, forKey: .name)
        try container.encode(weightGrams, forKey: .weightGrams)
        try container.encode(calories, forKey: .calories)
        try container.encode(protein, forKey: .proteinGrams)
        try container.encode(carbs, forKey: .carbsGrams)
        try container.encode(fat, forKey: .fatGrams)
    }

    init(name: String, weightGrams: Double, calories: Double, protein: Double, carbs: Double, fat: Double) {
        self.name = name
        self.weightGrams = weightGrams
        self.calories = calories
        self.protein = protein
        self.carbs = carbs
        self.fat = fat
    }
}

// MARK: - Nutrition totals

struct NutritionTotalsData: Codable, Sendable {
    let calories: Double
    let protein: Double
    let carbs: Double
    let fat: Double

    enum CodingKeys: String, CodingKey {
        case calories, proteinGrams = "protein_g", carbsGrams = "carbs_g", fatGrams = "fat_g"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        calories = try container.decode(Double.self, forKey: .calories)
        protein = try container.decode(Double.self, forKey: .proteinGrams)
        carbs = try container.decode(Double.self, forKey: .carbsGrams)
        fat = try container.decode(Double.self, forKey: .fatGrams)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(calories, forKey: .calories)
        try container.encode(protein, forKey: .proteinGrams)
        try container.encode(carbs, forKey: .carbsGrams)
        try container.encode(fat, forKey: .fatGrams)
    }

    init(calories: Double, protein: Double, carbs: Double, fat: Double) {
        self.calories = calories
        self.protein = protein
        self.carbs = carbs
        self.fat = fat
    }
}

// MARK: - Nutrition result

struct NutritionResult: Identifiable, Codable, Sendable {
    let id: UUID
    let source: ScanSource
    let foodName: String
    let totalCalories: Double
    let totalProtein: Double
    let totalCarbs: Double
    let totalFat: Double
    let components: [FoodComponent]?
    let timestamp: Date
    let userId: String

    init(id: UUID = UUID(), source: ScanSource, foodName: String,
         totalCalories: Double, totalProtein: Double, totalCarbs: Double, totalFat: Double,
         components: [FoodComponent]? = nil, timestamp: Date = Date(), userId: String) {
        self.id = id
        self.source = source
        self.foodName = foodName
        self.totalCalories = totalCalories
        self.totalProtein = totalProtein
        self.totalCarbs = totalCarbs
        self.totalFat = totalFat
        self.components = components
        self.timestamp = timestamp
        self.userId = userId
    }
}

// MARK: - Meal scan response (from Gemini Vision)

struct MealScanResponse: Codable, Sendable {
    let components: [FoodComponent]
    let totals: NutritionTotalsData
}
