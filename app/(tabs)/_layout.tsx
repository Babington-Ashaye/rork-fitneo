import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii } from "@/lib/theme";
import { useAuth } from "@/context/AuthContext";

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
  const activeRoute = state.routes[state.index];
  if (activeRoute?.name === "coach") return null;

  const visibleRoutes = state.routes.filter((route: any) => navIcons[route.name]);

  return (
    <View pointerEvents="box-none" style={[styles.tabHost, { bottom: Math.max(8, insets.bottom + 2) }]}>
      <View style={styles.floatingNav}>
        {visibleRoutes.map((route: any) => {
          const routeIndex = state.routes.findIndex((item: any) => item.key === route.key);
          const isActive = state.index === routeIndex;
          const color = isActive ? colors.accent : colors.textTertiary;

          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={[styles.navItem, isActive ? styles.navItemActive : styles.navItemInactive]}
            >
              <Ionicons name={navIcons[route.name]} size={18} color={color} style={isActive ? styles.activeIcon : undefined} />
              {isActive ? <Text style={styles.navLabel}>{t(navLabelKeys[route.name])}</Text> : null}
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
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 10,
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
    flexDirection: "row",
    gap: 6,
    minHeight: 42,
    paddingVertical: 9
  },
  navItemActive: {
    backgroundColor: "rgba(10,132,255,0.15)",
    paddingHorizontal: 13
  },
  navItemInactive: {
    paddingHorizontal: 10
  },
  activeIcon: {
    transform: [{ scale: 1.06 }]
  },
  navLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "800"
  }
});


