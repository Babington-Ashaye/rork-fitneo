import { StyleSheet, Text, View } from "react-native";
import { AD_SLOT_HEIGHT, colors } from "@/lib/theme";

type AdaptiveBannerProps = {
  enabled: boolean;
  label?: string;
};

const productionBannerUnitId = process.env.EXPO_PUBLIC_ADMOB_BANNER_ID;

function FallbackBanner({ label = "Sponsored training boost" }: { label?: string }) {
  return (
    <View style={styles.fallbackHost}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>AD</Text>
      </View>
      <View style={styles.copyBlock}>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.copy}>Premium fitness picks appear here while live ads are being prepared.</Text>
      </View>
    </View>
  );
}

export function AdaptiveBanner({ enabled, label }: AdaptiveBannerProps) {
  if (!enabled) {
    return null;
  }

  try {
    const ads = require("react-native-google-mobile-ads");
    const BannerAd = ads.BannerAd;
    const BannerAdSize = ads.BannerAdSize;
    const TestIds = ads.TestIds;
    const unitId = __DEV__ ? TestIds.ADAPTIVE_BANNER : productionBannerUnitId;
    if (!unitId) {
      return <FallbackBanner label={label} />;
    }

    return (
      <View style={styles.bannerHost} pointerEvents="box-none">
        <BannerAd unitId={unitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} onAdFailedToLoad={() => undefined} />
      </View>
    );
  } catch {
    return <FallbackBanner label={label} />;
  }
}

const styles = StyleSheet.create({
  bannerHost: {
    alignItems: "center",
    height: AD_SLOT_HEIGHT,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%"
  },
  fallbackHost: {
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
