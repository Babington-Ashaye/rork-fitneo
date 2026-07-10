import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { ScreenTitle } from "@/components/ScreenKit";
import { saveNutritionLog } from "@/lib/api";
import { analyzeFoodPhoto, FoodScanResult } from "@/lib/edgeFunctions";
import { colors } from "@/lib/theme";

export default function ScannerScreen() {
  const params = useLocalSearchParams<{ mealType?: string }>();
  const mealType = typeof params.mealType === "string" ? params.mealType : "Snacks";
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<FoodScanResult | null>(null);

  async function captureAndAnalyze() {
    if (!cameraRef.current || isScanning) return;
    setIsScanning(true);
    setStatus(null);
    setResult(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.35,
        skipProcessing: false
      });
      if (!photo?.base64) throw new Error("The camera did not return an image. Please retake the photo.");
      const response = await analyzeFoodPhoto(`data:image/jpeg;base64,${photo.base64}`);
      if (response.error) throw new Error(response.error);
      if (!response.data) throw new Error("The scanner returned no nutrition estimate.");
      setResult(response.data);
      setStatus(
        `${response.data.foodName} · ${Math.round(response.data.calories)} kcal · ${Math.round(response.data.protein)}g protein`
      );
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Food analysis failed.");
    } finally {
      setIsScanning(false);
    }
  }

  async function addToDiary() {
    if (!result || isSaving) return;
    setIsSaving(true);
    setStatus(null);
    try {
      await saveNutritionLog({
        mealType,
        foodName: result.foodName,
        servingSize: result.servingSize || "1 serving",
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        scanMethod: "photo"
      });
      setStatus(`${result.foodName} added to ${mealType}.`);
      setResult(null);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not save this meal.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!permission) {
    return <AppLayout contentContainerStyle={styles.center}><ActivityIndicator color={colors.accent} /></AppLayout>;
  }

  if (!permission.granted) {
    return (
      <AppLayout contentContainerStyle={styles.center}>
        <Text style={styles.title}>Camera access is required for meal scanning.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Allow camera</Text>
        </TouchableOpacity>
      </AppLayout>
    );
  }

  return (
    <AppLayout contentContainerStyle={styles.screen}>
      <ScreenTitle title="AI Plate Scanner" subtitle={`Frame the whole meal for ${mealType}, then capture.`} />
      <View style={styles.cameraFrame}>
        <CameraView ref={cameraRef} facing="back" style={StyleSheet.absoluteFill} />
        <View style={styles.guide} pointerEvents="none" />
      </View>
      {status ? <Text style={styles.status}>{status}</Text> : null}
      <TouchableOpacity activeOpacity={0.8} style={styles.button} onPress={captureAndAnalyze} disabled={isScanning}>
        {isScanning ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.buttonText}>Capture and analyze</Text>}
      </TouchableOpacity>
      {result ? (
        <TouchableOpacity activeOpacity={0.8} style={[styles.button, styles.saveButton]} onPress={addToDiary} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.buttonText}>Add to {mealType}</Text>}
        </TouchableOpacity>
      ) : null}
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 14, paddingBottom: 14 },
  center: { alignItems: "center", gap: 16, justifyContent: "center", paddingHorizontal: 28 },
  cameraFrame: { borderRadius: 18, flex: 1, minHeight: 330, overflow: "hidden" },
  guide: { alignSelf: "center", borderColor: colors.accent, borderRadius: 22, borderWidth: 2, height: "66%", marginTop: "18%", width: "82%" },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "800", textAlign: "center" },
  status: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: "center" },
  button: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 14, justifyContent: "center", minHeight: 52, paddingHorizontal: 18 },
  saveButton: { backgroundColor: colors.teal },
  buttonText: { color: colors.textPrimary, fontSize: 14, fontWeight: "900" }
});

