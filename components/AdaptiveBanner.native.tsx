import { StyleSheet, View } from "react-native";
import { AD_SLOT_HEIGHT } from "@/lib/theme";

type AdaptiveBannerProps = {
  enabled: boolean;
};

const productionBannerUnitId = process.env.EXPO_PUBLIC_ADMOB_BANNER_ID;

export function AdaptiveBanner({ enabled }: AdaptiveBannerProps) {
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
      return null;
    }

    return (
      <View style={styles.bannerHost} pointerEvents="box-none">
        <BannerAd unitId={unitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} onAdFailedToLoad={() => undefined} />
      </View>
    );
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  bannerHost: {
    alignItems: "center",
    height: AD_SLOT_HEIGHT,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%"
  }
});
