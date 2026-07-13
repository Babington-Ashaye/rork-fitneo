module.exports = ({ config }) => {
  const androidAdMobAppId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID;
  const iosAdMobAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID;
  const isReleaseProfile =
    process.env.FITNEO_REQUIRE_REAL_ADMOB === "true" ||
    ["preview", "production"].includes(process.env.EAS_BUILD_PROFILE);

  if (isReleaseProfile && !androidAdMobAppId) {
    throw new Error(
      "EXPO_PUBLIC_ADMOB_ANDROID_APP_ID is required for EAS preview/production Android builds."
    );
  }

  if (isReleaseProfile && !iosAdMobAppId) {
    throw new Error(
      "EXPO_PUBLIC_ADMOB_IOS_APP_ID is required for EAS preview/production iOS builds."
    );
  }

  const resolvedAndroidAdMobAppId =
    androidAdMobAppId ||
    (!isReleaseProfile ? "ca-app-pub-3940256099942544~3347511713" : undefined);
  const resolvedIosAdMobAppId =
    iosAdMobAppId ||
    (!isReleaseProfile ? "ca-app-pub-3940256099942544~1458002511" : undefined);

  const plugins = [...(config.plugins ?? [])];

  if (resolvedAndroidAdMobAppId || resolvedIosAdMobAppId) {
    plugins.push([
      "react-native-google-mobile-ads",
      {
        androidAppId: resolvedAndroidAdMobAppId,
        iosAppId: resolvedIosAdMobAppId,
        optimizeAdLoading: true,
        optimizeInitialization: true
      }
    ]);
  }

  plugins.push("expo-web-browser");

  const extra = {
    ...(config.extra ?? {})
  };

  if (process.env.EXPO_PUBLIC_EAS_PROJECT_ID) {
    extra.eas = {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID
    };
  }

  return {
    ...config,
    ios: {
      ...(config.ios ?? {}),
      infoPlist: {
        ...(config.ios?.infoPlist ?? {}),
        ...(resolvedIosAdMobAppId ? { GADApplicationIdentifier: resolvedIosAdMobAppId } : {})
      }
    },
    plugins,
    extra
  };
};
