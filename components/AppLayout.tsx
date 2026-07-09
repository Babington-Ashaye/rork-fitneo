import { ReactNode } from "react";
import {
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageGradient } from "@/components/ScreenKit";
import { AdaptiveBanner } from "@/components/AdaptiveBanner";
import { AD_SLOT_HEIGHT, colors, spacing } from "@/lib/theme";
import { useSubscription } from "@/context/SubscriptionContext";

type AppLayoutProps = {
  children: ReactNode;
  adSlot?: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, "contentContainerStyle" | "children" | "refreshControl">;
  refreshControl?: ScrollViewProps["refreshControl"];
};

export function AppLayout({
  children,
  adSlot,
  scroll = false,
  contentContainerStyle,
  style,
  scrollProps,
  refreshControl
}: AppLayoutProps) {
  const insets = useSafeAreaInsets();
  const { isFreeExpired } = useSubscription();
  const reservedHeight = isFreeExpired ? AD_SLOT_HEIGHT : 0;

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
                paddingBottom: spacing.bottomClearance + reservedHeight,
                paddingTop: Math.max(12, insets.top + 8)
              },
              contentContainerStyle
            ]}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.staticContent, { paddingTop: Math.max(12, insets.top + 8) }, contentContainerStyle]}>{children}</View>
        )}
      </View>

      {isFreeExpired ? (
        <View style={[styles.adSlot, { paddingBottom: Math.min(insets.bottom, 8) }]} pointerEvents="box-none">
          <View style={styles.adSlotInner}>
            {adSlot ?? <AdaptiveBanner enabled />}
          </View>
        </View>
      ) : null}
    </PageGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  contentRegion: {
    flex: 1,
    overflow: "hidden"
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    gap: 18,
    paddingHorizontal: spacing.screen,
    paddingTop: 8
  },
  staticContent: {
    flex: 1,
    gap: 18,
    paddingHorizontal: spacing.screen,
    paddingTop: 8
  },
  adSlot: {
    alignItems: "center",
    backgroundColor: "rgba(6,9,20,0.96)",
    borderTopColor: "rgba(255,255,255,0.10)",
    borderTopWidth: 1,
    height: AD_SLOT_HEIGHT,
    justifyContent: "center",
    paddingHorizontal: spacing.screen,
    width: "100%"
  },
  adSlotInner: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderColor: "rgba(10,132,255,0.35)",
    borderRadius: 14,
    borderStyle: "dashed",
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%"
  },
  adPlaceholder: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8
  }
});
