import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { colors, radii } from "@/lib/theme";

type CheckoutParams = {
  billing?: string;
  plan?: string;
  status?: string;
};

const planNames: Record<string, string> = {
  elite: "FITNEO Elite",
  pro: "FITNEO Pro"
};

export default function CheckoutScreen() {
  const params = useLocalSearchParams<CheckoutParams>();
  const plan = typeof params.plan === "string" ? params.plan.toLowerCase() : "elite";
  const billing = typeof params.billing === "string" ? params.billing : "yearly";
  const planName = planNames[plan] ?? "FITNEO Upgrade";
  const setupRequired = params.status === "setup_required";

  return (
    <AppLayout contentContainerStyle={styles.screen}>
      <View style={styles.iconWrap}>
        <Ionicons name={setupRequired ? "card-outline" : "shield-checkmark"} size={34} color={colors.accent} />
      </View>
      <Text style={styles.kicker}>SECURE CHECKOUT</Text>
      <Text style={styles.title}>{setupRequired ? "Checkout setup required" : "Opening payment"}</Text>
      <Text style={styles.copy}>
        {setupRequired
          ? "FITNEO can open this page now, but live web payments need a real Stripe Payment Link or Checkout URL added in Vercel."
          : "Your selected payment plan is ready."}
      </Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Plan</Text>
          <Text style={styles.summaryValue}>{planName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Billing</Text>
          <Text style={styles.summaryValue}>{billing}</Text>
        </View>
      </View>

      {setupRequired ? (
        <View style={styles.envCard}>
          <Text style={styles.envTitle}>Add one of these in Vercel</Text>
          <Text style={styles.envLine}>EXPO_PUBLIC_STRIPE_PRO_CHECKOUT_URL</Text>
          <Text style={styles.envLine}>EXPO_PUBLIC_STRIPE_ELITE_CHECKOUT_URL</Text>
          <Text style={styles.envHint}>Use real Stripe hosted payment links. The old checkout.fitneo.app domain has no working DNS/deployment.</Text>
        </View>
      ) : null}

      <TouchableOpacity activeOpacity={0.86} style={styles.primary} onPress={() => router.replace("/paywall")}>
        <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
        <Text style={styles.primaryText}>Back to Upgrade</Text>
      </TouchableOpacity>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: "center", gap: 16, justifyContent: "center", paddingHorizontal: 20 },
  iconWrap: {
    alignItems: "center",
    backgroundColor: "rgba(0,163,255,0.12)",
    borderColor: "rgba(0,163,255,0.35)",
    borderRadius: 42,
    borderWidth: 1,
    height: 84,
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOpacity: 0.36,
    shadowRadius: 22,
    width: 84
  },
  kicker: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  title: { color: colors.textPrimary, fontSize: 30, fontWeight: "900", textAlign: "center" },
  copy: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, maxWidth: 420, textAlign: "center" },
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.045)",
    borderColor: colors.cardStroke,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: 12,
    padding: 16,
    width: "100%"
  },
  summaryRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: 12 },
  summaryLabel: { color: colors.textTertiary, fontSize: 12, fontWeight: "800" },
  summaryValue: { color: colors.textPrimary, fontSize: 14, fontWeight: "900", textTransform: "capitalize" },
  envCard: {
    backgroundColor: "rgba(255,199,51,0.10)",
    borderColor: "rgba(255,199,51,0.28)",
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: 8,
    padding: 16,
    width: "100%"
  },
  envTitle: { color: colors.gold, fontSize: 13, fontWeight: "900" },
  envLine: { color: colors.textPrimary, fontSize: 11, fontWeight: "800" },
  envHint: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 2 },
  primary: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 16,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 18,
    width: "100%"
  },
  primaryText: { color: colors.textPrimary, fontSize: 15, fontWeight: "900" }
});
