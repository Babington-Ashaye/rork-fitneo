import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { colors, radii } from "@/lib/theme";

type EquipmentChoice = "none" | "home";

const sports = [
  { name: "Football (Soccer)", programId: "sport-football", icon: "football" as const, tint: "#22C55E" },
  { name: "Basketball", programId: "sport-basketball", icon: "basketball" as const, tint: "#F59E0B" },
  { name: "Rugby", programId: "sport-rugby", icon: "ellipse-outline" as const, tint: "#F43F5E" },
  { name: "Boxing", programId: "sport-boxing", icon: "accessibility" as const, tint: "#F97316" },
  { name: "Tennis", programId: "sport-tennis", icon: "tennisball" as const, tint: "#84CC16" },
  { name: "Running", programId: "sport-running", icon: "walk" as const, tint: "#3B82F6" },
  { name: "Swimming", programId: "sport-swimming", icon: "water" as const, tint: "#06B6D4" },
  { name: "Cricket", programId: "sport-cricket", icon: "baseball" as const, tint: "#38BDF8" },
  { name: "Volleyball", programId: "sport-volleyball", icon: "radio-button-off" as const, tint: "#FB7185" }
];

const calibrationSteps = [
  "Analyzing sport demands",
  "Evaluating equipment access",
  "Building sport-specific drills",
  "Calibrating intensity",
  "Finalizing your sports plan"
];

