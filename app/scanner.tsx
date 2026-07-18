import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { saveNutritionLog } from "@/lib/api";
import { analyzeFoodPhoto, FoodScanResult } from "@/lib/edgeFunctions";
import { colors } from "@/lib/theme";

const fallbackFoodImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=80";
const scanSteps = ["Identifying ingredients", "Estimating portions", "Building nutrition summary"];

export default function ScannerScreen() {
  const params = useLocalSearchParams<{ mealType?: string }>();
  const mealType = typeof params.mealType === "string" ? params.mealType : "Snacks";
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<FoodScanResult | null>(null);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
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
    setCapturedImageUri(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.28,
        skipProcessing: true
      });
      setCapturedImageUri(photo?.uri ?? null);
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
      setCapturedImageUri(null);
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
        <TouchableOpacity activeOpacity={0.78} style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.permissionIcon}>
          <Ionicons name="camera" size={28} color={colors.accent} />
        </View>
        <Text style={styles.title}>Camera access is required for meal scanning.</Text>
        <Text style={styles.permissionCopy}>FITNEO only uses the camera to capture the food photo you choose to analyze.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Allow camera</Text>
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
        <Text style={styles.topTitle}>AI Plate Scanner</Text>
        <View style={styles.topBackButton} />
      </View>
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
      {result ? (
        <FoodResultCard
          imageUri={capturedImageUri}
          isSaving={isSaving}
          mealType={mealType}
          onAdd={() => void addToDiary()}
          result={result}
        />
      ) : (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>{isScanning ? "Scanning visible food only..." : "No result yet"}</Text>
          <Text style={[styles.status, !status && styles.statusMuted]}>
            {status ?? "Take a clear photo and FITNEO will estimate calories, protein, carbs, and fat."}
          </Text>
          {isScanning ? (
            <View style={styles.scanSteps}>
              {scanSteps.map((step, index) => (
                <View key={step} style={styles.scanStep}>
                  <View style={[styles.scanStepDot, index === 0 && styles.scanStepDotActive]} />
                  <Text style={styles.scanStepText}>{step}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      )}
      <View style={styles.actionDock}>
        <TouchableOpacity activeOpacity={0.8} style={styles.button} onPress={captureAndAnalyze} disabled={isScanning}>
          {isScanning ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.buttonText}>Capture and analyze</Text>}
        </TouchableOpacity>
      </View>
    </AppLayout>
  );
}

function FoodResultCard({
  imageUri,
  isSaving,
  mealType,
  onAdd,
  result
}: {
  imageUri: string | null;
  isSaving: boolean;
  mealType: string;
  onAdd: () => void;
  result: FoodScanResult;
}) {
  return (
    <View style={styles.foodCard}>
      <ImageBackground
        source={{ uri: imageUri ?? fallbackFoodImage }}
        resizeMode="cover"
        style={styles.foodHero}
        imageStyle={styles.foodHeroImage}
      >
        <View style={styles.foodHeroShade} />
        <View style={styles.kcalBadge}>
          <Text style={styles.kcalValue}>{Math.round(result.calories)}</Text>
          <Text style={styles.kcalLabel}>kcal</Text>
        </View>
      </ImageBackground>
      <View style={styles.foodBody}>
        <Text style={styles.resultLabel}>Nutrition estimate</Text>
        <Text style={styles.foodTitle}>{result.foodName}</Text>
        <Text style={styles.foodServing}>{result.servingSize || "Visible serving"} · {mealType}</Text>
        <View style={styles.macroRow}>
          <MacroPill icon="fish-outline" label="Protein" value={`${Math.round(result.protein)}g`} />
          <MacroPill icon="leaf-outline" label="Carbs" value={`${Math.round(result.carbs)}g`} />
          <MacroPill icon="water-outline" label="Fat" value={`${Math.round(result.fat)}g`} />
        </View>
        {result.confidence ? <Text style={styles.confidence}>Confidence: {Math.round(result.confidence * 100)}%</Text> : null}
        <TouchableOpacity activeOpacity={0.82} style={[styles.button, styles.saveButton]} onPress={onAdd} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={18} color={colors.textPrimary} />
              <Text style={styles.buttonText}>Add to my meals</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MacroPill({
  icon,
  label,
  value
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.macroPill}>
      <Ionicons name={icon} size={13} color={colors.teal} />
      <View>
        <Text style={styles.macroValue}>{value}</Text>
        <Text style={styles.macroLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 10, paddingBottom: 18 },
  center: { alignItems: "center", gap: 16, justifyContent: "center", paddingHorizontal: 28 },
  topRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  topBackButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 18, height: 38, justifyContent: "center", width: 38 },
  topTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: "900" },
  backButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 18, height: 38, justifyContent: "center", left: 18, position: "absolute", top: 18, width: 38 },
  permissionIcon: { alignItems: "center", backgroundColor: "rgba(10,132,255,0.12)", borderColor: "rgba(10,132,255,0.28)", borderRadius: 28, borderWidth: 1, height: 56, justifyContent: "center", width: 56 },
  permissionCopy: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, maxWidth: 320, textAlign: "center" },
  headerCard: { alignItems: "center", backgroundColor: "rgba(10,132,255,0.10)", borderColor: "rgba(10,132,255,0.28)", borderRadius: 20, borderWidth: 1, flexDirection: "row", gap: 12, padding: 12 },
  headerIcon: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  headerCopy: { flex: 1 },
  kicker: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  headerTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: "900", marginTop: 1 },
  headerSubtitle: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 2 },
  cameraFrame: { backgroundColor: "#050507", borderColor: "rgba(10,132,255,0.30)", borderRadius: 24, borderWidth: 1, height: 320, minHeight: 260, overflow: "hidden" },
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
  resultCard: { backgroundColor: "rgba(255,255,255,0.055)", borderColor: "rgba(255,255,255,0.10)", borderRadius: 18, borderWidth: 1, gap: 4, padding: 12 },
  resultLabel: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  status: { color: colors.textPrimary, fontSize: 14, fontWeight: "800", lineHeight: 20, textAlign: "center" },
  statusMuted: { color: colors.textSecondary, fontWeight: "600", textAlign: "left" },
  confidence: { color: colors.teal, fontSize: 11, fontWeight: "900", textAlign: "center" },
  scanSteps: { gap: 7, marginTop: 8 },
  scanStep: { alignItems: "center", flexDirection: "row", gap: 8 },
  scanStepDot: { backgroundColor: "rgba(255,255,255,0.24)", borderRadius: 5, height: 10, width: 10 },
  scanStepDotActive: { backgroundColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.8, shadowRadius: 10 },
  scanStepText: { color: colors.textSecondary, fontSize: 11, fontWeight: "800" },
  foodCard: { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)", borderRadius: 24, borderWidth: 1, overflow: "hidden" },
  foodHero: { height: 178, justifyContent: "flex-start" },
  foodHeroImage: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  foodHeroShade: { backgroundColor: "rgba(0,0,0,0.22)", ...StyleSheet.absoluteFillObject },
  kcalBadge: { alignItems: "center", backgroundColor: "rgba(6,9,20,0.86)", borderColor: "rgba(255,255,255,0.18)", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 6, paddingHorizontal: 14, paddingVertical: 9, position: "absolute", right: 14, top: 14 },
  kcalValue: { color: colors.textPrimary, fontSize: 24, fontWeight: "900", letterSpacing: -0.4 },
  kcalLabel: { color: colors.gold, fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  foodBody: { gap: 11, padding: 14 },
  foodTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  foodServing: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
  macroRow: { flexDirection: "row", gap: 8 },
  macroPill: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.055)", borderColor: "rgba(255,255,255,0.10)", borderRadius: 14, borderWidth: 1, flex: 1, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 48, paddingHorizontal: 8 },
  macroValue: { color: colors.textPrimary, fontSize: 13, fontWeight: "900" },
  macroLabel: { color: colors.textTertiary, fontSize: 9, fontWeight: "800" },
  actionDock: { backgroundColor: "rgba(0,0,0,0.50)", borderColor: "rgba(255,255,255,0.10)", borderRadius: 22, borderWidth: 1, gap: 9, padding: 9 },
  button: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 16, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 52, paddingHorizontal: 18 },
  saveButton: { backgroundColor: colors.teal },
  buttonText: { color: colors.textPrimary, fontSize: 14, fontWeight: "900" }
});

