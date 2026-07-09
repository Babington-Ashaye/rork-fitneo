import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { AdaptiveBanner } from "@/components/AdaptiveBanner";
import { EmptySpacer, ErrorState, IconBubble, LoadingState, ScreenTitle, TouchableCard } from "@/components/ScreenKit";
import { fetchNutritionData, NutritionData, saveNutritionLog } from "@/lib/api";
import { FoodItem, searchFoods } from "@/lib/foods";
import { colors, radii } from "@/lib/theme";
import { useSubscription } from "@/context/SubscriptionContext";

const mealIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Breakfast: "sunny",
  Lunch: "restaurant",
  Dinner: "moon",
  Snacks: "cafe"
};
const PAGE_SIZE = 12;

export default function NutritionScreen() {
  const { isLoading: isSubscriptionLoading, isPremium } = useSubscription();
  const [data, setData] = useState<NutritionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scanMeal, setScanMeal] = useState("Snacks");
  const [scanPickerOpen, setScanPickerOpen] = useState(false);
  const [foodMeal, setFoodMeal] = useState("Snacks");
  const [foodPickerOpen, setFoodPickerOpen] = useState(false);
  const [foodQuery, setFoodQuery] = useState("");
  const [foodPage, setFoodPage] = useState(1);
  const [savingFoodId, setSavingFoodId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const matchingFoods = useMemo(() => searchFoods(foodQuery), [foodQuery]);
  const visibleFoods = matchingFoods.slice(0, foodPage * PAGE_SIZE);

  function openScanPicker(mealType = "Snacks") {
    setScanMeal(mealType);
    setScanPickerOpen(true);
  }

  function openFoodPicker(mealType: string) {
    setFoodMeal(mealType);
    setFoodQuery("");
    setFoodPage(1);
    setFoodPickerOpen(true);
  }

  function startScan(path: "/scanner" | "/barcode-scanner") {
    setScanPickerOpen(false);
    router.push({ pathname: path, params: { mealType: scanMeal } });
  }

  async function addFood(item: FoodItem) {
    setSavingFoodId(item.id);
    setNotice(null);
    try {
      await saveNutritionLog({
        mealType: foodMeal,
        foodName: item.name,
        servingSize: item.serving,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        scanMethod: "manual"
      });
      setFoodPickerOpen(false);
      setNotice(`${item.name} added to ${foodMeal}.`);
      await loadNutrition();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not add this food.");
    } finally {
      setSavingFoodId(null);
    }
  }

  async function loadNutrition() {
    setError(null);
    setIsLoading(true);
    try {
      setData(await fetchNutritionData());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load nutrition.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadNutrition();
  }, []);

  if (isLoading) {
    return (
      <AppLayout scroll>
        <LoadingState label="Loading live nutrition..." />
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout scroll>
        <ErrorState message={error ?? "Nutrition data is unavailable."} onRetry={loadNutrition} />
      </AppLayout>
    );
  }

  const remaining = Math.max(0, data.calorieTarget - data.caloriesEaten);
  const macroTotal = Math.round(data.protein + data.carbs + data.fat);

  return (
    <AppLayout scroll>
      <ScreenTitle title="Nutrition" subtitle={data.dateLabel} />
      <TouchableCard radius={radii.hero} style={styles.summaryCard} onPress={loadNutrition}>
        <View style={styles.macroRing}>
          <View style={styles.ringOuter}>
            <View style={styles.ringInner}>
              <Text style={styles.ringValue}>{macroTotal}g</Text>
              <Text style={styles.ringLabel}>macros</Text>
            </View>
          </View>
        </View>
        <View style={styles.summaryText}>
          <Text style={styles.remaining}>{remaining}</Text>
          <Text style={styles.remainingLabel}>kcal remaining</Text>
          <MacroLegend name="Protein" grams={`${Math.round(data.protein)}g`} color={colors.accent} />
          <MacroLegend name="Carbs" grams={`${Math.round(data.carbs)}g`} color={colors.coral} />
          <MacroLegend name="Fat" grams={`${Math.round(data.fat)}g`} color={colors.gold} />
        </View>
      </TouchableCard>

      <TouchableCard radius={radii.xxl} style={styles.scanCard} onPress={() => openScanPicker()}>
        <IconBubble icon="camera" size={48} />
        <View style={styles.flex}>
          <Text style={styles.scanTitle}>Scan Meal</Text>
          <Text style={styles.scanSubtitle}>Secure AI photo analysis through Supabase Edge Functions</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </TouchableCard>

      {data.meals.map((meal) => (
        <Fragment key={meal.title}>
        <TouchableCard radius={radii.xl} style={styles.mealCard} onPress={() => openScanPicker(meal.title)}>
          <View style={styles.mealHeader}>
            <View style={styles.mealTitleWrap}>
              <Ionicons name={mealIcons[meal.title] ?? "restaurant"} size={17} color={colors.textPrimary} />
              <Text style={styles.mealTitle}>{meal.title}</Text>
            </View>
            <Text style={styles.mealKcal}>{meal.kcal} kcal</Text>
          </View>
          <View style={styles.addRow}>
            <TouchableOpacity activeOpacity={0.78} style={styles.addFood} onPress={() => openFoodPicker(meal.title)}>
              <Ionicons name="add-circle" size={17} color={colors.accent} />
              <Text style={styles.addText}>Add food</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.78} style={styles.scanPill} onPress={() => openScanPicker(meal.title)}>
              <Ionicons name="camera" size={12} color={colors.accent} />
              <Text style={styles.scanPillText}>Scan</Text>
            </TouchableOpacity>
          </View>
        </TouchableCard>
        {!isSubscriptionLoading && !isPremium && (meal.title === "Breakfast" || meal.title === "Lunch") ? (
          <View style={styles.inlineAd}>
            <Text style={styles.adLabel}>SPONSORED</Text>
            <AdaptiveBanner enabled />
          </View>
        ) : null}
        </Fragment>
      ))}

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <EmptySpacer />

      <Modal transparent animationType="fade" visible={scanPickerOpen} onRequestClose={() => setScanPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setScanPickerOpen(false)}>
          <Pressable style={styles.actionSheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetEyebrow}>{scanMeal.toUpperCase()}</Text>
            <Text style={styles.sheetTitle}>How would you like to scan?</Text>
            <TouchableOpacity style={styles.scanChoice} onPress={() => startScan("/scanner")}>
              <View style={styles.choiceIcon}><Ionicons name="camera" size={22} color={colors.accent} /></View>
              <View style={styles.flex}>
                <Text style={styles.choiceTitle}>Scan Meal via Camera</Text>
                <Text style={styles.choiceCopy}>AI identifies the meal and estimates macros.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.scanChoice} onPress={() => startScan("/barcode-scanner")}>
              <View style={styles.choiceIcon}><Ionicons name="barcode" size={24} color={colors.teal} /></View>
              <View style={styles.flex}>
                <Text style={styles.choiceTitle}>Scan Barcode</Text>
                <Text style={styles.choiceCopy}>Look up packaged foods instantly.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent animationType="slide" visible={foodPickerOpen} onRequestClose={() => setFoodPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.foodSheet}>
            <View style={styles.foodSheetHeader}>
              <View>
                <Text style={styles.sheetEyebrow}>ADD TO {foodMeal.toUpperCase()}</Text>
                <Text style={styles.sheetTitle}>Common foods</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setFoodPickerOpen(false)}>
                <Ionicons name="close" size={21} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.foodSearch}>
              <Ionicons name="search" size={18} color={colors.textTertiary} />
              <TextInput
                autoFocus
                placeholder="Search foods or categories"
                placeholderTextColor={colors.textTertiary}
                style={styles.foodSearchInput}
                value={foodQuery}
                onChangeText={(value) => { setFoodQuery(value); setFoodPage(1); }}
                underlineColorAndroid="transparent"
              />
            </View>
            <FlatList
              data={visibleFoods}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.foodList}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.foodRow} onPress={() => void addFood(item)} disabled={savingFoodId !== null}>
                  <View style={styles.foodInitial}><Text style={styles.foodInitialText}>{item.name.charAt(0)}</Text></View>
                  <View style={styles.flex}>
                    <Text style={styles.foodName}>{item.name}</Text>
                    <Text style={styles.foodMeta}>{item.serving} · P {item.protein}g · C {item.carbs}g · F {item.fat}g</Text>
                  </View>
                  {savingFoodId === item.id ? <ActivityIndicator color={colors.accent} /> : <Text style={styles.foodCalories}>{item.calories} kcal</Text>}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyFood}>No common foods match that search.</Text>}
              ListFooterComponent={visibleFoods.length < matchingFoods.length ? (
                <TouchableOpacity style={styles.loadMore} onPress={() => setFoodPage((current) => current + 1)}>
                  <Text style={styles.loadMoreText}>Load more</Text>
                </TouchableOpacity>
              ) : null}
            />
          </View>
        </View>
      </Modal>
    </AppLayout>
  );
}