export default function SportsModeScreen() {
  const [selected, setSelected] = useState("Soccer");
  const [equipment, setEquipment] = useState<EquipmentChoice>("none");
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const selectedSport = sports.find((sport) => sport.name === selected) ?? sports[0];

  useEffect(() => {
    if (!isCalibrating) return;
    setStepIndex(0);
    const timer = setInterval(() => {
      setStepIndex((current) => {
        if (current >= calibrationSteps.length - 1) {
          clearInterval(timer);
          setTimeout(() => {
            router.replace({
              pathname: "/active-workout",
              params: {
                mode: selected,
                programId: selectedSport.programId,
                programName: `${selected} Athletic Session`
              }
            });
          }, 450);
          return current;
        }
        return current + 1;
      });
    }, 520);
    return () => clearInterval(timer);
  }, [equipment, isCalibrating, selected]);

  if (isCalibrating) {
    return (
      <AppLayout contentContainerStyle={styles.calibrationScreen}>
        <View style={[styles.calibrationOrb, { shadowColor: selectedSport.tint }]}>
          <Ionicons name={selectedSport.icon} size={42} color={selectedSport.tint} />
        </View>
        <Text style={styles.aiTitle}>FITNEO AI</Text>
        <Text style={styles.aiSubtitle}>Sports Mode</Text>
        <View style={styles.calibrationCard}>
          {calibrationSteps.map((step, index) => {
            const active = index <= stepIndex;
            return (
              <View key={step} style={styles.calibrationRow}>
                <View style={[styles.stepDot, active && styles.stepDotActive]}>
                  {active ? <Ionicons name="checkmark" size={10} color={colors.textPrimary} /> : null}
                </View>
                <Text style={[styles.stepText, active && styles.stepTextActive]}>{step}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((stepIndex + 1) / calibrationSteps.length) * 100}%` }]} />
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout scroll>
      <View style={styles.segment}>
        <TouchableOpacity style={styles.segmentInactive} onPress={() => router.replace("/(tabs)/workouts")}>
          <Text style={styles.segmentInactiveText}>Normal</Text>
        </TouchableOpacity>
        <View style={styles.segmentActive}>
          <Text style={styles.segmentActiveText}>Sports</Text>
        </View>
      </View>

      <Text style={styles.heading}>Sports Mode</Text>
      <Text style={styles.subheading}>Choose your sport</Text>

      <View style={styles.grid}>
        {sports.map((sport) => {
          const active = sport.name === selected;
          return (
            <TouchableOpacity
              key={sport.name}
              activeOpacity={0.82}
              onPress={() => setSelected(sport.name)}
              style={[styles.card, active && styles.cardActive]}
            >
              <Ionicons name={sport.icon} size={32} color={sport.tint} />
              <Text style={styles.cardTitle}>{sport.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.equipmentCard}>
        <Text style={styles.equipmentTitle}>Equipment access</Text>
        <Text style={styles.equipmentCopy}>FITNEO will only build drills that match what you choose.</Text>
        <View style={styles.equipmentOptions}>
          <TouchableOpacity
            activeOpacity={0.82}
            style={[styles.equipmentOption, equipment === "none" && styles.equipmentOptionActive]}
            onPress={() => setEquipment("none")}
          >
            <Text style={[styles.equipmentOptionText, equipment === "none" && styles.equipmentOptionTextActive]}>No equipment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.82}
            style={[styles.equipmentOption, equipment === "home" && styles.equipmentOptionActive]}
            onPress={() => setEquipment("home")}
          >
            <Text style={[styles.equipmentOptionText, equipment === "home" && styles.equipmentOptionTextActive]}>Home gear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.86} style={styles.cta} onPress={() => setIsCalibrating(true)}>
        <Ionicons name="sparkles" size={18} color={colors.textPrimary} />
        <Text style={styles.ctaText}>Calibrate {selected} Plan</Text>
      </TouchableOpacity>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  segment: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: radii.round, flexDirection: "row", gap: 4, padding: 4 },
  segmentActive: { alignItems: "center", backgroundColor: colors.coral, borderRadius: radii.round, flex: 1, justifyContent: "center", minHeight: 38 },
  segmentInactive: { alignItems: "center", borderRadius: radii.round, flex: 1, justifyContent: "center", minHeight: 38 },
  segmentActiveText: { color: colors.textPrimary, fontSize: 13, fontWeight: "900" },
  segmentInactiveText: { color: colors.textSecondary, fontSize: 13, fontWeight: "900" },
  heading: { color: colors.textPrimary, fontSize: 31, fontWeight: "900", letterSpacing: -1.1, marginTop: 8 },
  subheading: { color: colors.textSecondary, fontSize: 14, marginTop: -6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { alignItems: "center", backgroundColor: "#171923", borderColor: "rgba(255,255,255,0.07)", borderRadius: 17, borderWidth: 1, gap: 11, justifyContent: "center", minHeight: 104, padding: 12, width: "48%" },
  cardActive: { borderColor: "rgba(0,163,255,0.7)", shadowColor: colors.accent, shadowOpacity: 0.25, shadowRadius: 14 },
  cardTitle: { color: colors.textPrimary, fontSize: 12, fontWeight: "900", textAlign: "center" },
  equipmentCard: { backgroundColor: "rgba(255,255,255,0.045)", borderColor: "rgba(255,255,255,0.08)", borderRadius: 18, borderWidth: 1, gap: 10, padding: 15 },
  equipmentTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "900" },
  equipmentCopy: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  equipmentOptions: { flexDirection: "row", gap: 8 },
  equipmentOption: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.08)", borderRadius: 13, borderWidth: 1, flex: 1, justifyContent: "center", minHeight: 42 },
  equipmentOptionActive: { backgroundColor: "rgba(0,163,255,0.16)", borderColor: "rgba(0,163,255,0.58)" },
  equipmentOptionText: { color: colors.textSecondary, fontSize: 12, fontWeight: "900" },
  equipmentOptionTextActive: { color: colors.textPrimary },
  cta: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 16, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 56 },
  ctaText: { color: colors.textPrimary, fontSize: 15, fontWeight: "900" },
  calibrationScreen: { alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 26 },
  calibrationOrb: { alignItems: "center", backgroundColor: "rgba(0,217,178,0.10)", borderRadius: 60, height: 120, justifyContent: "center", shadowOpacity: 0.5, shadowRadius: 34, width: 120 },
  aiTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: "900", letterSpacing: 4, marginTop: 10 },
  aiSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: -10 },
  calibrationCard: { backgroundColor: "#1B1D28", borderColor: "rgba(255,255,255,0.08)", borderRadius: 18, borderWidth: 1, gap: 11, marginTop: 10, padding: 18, width: "100%" },
  calibrationRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  stepDot: { alignItems: "center", borderColor: "rgba(255,255,255,0.35)", borderRadius: 8, borderWidth: 1, height: 16, justifyContent: "center", width: 16 },
  stepDotActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  stepText: { color: colors.textTertiary, fontSize: 13, fontWeight: "700" },
  stepTextActive: { color: colors.accent },
  progressTrack: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 999, height: 5, marginTop: 8, overflow: "hidden", width: "100%" },
  progressFill: { backgroundColor: colors.coral, borderRadius: 999, height: 5 }
});
