import Foundation

/// Local nutrition database (per-serving macros).
enum FoodLibrary {

    static let foods: [FoodItem] = [
        // PROTEINS
        f("chicken_breast", "Chicken Breast", "Protein", 165, 31, 0, 3.6, "100g"),
        f("ground_beef", "Ground Beef", "Protein", 250, 26, 0, 17, "100g"),
        f("salmon", "Salmon", "Protein", 208, 20, 0, 13, "100g"),
        f("tuna", "Tuna", "Protein", 132, 28, 0, 1, "100g"),
        f("eggs", "Eggs", "Protein", 78, 6, 0.6, 5, "1 large"),
        f("greek_yogurt", "Greek Yogurt", "Protein", 100, 17, 6, 0.7, "170g"),
        f("cottage_cheese", "Cottage Cheese", "Protein", 98, 11, 3.4, 4.3, "100g"),
        f("whey_protein", "Whey Protein", "Protein", 120, 24, 3, 1.5, "1 scoop"),
        f("tofu", "Tofu", "Protein", 144, 17, 3, 9, "100g"),
        f("tempeh", "Tempeh", "Protein", 192, 20, 8, 11, "100g"),
        f("shrimp", "Shrimp", "Protein", 99, 24, 0.2, 0.3, "100g"),
        f("turkey_breast", "Turkey Breast", "Protein", 135, 30, 0, 1, "100g"),
        f("tilapia", "Tilapia", "Protein", 128, 26, 0, 2.7, "100g"),
        f("sardines", "Sardines", "Protein", 208, 25, 0, 11, "100g"),

        // CARBS
        f("brown_rice", "Brown Rice", "Carbs", 216, 5, 45, 1.8, "1 cup"),
        f("white_rice", "White Rice", "Carbs", 205, 4, 45, 0.4, "1 cup"),
        f("oats", "Oats", "Carbs", 150, 5, 27, 3, "40g"),
        f("whole_wheat_bread", "Whole Wheat Bread", "Carbs", 80, 4, 14, 1, "1 slice"),
        f("sweet_potato", "Sweet Potato", "Carbs", 112, 2, 26, 0.1, "1 medium"),
        f("banana", "Banana", "Carbs", 105, 1.3, 27, 0.4, "1 medium"),
        f("apple", "Apple", "Carbs", 95, 0.5, 25, 0.3, "1 medium"),
        f("pasta", "Pasta", "Carbs", 220, 8, 43, 1.3, "1 cup"),
        f("quinoa", "Quinoa", "Carbs", 222, 8, 39, 3.6, "1 cup"),
        f("lentils", "Lentils", "Carbs", 230, 18, 40, 0.8, "1 cup"),
        f("black_beans", "Black Beans", "Carbs", 227, 15, 41, 0.9, "1 cup"),
        f("chickpeas", "Chickpeas", "Carbs", 269, 15, 45, 4, "1 cup"),
        f("corn", "Corn", "Carbs", 125, 5, 27, 2, "1 cup"),
        f("potato", "Potato", "Carbs", 161, 4, 37, 0.2, "1 medium"),

        // FATS
        f("avocado", "Avocado", "Fats", 234, 3, 12, 21, "1 whole"),
        f("almonds", "Almonds", "Fats", 164, 6, 6, 14, "28g"),
        f("peanut_butter", "Peanut Butter", "Fats", 188, 8, 6, 16, "2 tbsp"),
        f("olive_oil", "Olive Oil", "Fats", 119, 0, 0, 14, "1 tbsp"),
        f("walnuts", "Walnuts", "Fats", 185, 4, 4, 18, "28g"),
        f("chia_seeds", "Chia Seeds", "Fats", 138, 5, 12, 9, "28g"),
        f("flaxseed", "Flaxseed", "Fats", 150, 5, 8, 12, "28g"),
        f("cashews", "Cashews", "Fats", 157, 5, 9, 12, "28g"),
        f("sunflower_seeds", "Sunflower Seeds", "Fats", 165, 6, 6, 14, "28g"),

        // VEGETABLES
        f("broccoli", "Broccoli", "Vegetables", 55, 4, 11, 0.6, "1 cup"),
        f("spinach", "Spinach", "Vegetables", 23, 3, 3.6, 0.4, "100g"),
        f("kale", "Kale", "Vegetables", 33, 3, 6, 0.6, "1 cup"),
        f("lettuce", "Lettuce", "Vegetables", 15, 1, 3, 0.2, "100g"),
        f("cucumber", "Cucumber", "Vegetables", 16, 0.7, 4, 0.1, "1 cup"),
        f("tomato", "Tomato", "Vegetables", 22, 1, 5, 0.2, "1 medium"),
        f("carrots", "Carrots", "Vegetables", 50, 1, 12, 0.3, "1 cup"),
        f("bell_pepper", "Bell Pepper", "Vegetables", 31, 1, 7, 0.3, "1 medium"),
        f("zucchini", "Zucchini", "Vegetables", 33, 2, 6, 0.6, "1 cup"),
        f("mushrooms", "Mushrooms", "Vegetables", 21, 3, 3, 0.3, "1 cup"),
        f("cauliflower", "Cauliflower", "Vegetables", 27, 2, 5, 0.3, "1 cup"),
        f("asparagus", "Asparagus", "Vegetables", 27, 3, 5, 0.2, "1 cup"),

        // MEALS
        f("chicken_rice_bowl", "Chicken Rice Bowl", "Meals", 520, 42, 60, 12, "1 bowl"),
        f("oatmeal_banana", "Oatmeal with Banana", "Meals", 290, 8, 55, 5, "1 bowl"),
        f("protein_shake", "Protein Shake", "Meals", 250, 30, 20, 5, "1 shake"),
        f("scrambled_eggs_toast", "Scrambled Eggs & Toast", "Meals", 340, 20, 28, 16, "1 plate"),
        f("grilled_salmon_salad", "Grilled Salmon Salad", "Meals", 420, 34, 18, 24, "1 plate"),
        f("turkey_wrap", "Turkey Wrap", "Meals", 380, 28, 38, 12, "1 wrap"),
        f("greek_yogurt_parfait", "Greek Yogurt Parfait", "Meals", 280, 18, 42, 6, "1 cup"),
        f("tuna_sandwich", "Tuna Sandwich", "Meals", 360, 26, 38, 12, "1 sandwich"),

        // EXTRA STAPLES
        f("milk", "Milk", "Protein", 122, 8, 12, 5, "1 cup"),
        f("cheddar_cheese", "Cheddar Cheese", "Fats", 113, 7, 0.4, 9, "28g"),
        f("orange", "Orange", "Carbs", 62, 1, 15, 0.2, "1 medium"),
        f("blueberries", "Blueberries", "Carbs", 84, 1, 21, 0.5, "1 cup"),
        f("strawberries", "Strawberries", "Carbs", 49, 1, 12, 0.5, "1 cup"),
        f("rice_cakes", "Rice Cakes", "Carbs", 35, 0.7, 7, 0.3, "1 cake"),
        f("dark_chocolate", "Dark Chocolate", "Fats", 170, 2, 13, 12, "28g"),
        f("honey", "Honey", "Carbs", 64, 0, 17, 0, "1 tbsp"),
        f("granola", "Granola", "Carbs", 200, 5, 30, 7, "50g"),
        f("hummus", "Hummus", "Fats", 166, 8, 14, 10, "100g"),
        f("edamame", "Edamame", "Protein", 121, 12, 9, 5, "100g"),
        f("pork_chop", "Pork Chop", "Protein", 231, 23, 0, 14, "100g"),
        f("steak", "Sirloin Steak", "Protein", 271, 25, 0, 18, "100g"),
        f("bagel", "Bagel", "Carbs", 245, 10, 48, 1.5, "1 bagel"),
        f("pancakes", "Pancakes", "Meals", 350, 8, 56, 11, "3 pancakes"),
        f("smoothie_bowl", "Smoothie Bowl", "Meals", 320, 10, 58, 7, "1 bowl"),
        f("burrito", "Bean Burrito", "Meals", 450, 18, 64, 14, "1 burrito"),
        f("caesar_salad", "Caesar Salad", "Meals", 360, 10, 14, 30, "1 plate"),
        f("pizza_slice", "Pizza Slice", "Meals", 285, 12, 36, 10, "1 slice"),
        f("sushi_roll", "Sushi Roll", "Meals", 255, 9, 38, 7, "1 roll")
    ]

    private static func f(_ id: String, _ name: String, _ cat: String, _ cal: Int, _ p: Double, _ c: Double, _ fat: Double, _ serving: String) -> FoodItem {
        FoodItem(id: id, name: name, category: cat, calories: cal, protein: p, carbs: c, fat: fat, serving: serving)
    }

    static func search(_ query: String) -> [FoodItem] {
        guard !query.isEmpty else { return foods }
        let q = query.lowercased()
        return foods.filter { $0.name.lowercased().contains(q) || $0.category.lowercased().contains(q) }
    }
}