function MacroLegend({ name, grams, color }: { name: string; grams: string; color: string }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendName}>{name}</Text>
      <Text style={styles.legendGrams}>{grams}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 20,
    padding: 22
  },
  macroRing: {
    height: 120,
    width: 120
  },
  ringOuter: {
    alignItems: "center",
    borderColor: colors.accent,
    borderLeftColor: colors.coral,
    borderRadius: 60,
    borderRightColor: colors.gold,
    borderWidth: 16,
    height: 120,
    justifyContent: "center",
    width: 120
  },
  ringInner: {
    alignItems: "center"
  },
  ringValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700"
  },
  ringLabel: {
    color: colors.textTertiary,
    fontSize: 10
  },
  summaryText: {
    flex: 1,
    gap: 8
  },
  remaining: {
    color: colors.accent,
    fontSize: 30,
    fontWeight: "700"
  },
  remainingLabel: {
    color: colors.textTertiary,
    fontSize: 12
  },
  legendRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  legendDot: {
    borderRadius: 4,
    height: 7,
    width: 7
  },
  legendName: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "500"
  },
  legendGrams: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700"
  },
  scanCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    padding: 20
  },
  flex: {
    flex: 1
  },
  scanTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "700"
  },
  scanSubtitle: {
    color: colors.textTertiary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4
  },
  mealCard: {
    gap: 16,
    padding: 18
  },
  mealHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  mealTitleWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  mealTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700"
  },
  mealKcal: {
    color: colors.textTertiary,
    fontSize: 13,
    fontWeight: "600"
  },
  addRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  addFood: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  addText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "600"
  },
  scanPill: {
    alignItems: "center",
    backgroundColor: "rgba(10,132,255,0.12)",
    borderRadius: radii.round,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  scanPillText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "600"
  },
  notice: { color: colors.teal, fontSize: 12, fontWeight: "700", textAlign: "center" },
  modalBackdrop: { backgroundColor: "rgba(0,0,0,0.72)", flex: 1, justifyContent: "flex-end" },
  actionSheet: { backgroundColor: "#111827", borderColor: colors.cardStroke, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, gap: 12, padding: 20, paddingBottom: 34 },
  sheetHandle: { alignSelf: "center", backgroundColor: "rgba(255,255,255,0.22)", borderRadius: 2, height: 4, marginBottom: 4, width: 38 },
  sheetEyebrow: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  sheetTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: "900", marginBottom: 4 },
  scanChoice: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.045)", borderColor: colors.cardStroke, borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 12, minHeight: 78, padding: 14 },
  choiceIcon: { alignItems: "center", backgroundColor: "rgba(10,132,255,0.12)", borderRadius: 14, height: 48, justifyContent: "center", width: 48 },
  choiceTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: "800" },
  choiceCopy: { color: colors.textTertiary, fontSize: 11, lineHeight: 16, marginTop: 3 },
  foodSheet: { backgroundColor: "#0D1424", borderTopLeftRadius: 28, borderTopRightRadius: 28, height: "88%", paddingHorizontal: 18, paddingTop: 20 },
  foodSheetHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  closeButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 18, height: 38, justifyContent: "center", width: 38 },
  foodSearch: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.055)", borderColor: colors.cardStroke, borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 10, marginTop: 16, paddingHorizontal: 14 },
  foodSearchInput: { color: colors.textPrimary, flex: 1, minHeight: 50 },
  foodList: { paddingBottom: 32, paddingTop: 10 },
  foodRow: { alignItems: "center", borderBottomColor: "rgba(255,255,255,0.07)", borderBottomWidth: 1, flexDirection: "row", gap: 11, minHeight: 72, paddingVertical: 10 },
  foodInitial: { alignItems: "center", backgroundColor: "rgba(10,132,255,0.13)", borderRadius: 13, height: 42, justifyContent: "center", width: 42 },
  foodInitialText: { color: colors.accent, fontSize: 16, fontWeight: "900" },
  foodName: { color: colors.textPrimary, fontSize: 14, fontWeight: "800" },
  foodMeta: { color: colors.textTertiary, fontSize: 10, marginTop: 4 },
  foodCalories: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
  emptyFood: { color: colors.textTertiary, paddingVertical: 40, textAlign: "center" },
  loadMore: { alignItems: "center", borderColor: colors.cardStroke, borderRadius: 12, borderWidth: 1, marginTop: 12, padding: 13 },
  loadMoreText: { color: colors.accent, fontSize: 13, fontWeight: "800" }
  ,
  inlineAd: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.025)", borderColor: colors.cardStroke, borderRadius: 14, borderWidth: 1, minHeight: 62, overflow: "hidden", paddingTop: 3 },
  adLabel: { color: colors.textTertiary, fontSize: 8, fontWeight: "800", letterSpacing: 1.2 }
});
