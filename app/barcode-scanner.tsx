import { Ionicons } from "@expo/vector-icons";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard, ScreenTitle } from "@/components/ScreenKit";
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

export default function BarcodeScannerScreen() {
  const params = useLocalSearchParams<{ mealType?: string }>();
  const mealType = typeof params.mealType === "string" ? params.mealType : "Snacks";
  const [permission, requestPermission] = useCameraPermissions();
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBarcode(result: BarcodeScanningResult) {
    if (isLookingUp || product) {
      return;
    }
    setIsLookingUp(true);
    setError(null);
    try {
      const fields = "product_name,serving_size,nutriments";
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(result.data)}.json?fields=${fields}`,
        { headers: { "User-Agent": "FITNEO/1.0 (nutrition barcode scanner)" } }
      );
      if (!response.ok) {
        throw new Error(`Product lookup failed (${response.status}).`);
      }
      const body = await response.json() as {
        status?: number;
        product?: {
          product_name?: string;
          serving_size?: string;
          nutriments?: Record<string, number>;
        };
      };
      if (body.status !== 1 || !body.product) {
        throw new Error("This barcode is not in the food database yet.");
      }
      const nutrients = body.product.nutriments ?? {};
      setProduct({
        barcode: result.data,
        name: body.product.product_name || "Scanned food",
        serving: body.product.serving_size || "100 g",
        calories: Number(nutrients["energy-kcal_100g"] ?? nutrients["energy-kcal"] ?? 0),
        protein: Number(nutrients.proteins_100g ?? nutrients.proteins ?? 0),
        carbs: Number(nutrients.carbohydrates_100g ?? nutrients.carbohydrates ?? 0),
        fat: Number(nutrients.fat_100g ?? nutrients.fat ?? 0)
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not identify this barcode.");
    } finally {
      setIsLookingUp(false);
    }
  }

  async function addToDiary() {
    if (!product) {
      return;
    }
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
      setError("Added to today’s nutrition log.");
      setProduct(null);
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
        <Ionicons name="camera" size={34} color={colors.accent} />
        <Text style={styles.permissionTitle}>Camera access is required</Text>
        <Text style={styles.permissionCopy}>FITNEO uses the camera only to read food barcodes.</Text>
        <TouchableOpacity style={styles.primary} onPress={requestPermission}>
          <Text style={styles.primaryText}>Allow camera</Text>
        </TouchableOpacity>
      </AppLayout>
    );
  }

  return (
    <AppLayout contentContainerStyle={styles.screen}>
      <ScreenTitle title="Barcode Scanner" subtitle={`Point the frame at a packaged food barcode for ${mealType}.`} />
      <View style={styles.cameraShell}>
        <CameraView
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"] }}
          facing="back"
          onBarcodeScanned={product || isLookingUp ? undefined : handleBarcode}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.scanFrame} pointerEvents="none">
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>
        {isLookingUp ? (
          <View style={styles.lookup}>
            <ActivityIndicator color={colors.textPrimary} />
            <Text style={styles.lookupText}>Looking up food...</Text>
          </View>
        ) : null}
      </View>

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
            <TouchableOpacity style={styles.secondary} onPress={() => setProduct(null)}>
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
  permissionTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: "800", textAlign: "center" },
  permissionCopy: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: "center" },
  cameraShell: { borderRadius: 18, flex: 1, minHeight: 300, overflow: "hidden" },
  scanFrame: { alignSelf: "center", height: 150, marginTop: 78, width: "78%" },
  cornerTopLeft: { borderLeftColor: colors.accent, borderLeftWidth: 4, borderTopColor: colors.accent, borderTopLeftRadius: 10, borderTopWidth: 4, height: 34, left: 0, position: "absolute", top: 0, width: 34 },
  cornerTopRight: { borderRightColor: colors.accent, borderRightWidth: 4, borderTopColor: colors.accent, borderTopRightRadius: 10, borderTopWidth: 4, height: 34, position: "absolute", right: 0, top: 0, width: 34 },
  cornerBottomLeft: { borderBottomColor: colors.accent, borderBottomLeftRadius: 10, borderBottomWidth: 4, borderLeftColor: colors.accent, borderLeftWidth: 4, bottom: 0, height: 34, left: 0, position: "absolute", width: 34 },
  cornerBottomRight: { borderBottomColor: colors.accent, borderBottomRightRadius: 10, borderBottomWidth: 4, borderRightColor: colors.accent, borderRightWidth: 4, bottom: 0, height: 34, position: "absolute", right: 0, width: 34 },
  lookup: { alignItems: "center", backgroundColor: "rgba(6,9,20,0.82)", borderRadius: 14, bottom: 18, flexDirection: "row", gap: 9, left: 18, padding: 12, position: "absolute", right: 18 },
  lookupText: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
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
