import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/ScreenKit";
import { useSubscription } from "@/context/SubscriptionContext";
import { restoreBillingPurchases } from "@/lib/billing";
import { colors, radii } from "@/lib/theme";

type Tier = "pro" | "elite";

const planDetails = {
  pro: {
    name: "FITNEO Pro",
    icon: "sparkles" as const,
    monthly: 4.99,
    yearly: 39.99,
    features: [
      "Zero ads across FITNEO",
      "Complete local and GitHub exercise library",
      "Advanced AI tracking metrics",
      "Full workout, nutrition, and chat history"
    ]
  },
  elite: {
    name: "FITNEO Elite",
    icon: "trophy" as const,
    monthly: 9.99,
    yearly: 79.99,
    features: [
      "Everything in Pro",
      "Sport-specific athletic programming",
      "Premier Elite Physique conditioning systems",
      "Priority AI coaching and nutrition scanner"
    ]
  }
};

export default function PaywallScreen() {
  const [tier, setTier] = useState<Tier>("elite");
  const [yearly, setYearly] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { startSubscriptionCheckout, subscriptionPlatform } = useSubscription();
  const selected = planDetails[tier];

  const price = useMemo(() => {
    if (!yearly) {
      return { main: `$${selected.monthly.toFixed(2)}`, period: "/month", detail: null };
    }
    return {
      main: `$${selected.yearly.toFixed(2)}`,
      period: "/year",
      detail: `$${(selected.yearly / 12).toFixed(2)} per month, billed annually`
    };
  }, [selected, yearly]);

  async function checkout() {
    setIsLoading(true);
    setStatus(null);
    try {
      const response = await startSubscriptionCheckout(tier, yearly ? "yearly" : "monthly");
      setStatus(
        response.platform === "web"
          ? `Redirecting to secure ${tier.toUpperCase()} web checkout.`
          : `Native checkout completed. Active tier: ${response.activeTier}.`
      );
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Checkout could not start.");
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

  return (
    <AppLayout scroll>
      <View style={styles.logoWrap}>
        <View style={styles.logoGlow}>
          <Ionicons name="diamond" size={34} color={colors.accent} />
        </View>
        <Text style={styles.title}>Choose Your Plan</Text>
        <Text style={styles.subtitle}>
          {subscriptionPlatform === "web"
            ? "Web checkout redirects to the secure Stripe payment gateway."
            : "Android native testing uses the RevenueCat SDK checkout."}
        </Text>
      </View>

      <View style={styles.tabs}>
        {(["pro", "elite"] as Tier[]).map((item) => (
          <TouchableOpacity key={item} onPress={() => setTier(item)} style={[styles.tab, tier === item && (item === "elite" ? styles.tabEliteActive : styles.tabProActive)]}>
            <Text style={[styles.tabTitle, tier === item && styles.tabTitleActive]}>{item === "pro" ? "Pro" : "Elite"}</Text>
            <Text style={[styles.tabPrice, item === "elite" && styles.elitePrice]}>${(yearly ? planDetails[item].yearly / 12 : planDetails[item].monthly).toFixed(2)}/mo</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.billingRow}>
        <Text style={!yearly ? styles.billingActive : styles.billingMuted}>Monthly</Text>
        <TouchableOpacity accessibilityRole="switch" accessibilityState={{ checked: yearly }} onPress={() => setYearly((current) => !current)} style={[styles.toggle, yearly && styles.toggleActive]}>
          <View style={[styles.knob, yearly && styles.knobActive]} />
        </TouchableOpacity>
        <Text style={yearly ? styles.billingActive : styles.billingMuted}>Yearly</Text>
        {yearly ? <Text style={styles.save}>SAVE 33%</Text> : null}
      </View>

      <GlassCard radius={radii.xxl} style={[styles.planCard, tier === "elite" ? styles.eliteCard : styles.proCard]}>
        <View style={styles.planHeader}>
          <Ionicons name={selected.icon} size={19} color={tier === "elite" ? colors.gold : colors.accent} />
          <Text style={styles.planName}>{selected.name}</Text>
          {tier === "elite" ? <Text style={styles.best}>BEST VALUE</Text> : null}
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{price.main}</Text>
          <Text style={styles.period}>{price.period}</Text>
        </View>
        {price.detail ? <Text style={styles.breakdown}>{price.detail}</Text> : null}
        {selected.features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={17} color={tier === "elite" ? colors.gold : colors.accent} />
            <Text style={styles.feature}>{feature}</Text>
          </View>
        ))}
      </GlassCard>

      <TouchableOpacity style={[styles.primaryButton, tier === "elite" && styles.eliteButton]} onPress={checkout} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color={tier === "elite" ? colors.black : colors.textPrimary} /> : (
          <>
            <Ionicons name="sparkles" size={17} color={tier === "elite" ? colors.black : colors.textPrimary} />
            <Text style={[styles.primaryText, tier === "elite" && styles.eliteButtonText]}>Proceed to Payment</Text>
          </>
        )}
      </TouchableOpacity>
      {status ? <Text style={styles.status}>{status}</Text> : null}
      <Text style={styles.disclaimer}>No charge today. Cancel anytime before renewal.</Text>
      <TouchableOpacity onPress={restore} disabled={isLoading}>
        <Text style={styles.restore}>Restore Purchases</Text>
      </TouchableOpacity>
      <View style={styles.freePlan}>
        <Text style={styles.freeTitle}>FREE PLAN</Text>
        <Text style={styles.freeCopy}>Core metrics · 31 foundational exercises · standard tracking · inline ads</Text>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  logoWrap: { alignItems: "center", gap: 9 },
  logoGlow: { alignItems: "center", backgroundColor: "rgba(10,132,255,0.14)", borderRadius: 38, height: 76, justifyContent: "center", width: 76 },
  title: { color: colors.textPrimary, fontSize: 27, fontWeight: "900" },
  subtitle: { color: colors.textSecondary, fontSize: 14 },
  tabs: { flexDirection: "row", gap: 10 },
  tab: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.035)", borderColor: colors.cardStroke, borderRadius: 14, borderWidth: 1, flex: 1, gap: 3, paddingVertical: 12 },
  tabProActive: { backgroundColor: "rgba(10,132,255,0.16)", borderColor: "rgba(10,132,255,0.75)" },
  tabEliteActive: { backgroundColor: "rgba(255,215,0,0.14)", borderColor: "rgba(255,215,0,0.80)" },
  tabTitle: { color: colors.textSecondary, fontSize: 15, fontWeight: "800" },
  tabTitleActive: { color: colors.textPrimary },
  tabPrice: { color: colors.accent, fontSize: 11, fontWeight: "700" },
  elitePrice: { color: colors.gold },
  billingRow: { alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "center" },
  billingMuted: { color: colors.textTertiary, fontSize: 13 },
  billingActive: { color: colors.textPrimary, fontSize: 13, fontWeight: "800" },
  toggle: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 15, height: 30, justifyContent: "center", paddingHorizontal: 3, width: 52 },
  toggleActive: { backgroundColor: colors.accent },
  knob: { backgroundColor: colors.textPrimary, borderRadius: 12, height: 24, width: 24 },
  knobActive: { alignSelf: "flex-end" },
  save: { backgroundColor: "rgba(50,215,77,0.14)", borderRadius: 8, color: colors.success, fontSize: 9, fontWeight: "900", overflow: "hidden", paddingHorizontal: 7, paddingVertical: 4 },
  planCard: { gap: 13, padding: 20 },
  proCard: { backgroundColor: "rgba(10,132,255,0.12)", borderColor: "rgba(10,132,255,0.60)" },
  eliteCard: { backgroundColor: "rgba(255,199,51,0.10)", borderColor: "rgba(255,215,0,0.72)", shadowColor: colors.gold, shadowOpacity: 0.28, shadowRadius: 18 },
  planHeader: { alignItems: "center", flexDirection: "row", gap: 9 },
  planName: { color: colors.textPrimary, flex: 1, fontSize: 20, fontWeight: "900" },
  best: { backgroundColor: colors.gold, borderRadius: 8, color: colors.black, fontSize: 8, fontWeight: "900", overflow: "hidden", paddingHorizontal: 7, paddingVertical: 4 },
  priceRow: { alignItems: "baseline", flexDirection: "row", gap: 4 },
  price: { color: colors.textPrimary, fontSize: 30, fontWeight: "900" },
  period: { color: colors.textSecondary, fontSize: 13 },
  breakdown: { color: colors.teal, fontSize: 12, fontWeight: "700" },
  featureRow: { alignItems: "flex-start", flexDirection: "row", gap: 9 },
  feature: { color: colors.textSecondary, flex: 1, fontSize: 13, lineHeight: 19 },
  primaryButton: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 14, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 54 },
  eliteButton: { backgroundColor: colors.gold },
  primaryText: { color: colors.textPrimary, fontSize: 15, fontWeight: "900" },
  eliteButtonText: { color: colors.black },
  status: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: "center" },
  disclaimer: { color: colors.textTertiary, fontSize: 11, textAlign: "center" },
  restore: { color: colors.accent, fontSize: 13, fontWeight: "800", textAlign: "center" }
  ,
  freePlan: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.025)", borderColor: colors.cardStroke, borderRadius: 14, borderWidth: 1, gap: 5, padding: 13 },
  freeTitle: { color: colors.textTertiary, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  freeCopy: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, textAlign: "center" }
});
