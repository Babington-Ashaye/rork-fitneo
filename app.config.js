const ADMOB_PLUGIN = "react-native-google-mobile-ads";
const GOOGLE_TEST_ADMOB_ANDROID_APP_ID = "ca-app-pub-3940256099942544~3347511713";
const GOOGLE_TEST_ADMOB_IOS_APP_ID = "ca-app-pub-3940256099942544~1458002511";

function isPluginEntry(entry, name) {
  return Array.isArray(entry) ? entry[0] === name : entry === name;
}

function uniquePlugins(plugins) {
  const seen = new Set();
  return plugins.filter((entry) => {
    const name = Array.isArray(entry) ? entry[0] : entry;
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}

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
    (!isReleaseProfile ? GOOGLE_TEST_ADMOB_ANDROID_APP_ID : undefined);
  const resolvedIosAdMobAppId =
    iosAdMobAppId ||
    (!isReleaseProfile ? GOOGLE_TEST_ADMOB_IOS_APP_ID : undefined);

  const plugins = (config.plugins ?? []).filter(
    (entry) => !isPluginEntry(entry, ADMOB_PLUGIN)
  );

  if (resolvedAndroidAdMobAppId || resolvedIosAdMobAppId) {
    plugins.push([
      ADMOB_PLUGIN,
      {
        androidAppId: resolvedAndroidAdMobAppId,
        iosAppId: resolvedIosAdMobAppId,
        optimizeAdLoading: true,
        optimizeInitialization: true,
        userTrackingUsageDescription:
          "This identifier will be used to show you personalized fitness content and ads relevant to your goals"
      }
    ]);
  }

  plugins.push("expo-web-browser");

  const extra = {
    ...(config.extra ?? {}),
    ads: {
      admobNativeConfigReady: Boolean(resolvedAndroidAdMobAppId || resolvedIosAdMobAppId),
      usesGoogleTestAppIds: Boolean(
        !isReleaseProfile && (!androidAdMobAppId || !iosAdMobAppId)
      )
    }
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
        ...(resolvedIosAdMobAppId ? { GADApplicationIdentifier: resolvedIosAdMobAppId } : {}),
        NSUserTrackingUsageDescription:
          "This identifier will be used to show you personalized fitness content and ads relevant to your goals"
      }
    },
    plugins: uniquePlugins(plugins),
    extra
  };
};
