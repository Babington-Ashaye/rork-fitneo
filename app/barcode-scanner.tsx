import { Ionicons } from "@expo/vector-icons";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { ScreenHeader } from "@/components/ScreenHeader";
import { GlassCard } from "@/components/ScreenKit";
import { saveNutritionLog } from "@/lib/api";
import { colors, radii } from "@/lib/theme";

type Product = {
  barcode: string;
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type ProductLookupResponse = {
  status?: number;
  product?: {
    brands?: string;
    product_name?: string;
    serving_size?: string;
    nutriments?: Record<string, number>;
  };
};

export default function BarcodeScannerScreen() {
  const params = useLocalSearchParams<{ mealType?: string }>();
  const mealType = typeof params.mealType === "string" ? params.mealType : "Snacks";
  const [permission, requestPermission] = useCameraPermissions();
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [lastCode, setLastCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scanLine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, { duration: 950, toValue: 1, useNativeDriver: true }),
        Animated.timing(scanLine, { duration: 950, toValue: 0, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanLine]);

  function normalizeBarcode(value: string) {
    return value.replace(/[^0-9A-Za-z]/g, "").trim();
  }

  async function lookupBarcode(rawCode: string, force = false) {
    const code = normalizeBarcode(rawCode);
    if (isLookingUp || (!force && product) || !code) return;
    if (code.length < 6) {
      setError("Enter or scan a valid barcode.");
      return;
    }

    setLastCode(code);
    setIsLookingUp(true);
    setError(null);
    try {
      const fields = "product_name,brands,serving_size,nutriments";
      const urls = [
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${fields}`,
        `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`
      ];
      let matchedProduct: NonNullable<ProductLookupResponse["product"]> | null = null;

      for (const url of urls) {
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        if (!response.ok) continue;
        const candidate = await response.json() as ProductLookupResponse;
        if (candidate?.status === 1 && candidate.product) {
          matchedProduct = candidate.product;
          break;
        }
      }

      if (!matchedProduct) {
        throw new Error("I could not find that barcode in the food database yet. Check the number and try again.");
      }
      const nutrients = matchedProduct.nutriments ?? {};
      setProduct({
        barcode: code,
        name: matchedProduct.product_name || matchedProduct.brands || "Scanned food",
        serving: matchedProduct.serving_size || "100 g",
        calories: Number(nutrients["energy-kcal_100g"] ?? nutrients["energy-kcal"] ?? 0),
        protein: Number(nutrients.proteins_100g ?? nutrients.proteins ?? 0),
        carbs: Number(nutrients.carbohydrates_100g ?? nutrients.carbohydrates ?? 0),
        fat: Number(nutrients.fat_100g ?? nutrients.fat ?? 0)
      });
      setManualCode(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not identify this barcode.");
      setLastCode("");
    } finally {
      setIsLookingUp(false);
    }
  }

  async function handleBarcode(result: BarcodeScanningResult) {
    if (isLookingUp || product || !result.data) return;
    const code = normalizeBarcode(result.data);
    if (!code || (code === lastCode && !error)) return;
    await lookupBarcode(code);
  }

  function resetScan() {
    setProduct(null);
    setError(null);
    setLastCode("");
  }

  async function addToDiary() {
    if (!product) return;
    setIsSaving(true);
    setError(null);
    try {
      await saveNutritionLog({
        mealType,
        foodName: product.name,
        servingSize: product.serving,
        calories: product.calories,
        protein: product.protein,
        carbs: product.carbs,
        fat: product.fat,
        scanMethod: "barcode"
      });
      setError("Added to today's nutrition log.");
      setProduct(null);
      setManualCode("");
      setLastCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this food.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!permission) {
    return (
      <AppLayout contentContainerStyle={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </AppLayout>
    );
  }

  if (!permission.granted) {
    return (
      <AppLayout contentContainerStyle={styles.center}>
        <TouchableOpacity activeOpacity={0.78} style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.permissionIcon}>
          <Ionicons name="barcode" size={28} color={colors.accent} />
        </View>
        <Text style={styles.permissionTitle}>Camera access is required</Text>
        <Text style={styles.permissionCopy}>FITNEO uses the camera only to read food barcodes.</Text>
        <TouchableOpacity style={styles.primary} onPress={requestPermission}>
          <Text style={styles.primaryText}>Allow camera</Text>
        </TouchableOpacity>
      </AppLayout>
    );
  }

  return (
    <AppLayout scroll contentContainerStyle={styles.screen}>
      <View style={styles.topRow}>
        <TouchableOpacity activeOpacity={0.78} style={styles.topBackButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Barcode Scanner</Text>
        <View style={styles.topBackButton} />
      </View>
      <ScreenHeader title="Packaged food lookup" subtitle={`Scan or type a barcode for ${mealType}.`} />
      <View style={styles.cameraShell}>
        <CameraView
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "code93", "itf14", "qr"] }}
          facing="back"
          onBarcodeScanned={product || isLookingUp ? undefined : handleBarcode}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.scanFrame} pointerEvents="none">
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [{
                  translateY: scanLine.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 142]
                  })
                }]
              }
            ]}
          />
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>
        <View style={styles.scanBadge}>
          <Ionicons name={isLookingUp ? "cloud-download" : "barcode"} size={15} color={colors.textPrimary} />
          <Text style={styles.scanBadgeText}>{isLookingUp ? "LOOKING UP FOOD" : "READY TO SCAN"}</Text>
        </View>
        {isLookingUp ? (
          <View style={styles.lookup}>
            <ActivityIndicator color={colors.textPrimary} />
            <Text style={styles.lookupText}>Checking nutrition database...</Text>
          </View>
        ) : null}
      </View>

      <GlassCard radius={16} style={styles.manualCard}>
        <View style={styles.manualHeader}>
          <Ionicons name="keypad" size={18} color={colors.teal} />
          <Text style={styles.manualTitle}>Barcode not scanning?</Text>
        </View>
        <View style={styles.manualRow}>
          <TextInput
            keyboardType="number-pad"
            onChangeText={setManualCode}
            placeholder="Type barcode number"
            placeholderTextColor={colors.textTertiary}
            style={styles.manualInput}
            underlineColorAndroid="transparent"
            value={manualCode}
          />
          <TouchableOpacity activeOpacity={0.82} style={styles.lookupButton} onPress={() => void lookupBarcode(manualCode, true)} disabled={isLookingUp}>
            {isLookingUp ? <ActivityIndicator color={colors.textPrimary} /> : <Ionicons name="search" size={18} color={colors.textPrimary} />}
          </TouchableOpacity>
        </View>
      </GlassCard>

      {product ? (
        <GlassCard radius={16} selected style={styles.productCard}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.serving}>{product.serving} · barcode {product.barcode}</Text>
          <View style={styles.nutrients}>
            <Nutrient value={`${Math.round(product.calories)}`} label="kcal" />
            <Nutrient value={`${product.protein.toFixed(1)}g`} label="protein" />
            <Nutrient value={`${product.carbs.toFixed(1)}g`} label="carbs" />
            <Nutrient value={`${product.fat.toFixed(1)}g`} label="fat" />
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondary} onPress={resetScan}>
              <Text style={styles.secondaryText}>Scan again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primary} onPress={addToDiary} disabled={isSaving}>
              {isSaving ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.primaryText}>Add to diary</Text>}
            </TouchableOpacity>
          </View>
        </GlassCard>
      ) : null}
      {error ? <Text style={[styles.status, error.startsWith("Added") && styles.success]}>{error}</Text> : null}
    </AppLayout>
  );
}

function Nutrient({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.nutrient}>
      <Text style={styles.nutrientValue}>{value}</Text>
      <Text style={styles.nutrientLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 14, paddingBottom: 12 },
  center: { alignItems: "center", gap: 14, justifyContent: "center", paddingHorizontal: 28 },
  topRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  topBackButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 18, height: 38, justifyContent: "center", width: 38 },
  topTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: "900" },
  backButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 18, height: 38, justifyContent: "center", left: 18, position: "absolute", top: 18, width: 38 },
  permissionIcon: { alignItems: "center", backgroundColor: "rgba(10,132,255,0.12)", borderColor: "rgba(10,132,255,0.28)", borderRadius: 28, borderWidth: 1, height: 56, justifyContent: "center", width: 56 },
  permissionTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: "800", textAlign: "center" },
  permissionCopy: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: "center" },
  cameraShell: { borderColor: "rgba(10,132,255,0.22)", borderRadius: 24, borderWidth: 1, flex: 1, minHeight: 320, overflow: "hidden" },
  scanFrame: { alignSelf: "center", borderColor: "rgba(10,132,255,0.18)", borderRadius: 18, height: 160, marginTop: 76, width: "82%" },
  scanLine: { alignSelf: "center", backgroundColor: colors.accent, borderRadius: 999, height: 3, opacity: 0.95, position: "absolute", shadowColor: colors.accent, shadowOpacity: 0.75, shadowRadius: 18, top: 0, width: "88%" },
  scanBadge: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.72)", borderColor: "rgba(255,255,255,0.18)", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 7, left: 14, paddingHorizontal: 12, paddingVertical: 8, position: "absolute", top: 14 },
  scanBadgeText: { color: colors.textPrimary, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  cornerTopLeft: { borderLeftColor: colors.accent, borderLeftWidth: 4, borderTopColor: colors.accent, borderTopLeftRadius: 10, borderTopWidth: 4, height: 34, left: 0, position: "absolute", top: 0, width: 34 },
  cornerTopRight: { borderRightColor: colors.accent, borderRightWidth: 4, borderTopColor: colors.accent, borderTopRightRadius: 10, borderTopWidth: 4, height: 34, position: "absolute", right: 0, top: 0, width: 34 },
  cornerBottomLeft: { borderBottomColor: colors.accent, borderBottomLeftRadius: 10, borderBottomWidth: 4, borderLeftColor: colors.accent, borderLeftWidth: 4, bottom: 0, height: 34, left: 0, position: "absolute", width: 34 },
  cornerBottomRight: { borderBottomColor: colors.accent, borderBottomRightRadius: 10, borderBottomWidth: 4, borderRightColor: colors.accent, borderRightWidth: 4, bottom: 0, height: 34, position: "absolute", right: 0, width: 34 },
  lookup: { alignItems: "center", backgroundColor: "rgba(6,9,20,0.82)", borderRadius: 14, bottom: 18, flexDirection: "row", gap: 9, left: 18, padding: 12, position: "absolute", right: 18 },
  lookupText: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
  manualCard: { gap: 10, padding: 14 },
  manualHeader: { alignItems: "center", flexDirection: "row", gap: 8 },
  manualTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "900" },
  manualRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  manualInput: { backgroundColor: "rgba(255,255,255,0.045)", borderColor: colors.cardStroke, borderRadius: radii.md, borderWidth: 1, color: colors.textPrimary, flex: 1, minHeight: 48, paddingHorizontal: 12 },
  lookupButton: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 14, height: 48, justifyContent: "center", width: 52 },
  productCard: { gap: 10, padding: 16 },
  productName: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
  serving: { color: colors.textTertiary, fontSize: 11 },
  nutrients: { flexDirection: "row", gap: 7 },
  nutrient: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.045)", borderRadius: 10, flex: 1, paddingVertical: 9 },
  nutrientValue: { color: colors.textPrimary, fontSize: 13, fontWeight: "800" },
  nutrientLabel: { color: colors.textTertiary, fontSize: 9 },
  actions: { flexDirection: "row", gap: 9 },
  primary: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 12, flex: 1, justifyContent: "center", minHeight: 46, paddingHorizontal: 16 },
  primaryText: { color: colors.textPrimary, fontSize: 13, fontWeight: "900" },
  secondary: { alignItems: "center", borderColor: colors.cardStroke, borderRadius: 12, borderWidth: 1, flex: 1, justifyContent: "center", minHeight: 46 },
  secondaryText: { color: colors.textSecondary, fontSize: 13, fontWeight: "800" },
  status: { color: colors.danger, fontSize: 12, lineHeight: 17, textAlign: "center" },
  success: { color: colors.teal }
});
