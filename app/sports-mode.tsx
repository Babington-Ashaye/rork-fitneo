import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { EmptySpacer, ScreenTitle, TouchableCard } from "@/components/ScreenKit";
import { colors, radii } from "@/lib/theme";

const sports = [
  { name: "Football", icon: "football" as const, focus: "Speed, agility and match endurance" },
  { name: "Basketball", icon: "basketball" as const, focus: "Explosiveness, vertical power and conditioning" },
  { name: "Running", icon: "walk" as const, focus: "Pace, aerobic base and resilient legs" },
  { name: "Combat", icon: "fitness" as const, focus: "Rotational power, stamina and mobility" }
];

export default function SportsModeScreen() {
  const [selected, setSelected] = useState("Football");
  return (
    <AppLayout scroll>
      <View style={styles.debugBadge}><Ionicons name="construct" size={13} color={colors.gold} /><Text style={styles.debugText}>DEV ACCESS ENABLED</Text></View>
      <ScreenTitle title="Sports Mode" subtitle="Sport-specific athletic programming is unlocked for review." />
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
      <TouchableOpacity style={styles.cta} onPress={() => router.push({ pathname: "/active-workout", params: { mode: selected } })}>
        <Text style={styles.ctaText}>Open {selected} Session</Text>
        <Ionicons name="arrow-forward" size={17} color={colors.textPrimary} />
      </TouchableOpacity>
      <EmptySpacer />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  debugBadge: { alignItems: "center", alignSelf: "flex-start", backgroundColor: "rgba(255,199,51,0.12)", borderRadius: 20, flexDirection: "row", gap: 6, paddingHorizontal: 10, paddingVertical: 6 },
  debugText: { color: colors.gold, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  grid: { gap: 12 },
  card: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 12, minHeight: 92, padding: 16 },
  icon: { alignItems: "center", backgroundColor: "rgba(255,199,51,0.10)", borderRadius: 16, height: 54, justifyContent: "center", width: 54 },
  iconActive: { backgroundColor: colors.accent },
  title: { color: colors.textPrimary, flex: 1, fontSize: 18, fontWeight: "900" },
  copy: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginLeft: 66, marginTop: -18 },
  cta: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 15, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 56 },
  ctaText: { color: colors.textPrimary, fontSize: 15, fontWeight: "900" }
});
