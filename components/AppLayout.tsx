import { ReactNode } from "react";
import { router } from "expo-router";
import {
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageGradient } from "@/components/ScreenKit";
import { useSubscription } from "@/context/SubscriptionContext";
import { colors, radii, spacing } from "@/lib/theme";

type AppLayoutProps = {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, "contentContainerStyle" | "children" | "refreshControl">;
  refreshControl?: ScrollViewProps["refreshControl"];
};

export function AppLayout({
  children,
  scroll = false,
  contentContainerStyle,
  style,
  scrollProps,
  refreshControl
}: AppLayoutProps) {
  const insets = useSafeAreaInsets();
  const { isTrial, trialDaysRemaining } = useSubscription();
  const trialBanner = isTrial ? <TrialBanner daysRemaining={trialDaysRemaining} /> : null;

  return (
    <PageGradient style={[styles.root, style]}>
      <View style={styles.contentRegion}>
        {scroll ? (
          <ScrollView
            {...scrollProps}
            refreshControl={refreshControl}
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: Math.max(spacing.bottomClearance, insets.bottom + 112),
                paddingTop: Math.max(12, insets.top + 8)
              },
              contentContainerStyle
            ]}
          >
            {trialBanner}
            {children}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.staticContent,
              {
                paddingBottom: Math.max(16, insets.bottom + 12),
                paddingTop: Math.max(12, insets.top + 8)
              },
              contentContainerStyle
            ]}
          >
            {trialBanner}
            {children}
          </View>
        )}
      </View>
    </PageGradient>
  );
}

function TrialBanner({ daysRemaining }: { daysRemaining: number }) {
  return (
    <View style={styles.trialBanner}>
      <Text style={styles.trialEyebrow}>FREE TRIAL</Text>
      <Text style={styles.trialText}>
        {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left in your free trial
      </Text>
      <TouchableOpacity activeOpacity={0.78} style={styles.trialUpgrade} onPress={() => router.push("/paywall")}>
        <Text style={styles.trialUpgradeText}>Upgrade</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    maxWidth: "100%",
    width: "100%"
  },
  contentRegion: {
    flex: 1,
    maxWidth: "100%",
    overflow: "hidden",
    width: "100%"
  },
  scroll: {
    flex: 1,
    maxWidth: "100%",
    width: "100%"
  },
  scrollContent: {
    flexGrow: 1,
    gap: 18,
    maxWidth: "100%",
    paddingHorizontal: spacing.screen,
    paddingTop: 8,
    width: "100%"
  },
  staticContent: {
    flex: 1,
    gap: 18,
    maxWidth: "100%",
    paddingHorizontal: spacing.screen,
    paddingTop: 8,
    width: "100%"
  },
  trialBanner: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "rgba(0,163,255,0.10)",
    borderColor: "rgba(0,163,255,0.24)",
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    minHeight: 38,
    paddingHorizontal: 14
  },
  trialEyebrow: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3
  },
  trialText: {
    color: colors.textSecondary,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700"
  },
  trialUpgrade: {
    borderColor: "rgba(0,163,255,0.30)",
    borderRadius: radii.round,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  trialUpgradeText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "900"
  }
});
