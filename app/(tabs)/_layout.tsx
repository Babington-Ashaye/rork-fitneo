import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useEffect, useReducer } from "react";
import { Platform, Pressable, StyleSheet, Text, Vibration, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii } from "@/lib/theme";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import i18n from "@/lib/i18n";

type IconName = keyof typeof Ionicons.glyphMap;

const navIcons: Record<string, IconName> = {
  index: "home",
  workouts: "barbell",
  nutrition: "leaf",
  progress: "bar-chart",
  profile: "person"
};

const navLabelKeys: Record<string, string> = {
  index: "nav.home",
  workouts: "nav.workouts",
  nutrition: "nav.nutrition",
  progress: "nav.progress",
  profile: "nav.profile"
};

function FloatingTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [, forceRender] = useReducer((value: number) => value + 1, 0);
  const activeRoute = state.routes[state.index];

  useEffect(() => {
    const rerender = () => forceRender();
    i18n.on("languageChanged", rerender);
    return () => {
      i18n.off("languageChanged", rerender);
    };
  }, []);

  if (activeRoute?.name === "coach") return null;

  const visibleRoutes = state.routes.filter((route: any) => navIcons[route.name]);

  return (
    <View pointerEvents="box-none" style={[styles.tabHost, { bottom: Math.max(8, insets.bottom + 2) }]}>
      <View key={language} style={styles.floatingNav}>
        {visibleRoutes.map((route: any) => {
          const routeIndex = state.routes.findIndex((item: any) => item.key === route.key);
          const isActive = state.index === routeIndex;
          const color = isActive ? colors.accent : colors.textTertiary;

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Vibration.vibrate(8);
                }
                navigation.navigate(route.name);
              }}
              style={[styles.navItem, isActive ? styles.navItemActive : styles.navItemInactive]}
            >
              <Ionicons name={navIcons[route.name]} size={20} color={color} style={isActive ? styles.activeIcon : undefined} />
              <Text numberOfLines={1} style={[styles.navLabel, isActive ? styles.navLabelActive : styles.navLabelInactive]}>
                {t(navLabelKeys[route.name])}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { isLoading, needsLegalAcceptance, needsOnboarding, session } = useAuth();
  if (isLoading) return null;
  if (!session) return <Redirect href="/auth/sign-in" />;
  if (needsLegalAcceptance) return <Redirect href="/legal-consent" />;
  if (needsOnboarding) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="workouts" options={{ title: "Workouts" }} />
      <Tabs.Screen name="nutrition" options={{ title: "Nutrition" }} />
      <Tabs.Screen name="progress" options={{ title: "Progress" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="coach" options={{ href: null }} />
      <Tabs.Screen name="leaderboard" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabHost: {
    alignItems: "center",
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 999,
    elevation: 24
  },
  floatingNav: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
    borderColor: "rgba(0,163,255,0.20)",
    borderRadius: 24,
    maxWidth: 420,
    width: "88%",
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 7,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.52,
    shadowRadius: 22,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)"
        } as never)
      : {})
  },
  navItem: {
    alignItems: "center",
    borderRadius: radii.round,
    flex: 1,
    flexDirection: "column",
    gap: 3,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 4,
    paddingVertical: 6
  },
  navItemActive: {
    backgroundColor: "rgba(10,132,255,0.18)"
  },
  navItemInactive: {
    backgroundColor: "transparent"
  },
  activeIcon: {
    transform: [{ scale: 1.02 }]
  },
  navLabel: {
    fontSize: 10,
    fontWeight: "800",
    maxWidth: "100%"
  },
  navLabelActive: {
    color: colors.accent
  },
  navLabelInactive: {
    color: colors.textTertiary
  }
});


