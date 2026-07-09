import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { AppLayout } from "@/components/AppLayout";
import {
  CheckoutTier,
  RevenueCatActiveTier,
  useSubscription
} from "@/context/SubscriptionContext";
import { colors, radii } from "@/lib/theme";

type Action = "status" | "pro" | "elite";

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String(error.message);
  }
  return "An unknown RevenueCat error occurred.";
}

export default function SubscriptionTestScreen() {
  const {
    tier: contextTier,
    subscriptionPlatform,
    checkSubscriptionStatus,
    startSubscriptionCheckout
  } = useSubscription();
  const [activeTier, setActiveTier] = useState<RevenueCatActiveTier>(
    contextTier === "elite" ? "Elite" : contextTier === "pro" ? "Pro" : "None"
  );
  const [busyAction, setBusyAction] = useState<Action | null>(null);
  const [result, setResult] = useState(
    subscriptionPlatform === "web"
      ? "Tap a checkout button to redirect to the web billing placeholder."
      : "Tap Check Status to retrieve the latest RevenueCat customer information."
  );

  async function checkStatus(): Promise<void> {
    setBusyAction("status");
    try {
      const status = await checkSubscriptionStatus();
      const formatted = JSON.stringify(status.activeEntitlements, null, 2);

      setActiveTier(status.activeTier);
      setResult(`${status.message}\n\nActive entitlements:\n${formatted}`);
      Alert.alert("Subscription status", `${status.message}\n\n${formatted}`);
    } catch (error) {
      const message = formatError(error);
      setResult(`Status check failed:\n${message}`);
      Alert.alert("Subscription error", message);
    } finally {
      setBusyAction(null);
    }
  }

  async function purchaseTier(tier: CheckoutTier): Promise<void> {
    setBusyAction(tier);
    try {
      setResult(`Opening ${tier.toUpperCase()} checkout...`);
      const checkout = await startSubscriptionCheckout(tier);
      const formatted = JSON.stringify(checkout.activeEntitlements, null, 2);

      setActiveTier(checkout.activeTier);
      setResult(
        `${checkout.message}${
          checkout.checkoutUrl ? `\n\nCheckout URL:\n${checkout.checkoutUrl}` : ""
        }\n\nActive entitlements:\n${formatted}`
      );

      if (checkout.platform === "native") {
        Alert.alert("Purchase completed", `Active tier: ${checkout.activeTier}`);
      }
    } catch (error) {
      const message = formatError(error);
      setResult(`${tier.toUpperCase()} checkout failed:\n${message}`);
      Alert.alert("Checkout error", message);
    } finally {
      setBusyAction(null);
    }
  }

  function ActionButton({
    action,
    icon,
    label,
    onPress,
    variant = "default"
  }: {
    action: Action;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    variant?: "default" | "pro" | "elite";
  }) {
    const isBusy = busyAction === action;
    const isElite = variant === "elite";

    return (
      <TouchableOpacity
        accessibilityRole="button"
        disabled={busyAction !== null}
        onPress={onPress}
        style={[
          styles.button,
          variant === "pro" && styles.proButton,
          isElite && styles.eliteButton,
          busyAction !== null && styles.buttonDisabled
        ]}
      >
        {isBusy ? (
          <ActivityIndicator color={isElite ? colors.black : colors.textPrimary} />
        ) : (
          <Ionicons
            name={icon}
            size={20}
            color={isElite ? colors.black : colors.textPrimary}
          />
        )}
        <Text style={[styles.buttonText, isElite && styles.eliteButtonText]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <AppLayout scroll>
      <View style={styles.heading}>
        <View style={styles.iconWrap}>
          <Ionicons name="card" size={29} color={colors.accent} />
        </View>
        <Text style={styles.eyebrow}>REVENUECAT SANDBOX</Text>
        <Text style={styles.title}>Subscription Testing</Text>
        <Text style={styles.subtitle}>
          {subscriptionPlatform === "web"
            ? "Web mode bypasses the native SDK and redirects to checkout placeholders."
            : "Native mode uses the RevenueCat SDK for sandbox checkout testing."}
        </Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>CURRENT SUBSCRIPTION</Text>
        <Text style={styles.activeTier}>Active Tier: {activeTier}</Text>
        <Text style={styles.contextTier}>FITNEO context tier: {contextTier}</Text>
        <Text style={styles.contextTier}>Runtime: {subscriptionPlatform}</Text>
      </View>

      <View style={styles.actions}>
        <ActionButton
          action="status"
          icon="refresh"
          label="Check Status"
          onPress={() => void checkStatus()}
        />
        <ActionButton
          action="pro"
          icon="sparkles"
          label="Trigger Pro Checkout"
          onPress={() => void purchaseTier("pro")}
          variant="pro"
        />
        <ActionButton
          action="elite"
          icon="diamond"
          label="Trigger Elite Checkout"
          onPress={() => void purchaseTier("elite")}
          variant="elite"
        />
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.resultLabel}>LATEST RESULT</Text>
        <Text selectable style={styles.resultText}>
          {result}
        </Text>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  heading: { alignItems: "center", gap: 7, paddingVertical: 8 },
  iconWrap: {
    alignItems: "center",
    backgroundColor: "rgba(10,132,255,0.14)",
    borderRadius: 30,
    height: 60,
    justifyContent: "center",
    marginBottom: 3,
    width: 60
  },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: colors.textPrimary, fontSize: 27, fontWeight: "900" },
  subtitle: { color: colors.textSecondary, fontSize: 13, textAlign: "center" },
  statusCard: {
    alignItems: "center",
    backgroundColor: colors.cardFill,
    borderColor: colors.cardStroke,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: 7,
    padding: 22
  },
  statusLabel: { color: colors.textTertiary, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  activeTier: { color: colors.textPrimary, fontSize: 24, fontWeight: "900" },
  contextTier: { color: colors.textSecondary, fontSize: 12, textTransform: "capitalize" },
  actions: { gap: 12 },
  button: {
    alignItems: "center",
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.cardStroke,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 16
  },
  proButton: { backgroundColor: colors.accent, borderColor: colors.accent },
  eliteButton: { backgroundColor: colors.gold, borderColor: colors.gold },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: colors.textPrimary, fontSize: 15, fontWeight: "800" },
  eliteButtonText: { color: colors.black },
  resultCard: {
    backgroundColor: "rgba(0,0,0,0.24)",
    borderColor: colors.cardStroke,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 9,
    padding: 16
  },
  resultLabel: { color: colors.teal, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  resultText: {
    color: colors.textSecondary,
    fontFamily: "monospace",
    fontSize: 11,
    lineHeight: 17
  }
});
