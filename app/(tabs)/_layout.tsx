import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
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

const navLabels: Record<string, string> = {
  index: "Home",
  workouts: "Workouts",
  nutrition: "Nutrition",
  progress: "Progress",
  profile: "Profile"
};

function FloatingTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
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
              <Ionicons name={navIcons[route.name]} size={21} color={color} style={isActive ? styles.activeIcon : undefined} />
              {isActive ? <Text style={styles.navLabel}>{navLabels[route.name]}</Text> : null}
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
    right: 0
  },
  floatingNav: {
    alignItems: "center",
    backgroundColor: "rgba(18,24,40,0.92)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: radii.round,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16
  },
  navItem: {
    alignItems: "center",
    borderRadius: radii.round,
    flexDirection: "row",
    gap: 6,
    minHeight: 48,
    paddingVertical: 12
  },
  navItemActive: {
    backgroundColor: "rgba(10,132,255,0.15)",
    paddingHorizontal: 14
  },
  navItemInactive: {
    paddingHorizontal: 10
  },
  activeIcon: {
    transform: [{ scale: 1.18 }]
  },
  navLabel: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700"
  }
});
