export type FoodItem = {
  id: string;
  name: string;
  category: "Protein" | "Carbs" | "Fats" | "Vegetables" | "Meals";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
};

const food = (
  id: string,
  name: string,
  category: FoodItem["category"],
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  serving: string
): FoodItem => ({ id, name, category, calories, protein, carbs, fat, serving });

export const commonFoods: FoodItem[] = [
  food("chicken_breast", "Chicken Breast", "Protein", 165, 31, 0, 3.6, "100g"),
  food("ground_beef", "Ground Beef", "Protein", 250, 26, 0, 17, "100g"),
  food("salmon", "Salmon", "Protein", 208, 20, 0, 13, "100g"),
  food("tuna", "Tuna", "Protein", 132, 28, 0, 1, "100g"),
  food("eggs", "Eggs", "Protein", 78, 6, 0.6, 5, "1 large"),
  food("greek_yogurt", "Greek Yogurt", "Protein", 100, 17, 6, 0.7, "170g"),
  food("cottage_cheese", "Cottage Cheese", "Protein", 98, 11, 3.4, 4.3, "100g"),
  food("whey_protein", "Whey Protein", "Protein", 120, 24, 3, 1.5, "1 scoop"),
  food("tofu", "Tofu", "Protein", 144, 17, 3, 9, "100g"),
  food("tempeh", "Tempeh", "Protein", 192, 20, 8, 11, "100g"),
  food("shrimp", "Shrimp", "Protein", 99, 24, 0.2, 0.3, "100g"),
  food("turkey_breast", "Turkey Breast", "Protein", 135, 30, 0, 1, "100g"),
  food("tilapia", "Tilapia", "Protein", 128, 26, 0, 2.7, "100g"),
  food("sardines", "Sardines", "Protein", 208, 25, 0, 11, "100g"),
  food("milk", "Milk", "Protein", 122, 8, 12, 5, "1 cup"),
  food("edamame", "Edamame", "Protein", 121, 12, 9, 5, "100g"),
  food("pork_chop", "Pork Chop", "Protein", 231, 23, 0, 14, "100g"),
  food("steak", "Sirloin Steak", "Protein", 271, 25, 0, 18, "100g"),
  food("brown_rice", "Brown Rice", "Carbs", 216, 5, 45, 1.8, "1 cup"),
  food("white_rice", "White Rice", "Carbs", 205, 4, 45, 0.4, "1 cup"),
  food("oats", "Oats", "Carbs", 150, 5, 27, 3, "40g"),
  food("whole_wheat_bread", "Whole Wheat Bread", "Carbs", 80, 4, 14, 1, "1 slice"),
  food("sweet_potato", "Sweet Potato", "Carbs", 112, 2, 26, 0.1, "1 medium"),
  food("banana", "Banana", "Carbs", 105, 1.3, 27, 0.4, "1 medium"),
  food("apple", "Apple", "Carbs", 95, 0.5, 25, 0.3, "1 medium"),
  food("pasta", "Pasta", "Carbs", 220, 8, 43, 1.3, "1 cup"),
  food("quinoa", "Quinoa", "Carbs", 222, 8, 39, 3.6, "1 cup"),
  food("lentils", "Lentils", "Carbs", 230, 18, 40, 0.8, "1 cup"),
  food("black_beans", "Black Beans", "Carbs", 227, 15, 41, 0.9, "1 cup"),
  food("chickpeas", "Chickpeas", "Carbs", 269, 15, 45, 4, "1 cup"),
  food("corn", "Corn", "Carbs", 125, 5, 27, 2, "1 cup"),
  food("potato", "Potato", "Carbs", 161, 4, 37, 0.2, "1 medium"),
  food("orange", "Orange", "Carbs", 62, 1, 15, 0.2, "1 medium"),
  food("blueberries", "Blueberries", "Carbs", 84, 1, 21, 0.5, "1 cup"),
  food("strawberries", "Strawberries", "Carbs", 49, 1, 12, 0.5, "1 cup"),
  food("rice_cakes", "Rice Cakes", "Carbs", 35, 0.7, 7, 0.3, "1 cake"),
  food("honey", "Honey", "Carbs", 64, 0, 17, 0, "1 tbsp"),
  food("granola", "Granola", "Carbs", 200, 5, 30, 7, "50g"),
  food("bagel", "Bagel", "Carbs", 245, 10, 48, 1.5, "1 bagel"),
  food("avocado", "Avocado", "Fats", 234, 3, 12, 21, "1 whole"),
  food("almonds", "Almonds", "Fats", 164, 6, 6, 14, "28g"),
  food("peanut_butter", "Peanut Butter", "Fats", 188, 8, 6, 16, "2 tbsp"),
  food("olive_oil", "Olive Oil", "Fats", 119, 0, 0, 14, "1 tbsp"),
  food("walnuts", "Walnuts", "Fats", 185, 4, 4, 18, "28g"),
  food("chia_seeds", "Chia Seeds", "Fats", 138, 5, 12, 9, "28g"),
  food("flaxseed", "Flaxseed", "Fats", 150, 5, 8, 12, "28g"),
  food("cashews", "Cashews", "Fats", 157, 5, 9, 12, "28g"),
  food("sunflower_seeds", "Sunflower Seeds", "Fats", 165, 6, 6, 14, "28g"),
  food("cheddar_cheese", "Cheddar Cheese", "Fats", 113, 7, 0.4, 9, "28g"),
  food("dark_chocolate", "Dark Chocolate", "Fats", 170, 2, 13, 12, "28g"),
  food("hummus", "Hummus", "Fats", 166, 8, 14, 10, "100g"),
  food("broccoli", "Broccoli", "Vegetables", 55, 4, 11, 0.6, "1 cup"),
  food("spinach", "Spinach", "Vegetables", 23, 3, 3.6, 0.4, "100g"),
  food("kale", "Kale", "Vegetables", 33, 3, 6, 0.6, "1 cup"),
  food("lettuce", "Lettuce", "Vegetables", 15, 1, 3, 0.2, "100g"),
  food("cucumber", "Cucumber", "Vegetables", 16, 0.7, 4, 0.1, "1 cup"),
  food("tomato", "Tomato", "Vegetables", 22, 1, 5, 0.2, "1 medium"),
  food("carrots", "Carrots", "Vegetables", 50, 1, 12, 0.3, "1 cup"),
  food("bell_pepper", "Bell Pepper", "Vegetables", 31, 1, 7, 0.3, "1 medium"),
  food("zucchini", "Zucchini", "Vegetables", 33, 2, 6, 0.6, "1 cup"),
  food("mushrooms", "Mushrooms", "Vegetables", 21, 3, 3, 0.3, "1 cup"),
  food("cauliflower", "Cauliflower", "Vegetables", 27, 2, 5, 0.3, "1 cup"),
  food("asparagus", "Asparagus", "Vegetables", 27, 3, 5, 0.2, "1 cup"),
  food("chicken_rice_bowl", "Chicken Rice Bowl", "Meals", 520, 42, 60, 12, "1 bowl"),
  food("oatmeal_banana", "Oatmeal with Banana", "Meals", 290, 8, 55, 5, "1 bowl"),
  food("protein_shake", "Protein Shake", "Meals", 250, 30, 20, 5, "1 shake"),
  food("scrambled_eggs_toast", "Scrambled Eggs & Toast", "Meals", 340, 20, 28, 16, "1 plate"),
  food("grilled_salmon_salad", "Grilled Salmon Salad", "Meals", 420, 34, 18, 24, "1 plate"),
  food("turkey_wrap", "Turkey Wrap", "Meals", 380, 28, 38, 12, "1 wrap"),
  food("greek_yogurt_parfait", "Greek Yogurt Parfait", "Meals", 280, 18, 42, 6, "1 cup"),
  food("tuna_sandwich", "Tuna Sandwich", "Meals", 360, 26, 38, 12, "1 sandwich"),
  food("pancakes", "Pancakes", "Meals", 350, 8, 56, 11, "3 pancakes"),
  food("smoothie_bowl", "Smoothie Bowl", "Meals", 320, 10, 58, 7, "1 bowl"),
  food("burrito", "Bean Burrito", "Meals", 450, 18, 64, 14, "1 burrito"),
  food("caesar_salad", "Caesar Salad", "Meals", 360, 10, 14, 30, "1 plate"),
  food("pizza_slice", "Pizza Slice", "Meals", 285, 12, 36, 10, "1 slice"),
  food("sushi_roll", "Sushi Roll", "Meals", 255, 9, 38, 7, "1 roll")
];

export function searchFoods(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return commonFoods;
  }
  return commonFoods.filter(
    (item) =>
      item.name.toLowerCase().includes(normalized) ||
      item.category.toLowerCase().includes(normalized)
  );
}
