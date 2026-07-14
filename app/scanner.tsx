import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
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
  const scanLine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isScanning) {
      scanLine.stopAnimation();
      scanLine.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, { duration: 950, toValue: 1, useNativeDriver: true }),
        Animated.timing(scanLine, { duration: 950, toValue: 0, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isScanning, scanLine]);

  async function captureAndAnalyze() {
    if (!cameraRef.current || isScanning) return;
    setIsScanning(true);
    setStatus(null);
    setResult(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.28,
        skipProcessing: true
      });
      const base64 = photo?.base64 ?? (photo?.uri ? await FileSystem.readAsStringAsync(photo.uri, { encoding: "base64" as never }) : null);
      if (!base64) throw new Error("The camera did not return an image. Please retake the photo.");
      const dataUri = base64.startsWith("data:image") ? base64 : `data:image/jpeg;base64,${base64}`;
      const response = await analyzeFoodPhoto(dataUri);
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
    <AppLayout scroll contentContainerStyle={styles.screen}>
      <View style={styles.headerCard}>
        <View style={styles.headerIcon}>
          <Ionicons name="scan" size={20} color={colors.textPrimary} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>FITNEO VISION</Text>
          <Text style={styles.headerTitle}>AI Plate Scanner</Text>
          <Text style={styles.headerSubtitle}>Frame the whole meal for {mealType}. Keep the plate steady and well-lit.</Text>
        </View>
      </View>
      <View style={styles.cameraFrame}>
        <CameraView ref={cameraRef} facing="back" style={StyleSheet.absoluteFill} />
        <View style={styles.cameraTint} pointerEvents="none" />
        <View style={styles.guide} pointerEvents="none" />
        <View style={styles.cornerTopLeft} pointerEvents="none" />
        <View style={styles.cornerTopRight} pointerEvents="none" />
        <View style={styles.cornerBottomLeft} pointerEvents="none" />
        <View style={styles.cornerBottomRight} pointerEvents="none" />
        {isScanning ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.scanLine,
              {
                transform: [{
                  translateY: scanLine.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-118, 118]
                  })
                }]
              }
            ]}
          />
        ) : null}
        <View style={styles.scanBadge}>
          <Ionicons name={isScanning ? "pulse" : "camera"} size={13} color={isScanning ? colors.teal : colors.accent} />
          <Text style={styles.scanBadgeText}>{isScanning ? "ANALYZING FOOD" : "READY TO CAPTURE"}</Text>
        </View>
      </View>
      <View style={styles.resultCard}>
        <Text style={styles.resultLabel}>{result ? "Nutrition estimate" : isScanning ? "Scanning visible food only..." : "No result yet"}</Text>
        <Text style={[styles.status, !status && styles.statusMuted]}>
          {status ?? "Take a clear photo and FITNEO will estimate calories, protein, carbs, and fat."}
        </Text>
        {result?.confidence ? <Text style={styles.confidence}>Confidence: {Math.round(result.confidence * 100)}%</Text> : null}
      </View>
      <View style={styles.actionDock}>
        <TouchableOpacity activeOpacity={0.8} style={styles.button} onPress={captureAndAnalyze} disabled={isScanning}>
          {isScanning ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.buttonText}>Capture and analyze</Text>}
        </TouchableOpacity>
        {result ? (
          <TouchableOpacity activeOpacity={0.8} style={[styles.button, styles.saveButton]} onPress={addToDiary} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.buttonText}>Add to {mealType}</Text>}
          </TouchableOpacity>
        ) : null}
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 14, paddingBottom: 28 },
  center: { alignItems: "center", gap: 16, justifyContent: "center", paddingHorizontal: 28 },
  headerCard: { alignItems: "center", backgroundColor: "rgba(10,132,255,0.10)", borderColor: "rgba(10,132,255,0.28)", borderRadius: 22, borderWidth: 1, flexDirection: "row", gap: 14, padding: 16 },
  headerIcon: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 20, height: 40, justifyContent: "center", width: 40 },
  headerCopy: { flex: 1 },
  kicker: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  headerTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: "900", marginTop: 2 },
  headerSubtitle: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 4 },
  cameraFrame: { backgroundColor: "#050507", borderColor: "rgba(10,132,255,0.30)", borderRadius: 24, borderWidth: 1, minHeight: 320, overflow: "hidden" },
  cameraTint: { backgroundColor: "rgba(0,0,0,0.18)", ...StyleSheet.absoluteFillObject },
  guide: { alignSelf: "center", borderColor: colors.accent, borderRadius: 24, borderWidth: 2, height: "64%", marginTop: "18%", width: "82%" },
  cornerTopLeft: { borderColor: colors.teal, borderLeftWidth: 4, borderTopWidth: 4, borderTopLeftRadius: 18, height: 42, left: "9%", position: "absolute", top: "17%", width: 42 },
  cornerTopRight: { borderColor: colors.teal, borderRightWidth: 4, borderTopWidth: 4, borderTopRightRadius: 18, height: 42, position: "absolute", right: "9%", top: "17%", width: 42 },
  cornerBottomLeft: { borderBottomLeftRadius: 18, borderBottomWidth: 4, borderColor: colors.teal, borderLeftWidth: 4, bottom: "18%", height: 42, left: "9%", position: "absolute", width: 42 },
  cornerBottomRight: { borderBottomRightRadius: 18, borderBottomWidth: 4, borderColor: colors.teal, borderRightWidth: 4, bottom: "18%", height: 42, position: "absolute", right: "9%", width: 42 },
  scanLine: { alignSelf: "center", backgroundColor: colors.accent, borderRadius: 999, height: 3, opacity: 0.95, position: "absolute", shadowColor: colors.accent, shadowOpacity: 0.75, shadowRadius: 18, top: "50%", width: "82%" },
  scanBadge: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.72)", borderColor: "rgba(255,255,255,0.18)", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 7, left: 14, paddingHorizontal: 12, paddingVertical: 8, position: "absolute", top: 14 },
  scanBadgeText: { color: colors.textPrimary, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "800", textAlign: "center" },
  resultCard: { backgroundColor: "rgba(255,255,255,0.055)", borderColor: "rgba(255,255,255,0.10)", borderRadius: 18, borderWidth: 1, gap: 5, padding: 14 },
  resultLabel: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  status: { color: colors.textPrimary, fontSize: 14, fontWeight: "800", lineHeight: 20, textAlign: "center" },
  statusMuted: { color: colors.textSecondary, fontWeight: "600", textAlign: "left" },
  confidence: { color: colors.teal, fontSize: 11, fontWeight: "900", textAlign: "center" },
  actionDock: { backgroundColor: "rgba(0,0,0,0.36)", borderColor: "rgba(255,255,255,0.08)", borderRadius: 22, borderWidth: 1, gap: 10, padding: 10 },
  button: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 16, justifyContent: "center", minHeight: 56, paddingHorizontal: 18 },
  saveButton: { backgroundColor: colors.teal },
  buttonText: { color: colors.textPrimary, fontSize: 14, fontWeight: "900" }
});

