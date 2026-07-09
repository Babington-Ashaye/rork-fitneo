import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { EmptySpacer, ScreenTitle, TouchableCard } from "@/components/ScreenKit";
import { useSubscription } from "@/context/SubscriptionContext";
import { colors, radii } from "@/lib/theme";

const sports = [
  { name: "Football", icon: "football" as const, focus: "Speed, agility and match endurance" },
  { name: "Basketball", icon: "basketball" as const, focus: "Explosiveness, vertical power and conditioning" },
  { name: "Running", icon: "walk" as const, focus: "Pace, aerobic base and resilient legs" },
  { name: "Combat", icon: "fitness" as const, focus: "Rotational power, stamina and mobility" }
];

export default function SportsModeScreen() {
  const { isElite } = useSubscription();
  const [selected, setSelected] = useState("Football");

  if (!isElite) {
    return (
      <AppLayout contentContainerStyle={styles.lockedScreen}>
        <View style={styles.lockIcon}><Ionicons name="trophy" size={34} color={colors.gold} /></View>
        <Text style={styles.lockedKicker}>FITNEO ELITE</Text>
        <Text style={styles.lockedTitle}>Sport-specific programming</Text>
        <Text style={styles.lockedCopy}>Elite unlocks athletic conditioning systems tailored for competition, explosiveness, and sport performance.</Text>
        <TouchableOpacity style={styles.cta} onPress={() => router.push("/paywall")}>
          <Text style={styles.ctaText}>View Elite Plan</Text>
          <Ionicons name="arrow-forward" size={17} color={colors.black} />
        </TouchableOpacity>
      </AppLayout>
    );
  }

  return (
    <AppLayout scroll>
      <ScreenTitle title="Sports Mode" subtitle="Elite sport-specific athletic programming" />
      <View style={styles.grid}>
        {sports.map((sport) => {
          const active = selected === sport.name;
          return (
            <TouchableCard key={sport.name} radius={radii.xl} selected={active} style={styles.card} onPress={() => setSelected(sport.name)}>
              <View style={[styles.icon, active && styles.iconActive]}><Ionicons name={sport.icon} size={26} color={active ? colors.textPrimary : colors.gold} /></View>
              <Text style={styles.title}>{sport.name}</Text>
              <Text style={styles.copy}>{sport.focus}</Text>
            </TouchableCard>
          );
        })}
      </View>
      <TouchableOpacity style={[styles.cta, styles.activeCta]} onPress={() => router.push({ pathname: "/active-workout", params: { mode: selected } })}>
        <Text style={[styles.ctaText, styles.activeCtaText]}>Open {selected} Session</Text>
        <Ionicons name="arrow-forward" size={17} color={colors.textPrimary} />
      </TouchableOpacity>
      <EmptySpacer />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  lockedScreen: { alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  lockIcon: { alignItems: "center", backgroundColor: "rgba(255,199,51,0.12)", borderRadius: 35, height: 70, justifyContent: "center", width: 70 },
  lockedKicker: { color: colors.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 },
  lockedTitle: { color: colors.textPrimary, fontSize: 26, fontWeight: "900", textAlign: "center" },
  lockedCopy: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, maxWidth: 380, textAlign: "center" },
  grid: { gap: 12 },
  card: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 12, minHeight: 92, padding: 16 },
  icon: { alignItems: "center", backgroundColor: "rgba(255,199,51,0.10)", borderRadius: 16, height: 54, justifyContent: "center", width: 54 },
  iconActive: { backgroundColor: colors.accent },
  title: { color: colors.textPrimary, flex: 1, fontSize: 18, fontWeight: "900" },
  copy: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginLeft: 66, marginTop: -18 },
  cta: { alignItems: "center", backgroundColor: colors.gold, borderRadius: 15, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 56, paddingHorizontal: 20 },
  ctaText: { color: colors.black, fontSize: 15, fontWeight: "900" },
  activeCta: { backgroundColor: colors.accent },
  activeCtaText: { color: colors.textPrimary }
});
