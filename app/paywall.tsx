import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/ScreenKit";
import { useSubscription } from "@/context/SubscriptionContext";
import { restoreBillingPurchases } from "@/lib/billing";
import { colors, radii } from "@/lib/theme";

type Tier = "pro" | "elite";

const OFFER_KEY = "fitneo.paywall.offer_seen_at.v1";

const planDetails = {
  pro: {
    name: "FITNEO Pro",
    icon: "sparkles" as const,
    monthly: 4.99,
    yearly: 39.99,
    color: colors.appBlueBright,
    features: ["Zero ads", "Full exercise library", "AI tracking metrics", "Workout + nutrition history"]
  },
  elite: {
    name: "FITNEO Elite",
    icon: "trophy" as const,
    monthly: 9.99,
    yearly: 79.99,
    color: colors.gold,
    features: ["Everything in Pro", "Sport-specific plans", "Priority AI coach", "Nutrition scanner boost"]
  }
};

export default function PaywallScreen() {
  const [tier, setTier] = useState<Tier>("elite");
  const [yearly, setYearly] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [offerChecked, setOfferChecked] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const { startSubscriptionCheckout, subscriptionPlatform } = useSubscription();
  const selected = planDetails[tier];

  useEffect(() => {
    void (async () => {
      const seen = await AsyncStorage.getItem(OFFER_KEY);
      setShowOffer(!seen);
      setOfferChecked(true);
    })();
  }, []);

  useEffect(() => {
    if (!showOffer) return;
    const timer = setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);
    return () => clearInterval(timer);
  }, [showOffer]);

  const price = useMemo(() => {
    if (!yearly) return { main: `$${selected.monthly.toFixed(2)}`, period: "/month", detail: "Flexible monthly billing" };
    return {
      main: `$${selected.yearly.toFixed(2)}`,
      period: "/year",
      detail: `$${(selected.yearly / 12).toFixed(2)} per month, billed annually`
    };
  }, [selected, yearly]);

  async function dismissOffer() {
    await AsyncStorage.setItem(OFFER_KEY, new Date().toISOString());
    setShowOffer(false);
  }

  async function checkout() {
    setIsLoading(true);
    setStatus(null);
    try {
      const response = await startSubscriptionCheckout(tier, yearly ? "yearly" : "monthly");
      setStatus(response.message);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Checkout could not start. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function restore() {
    setIsLoading(true);
    const response = await restoreBillingPurchases();
    setStatus(response.error ?? "Purchases restored.");
    setIsLoading(false);
  }

  if (!offerChecked) {
    return (
      <AppLayout contentContainerStyle={styles.loadingScreen}>
        <ActivityIndicator color={colors.gold} />
      </AppLayout>
    );
  }

  if (showOffer) {
    return (
      <View style={styles.offerRoot}>
        <LinearGradient colors={["#FF3B30", "#FF2D55", "#FF7A1A"]} style={StyleSheet.absoluteFillObject} />
        <ImageBackground
          source={{ uri: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=82" }}
          resizeMode="cover"
          style={styles.offerAthlete}
          imageStyle={styles.offerAthleteImage}
        />
        <TouchableOpacity style={styles.offerClose} onPress={() => void dismissOffer()}>
          <Ionicons name="close" size={28} color="rgba(255,255,255,0.76)" />
        </TouchableOpacity>
        <View style={styles.offerCopy}>
          <Text style={styles.offerKicker}>NEW USERS SPECIAL</Text>
          <View style={styles.offerLine} />
          <Text style={styles.offerBig}>30%</Text>
          <Text style={styles.offerBig}>OFF</Text>
        </View>
        <View style={styles.offerSheet}>
          <Text style={styles.timerText}>Offer expires in {formatCountdown(secondsLeft)}</Text>
          <Text style={styles.offerPrice}>Only $55.99/year <Text style={styles.oldPrice}>$79.99</Text></Text>
          <TouchableOpacity style={styles.offerButton} onPress={() => void dismissOffer()}>
            <Text style={styles.offerButtonText}>Continue</Text>
          </TouchableOpacity>
          <View style={styles.offerFooter}>
            <TouchableOpacity onPress={() => router.push("/legal/terms")}>
              <Text style={styles.offerFooterText}>Terms & Privacy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={restore}>
              <Text style={styles.offerFooterText}>Restore</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <AppLayout scroll contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={21} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade</Text>
        <View style={styles.backButtonGhost} />
      </View>

      <LinearGradient colors={["rgba(7,91,255,0.34)", "rgba(255,199,51,0.08)", "rgba(255,255,255,0.035)"]} style={styles.hero}>
        <View style={styles.crownOrb}>
          <Ionicons name="diamond" size={30} color={colors.gold} />
        </View>
        <Text style={styles.title}>Unlock Beast Mode</Text>
        <Text style={styles.subtitle}>Train without ads, generate sport plans, scan meals, and keep your full AI history.</Text>
        <View style={styles.socialProof}>
          <Ionicons name="star" size={15} color={colors.gold} />
          <Text style={styles.socialProofText}>4.9 rated by focused athletes</Text>
        </View>
      </LinearGradient>

      <View style={styles.planSwitch}>
        {(["pro", "elite"] as Tier[]).map((item) => {
          const active = tier === item;
          return (
            <TouchableOpacity key={item} onPress={() => setTier(item)} style={[styles.planTab, active && { borderColor: planDetails[item].color, backgroundColor: `${planDetails[item].color}22` }]}>
              <Text style={[styles.planTabTitle, active && styles.planTabTitleActive]}>{item === "pro" ? "Pro" : "Elite"}</Text>
              <Text style={[styles.planTabPrice, { color: planDetails[item].color }]}>
                ${(yearly ? planDetails[item].yearly / 12 : planDetails[item].monthly).toFixed(2)}/mo
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.billingRow}>
        <Text style={!yearly ? styles.billingActive : styles.billingMuted}>Monthly</Text>
        <TouchableOpacity accessibilityRole="switch" accessibilityState={{ checked: yearly }} onPress={() => setYearly((current) => !current)} style={[styles.toggle, yearly && styles.toggleActive]}>
          <View style={[styles.knob, yearly && styles.knobActive]} />
        </TouchableOpacity>
        <Text style={yearly ? styles.billingActive : styles.billingMuted}>Yearly</Text>
        {yearly ? <Text style={styles.save}>SAVE 33%</Text> : null}
      </View>

      <GlassCard radius={26} style={[styles.planCard, { borderColor: `${selected.color}88` }]}>
        <View style={styles.planHeader}>
          <Ionicons name={selected.icon} size={21} color={selected.color} />
          <Text style={styles.planName}>{selected.name}</Text>
          {tier === "elite" ? <Text style={styles.best}>BEST VALUE</Text> : null}
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{price.main}</Text>
          <Text style={styles.period}>{price.period}</Text>
        </View>
        <Text style={styles.breakdown}>{price.detail}</Text>
        <Text style={styles.paymentNote}>
          {subscriptionPlatform === "web" ? "Secure web payment via your configured checkout provider." : "Native checkout uses RevenueCat."}
        </Text>
        {selected.features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={18} color={selected.color} />
            <Text style={styles.feature}>{feature}</Text>
          </View>
        ))}
      </GlassCard>

      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: selected.color }]} onPress={checkout} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color={tier === "elite" ? colors.black : colors.textPrimary} /> : (
          <>
            <Ionicons name="sparkles" size={18} color={tier === "elite" ? colors.black : colors.textPrimary} />
            <Text style={[styles.primaryText, tier === "elite" && styles.primaryTextDark]}>Proceed to Payment</Text>
          </>
        )}
      </TouchableOpacity>
      {status ? <Text style={styles.status}>{status}</Text> : null}
      <Text style={styles.disclaimer}>Cancel anytime. Your plan activates after payment confirmation.</Text>
      <TouchableOpacity onPress={restore} disabled={isLoading}>
        <Text style={styles.restore}>Restore Purchases</Text>
      </TouchableOpacity>
    </AppLayout>
  );
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

const styles = StyleSheet.create({
  loadingScreen: { alignItems: "center", justifyContent: "center" },
  screen: { gap: 16 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  backButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 19, height: 38, justifyContent: "center", width: 38 },
  backButtonGhost: { height: 38, width: 38 },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "900" },
  hero: { alignItems: "center", borderColor: "rgba(255,255,255,0.10)", borderRadius: 28, borderWidth: 1, gap: 10, overflow: "hidden", padding: 22 },
  crownOrb: { alignItems: "center", backgroundColor: "rgba(255,199,51,0.14)", borderRadius: 38, height: 76, justifyContent: "center", width: 76 },
  title: { color: colors.textPrimary, fontSize: 30, fontWeight: "900", letterSpacing: -1 },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: "center" },
  socialProof: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.24)", borderRadius: 999, flexDirection: "row", gap: 7, marginTop: 4, paddingHorizontal: 12, paddingVertical: 7 },
  socialProofText: { color: colors.textPrimary, fontSize: 12, fontWeight: "800" },
  planSwitch: { flexDirection: "row", gap: 10 },
  planTab: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderColor: colors.cardStroke, borderRadius: 18, borderWidth: 1, flex: 1, gap: 3, paddingVertical: 13 },
  planTabTitle: { color: colors.textSecondary, fontSize: 15, fontWeight: "900" },
  planTabTitleActive: { color: colors.textPrimary },
  planTabPrice: { fontSize: 11, fontWeight: "900" },
  billingRow: { alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "center" },
  billingMuted: { color: colors.textTertiary, fontSize: 13, fontWeight: "700" },
  billingActive: { color: colors.textPrimary, fontSize: 13, fontWeight: "900" },
  toggle: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, height: 32, justifyContent: "center", paddingHorizontal: 3, width: 56 },
  toggleActive: { backgroundColor: colors.appBlueBright },
  knob: { backgroundColor: colors.textPrimary, borderRadius: 13, height: 26, width: 26 },
  knobActive: { alignSelf: "flex-end" },
  save: { backgroundColor: "rgba(50,215,77,0.14)", borderRadius: 8, color: colors.success, fontSize: 9, fontWeight: "900", overflow: "hidden", paddingHorizontal: 7, paddingVertical: 4 },
  planCard: { gap: 13, padding: 20 },
  planHeader: { alignItems: "center", flexDirection: "row", gap: 9 },
  planName: { color: colors.textPrimary, flex: 1, fontSize: 20, fontWeight: "900" },
  best: { backgroundColor: colors.gold, borderRadius: 8, color: colors.black, fontSize: 8, fontWeight: "900", overflow: "hidden", paddingHorizontal: 7, paddingVertical: 4 },
  priceRow: { alignItems: "baseline", flexDirection: "row", gap: 4 },
  price: { color: colors.textPrimary, fontSize: 34, fontWeight: "900" },
  period: { color: colors.textSecondary, fontSize: 14 },
  breakdown: { color: colors.teal, fontSize: 13, fontWeight: "800" },
  paymentNote: { color: colors.textTertiary, fontSize: 11, lineHeight: 16 },
  featureRow: { alignItems: "flex-start", flexDirection: "row", gap: 9 },
  feature: { color: colors.textSecondary, flex: 1, fontSize: 13, lineHeight: 19 },
  primaryButton: { alignItems: "center", borderRadius: 18, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 58 },
  primaryText: { color: colors.textPrimary, fontSize: 16, fontWeight: "900" },
  primaryTextDark: { color: colors.black },
  status: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: "center" },
  disclaimer: { color: colors.textTertiary, fontSize: 11, textAlign: "center" },
  restore: { color: colors.appBlueBright, fontSize: 13, fontWeight: "900", textAlign: "center" },
  offerRoot: { backgroundColor: "#FF2D55", flex: 1, overflow: "hidden" },
  offerAthlete: { bottom: 210, opacity: 0.48, position: "absolute", right: -60, top: 70, width: "70%" },
  offerAthleteImage: { borderBottomLeftRadius: 120 },
  offerClose: { alignItems: "center", borderRadius: 24, height: 48, justifyContent: "center", position: "absolute", right: 20, top: 54, width: 48, zIndex: 2 },
  offerCopy: { flex: 1, justifyContent: "center", paddingHorizontal: 34, paddingTop: 30 },
  offerKicker: { color: "#FFF7EC", fontSize: 42, fontWeight: "900", letterSpacing: -1, lineHeight: 44, maxWidth: 250 },
  offerLine: { backgroundColor: "#FFF7EC", height: 7, marginBottom: 24, marginTop: 18, width: 88 },
  offerBig: { color: "#FFF7EC", fontSize: 116, fontWeight: "900", letterSpacing: -7, lineHeight: 108 },
  offerSheet: { backgroundColor: "#FFFDF8", borderTopLeftRadius: 32, borderTopRightRadius: 32, gap: 14, padding: 28 },
  timerText: { color: "#7A3445", fontSize: 12, fontWeight: "900", letterSpacing: 1, textAlign: "center", textTransform: "uppercase" },
  offerPrice: { color: "#101010", fontSize: 18, fontWeight: "900", textAlign: "center" },
  oldPrice: { color: "rgba(0,0,0,0.34)", textDecorationLine: "line-through" },
  offerButton: { alignItems: "center", backgroundColor: "#EC2D5A", borderRadius: 17, justifyContent: "center", minHeight: 58 },
  offerButtonText: { color: colors.textPrimary, fontSize: 20, fontWeight: "900" },
  offerFooter: { flexDirection: "row", justifyContent: "space-between" },
  offerFooterText: { color: "rgba(0,0,0,0.62)", fontSize: 13, fontWeight: "800", textDecorationLine: "underline" }
});
