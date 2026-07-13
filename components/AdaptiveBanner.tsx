import { StyleSheet, Text, View } from "react-native";
import { AD_SLOT_HEIGHT, colors } from "@/lib/theme";

type AdaptiveBannerProps = {
  enabled: boolean;
  label?: string;
};

// Web fallback. Native builds load AdaptiveBanner.native.tsx.
export function AdaptiveBanner({ enabled, label = "Sponsored training boost" }: AdaptiveBannerProps) {
  if (!enabled) return null;

  return (
    <View style={styles.bannerHost}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>AD</Text>
      </View>
      <View style={styles.copyBlock}>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.copy}>Upgrade FITNEO or connect AdMob IDs to replace this with live ads.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerHost: {
    alignItems: "center",
    backgroundColor: "rgba(10,132,255,0.10)",
    borderColor: "rgba(10,132,255,0.26)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: AD_SLOT_HEIGHT,
    overflow: "hidden",
    paddingHorizontal: 14,
    width: "100%"
  },
  badge: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 8,
    height: 24,
    justifyContent: "center",
    width: 34
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900"
  },
  copyBlock: {
    flex: 1
  },
  title: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900"
  },
  copy: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2
  }
});
