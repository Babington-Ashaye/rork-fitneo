import { useEffect } from "react";
import { AppState } from "react-native";

const productionUnitId = process.env.EXPO_PUBLIC_ADMOB_APP_OPEN_ID;

export function AppOpenAdGate() {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const ads = require("react-native-google-mobile-ads");
      const unitId = __DEV__ ? ads.TestIds.APP_OPEN : productionUnitId;
      if (!unitId) return;
      const appOpenAd = ads.AppOpenAd.createForAdRequest(unitId, {
        requestNonPersonalizedAdsOnly: true
      });
      let loaded = false;
      const removeLoaded = appOpenAd.addAdEventListener(ads.AdEventType.LOADED, () => {
        loaded = true;
        void appOpenAd.show();
      });
      const subscription = AppState.addEventListener("change", (state) => {
        if (state !== "active") return;
        if (loaded) {
          loaded = false;
          void appOpenAd.show();
        } else {
          appOpenAd.load();
        }
      });
      appOpenAd.load();
      unsubscribe = () => {
        removeLoaded();
        subscription.remove();
      };
    } catch {
      // Native ads are unavailable in Expo Go and web builds.
    }
    return () => unsubscribe?.();
  }, []);

  return null;
}
