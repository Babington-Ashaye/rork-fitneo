import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { LegalSettingsMenu } from "@/components/LegalSettingsMenu";
import { EmptySpacer, ErrorState, LoadingState, RowCard, TouchableCard } from "@/components/ScreenKit";
import { useAuth } from "@/context/AuthContext";
import { fetchProfileSummary, ProfileSummary } from "@/lib/api";
import { colors, radii } from "@/lib/theme";
import { clearAllLocalAppData, exportCurrentUserData } from "@/lib/dataOperations";
import {
  loadNotificationPreferences,
  NotificationPreference,
  NotificationPreferences,
  setNotificationPreference
} from "@/lib/notifications";

export default function ProfileScreen() {
  const { signOut, user } = useAuth();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [activePreference, setActivePreference] = useState<NotificationPreference | null>(null);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    workout: false,
    streak: false,
    coach: false
  });

  async function loadProfile() {
    setError(null);
    setIsLoading(true);
    try {
      setProfile(await fetchProfileSummary());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
    void loadNotificationPreferences().then(setNotificationPreferences);
  }, []);

  async function logout() {
    await signOut();
    router.replace("/auth/sign-in");
  }

  async function exportData() {
    setIsExporting(true);
    try {
      await exportCurrentUserData();
    } catch (err) {
      Alert.alert("Export failed", err instanceof Error ? err.message : "Could not export your data.");
    } finally {
      setIsExporting(false);
    }
  }

  function confirmReset() {
    Alert.alert(
      "Reset all local data?",
      "This signs you out, removes cached workouts, preferences, reminders, and secure local acceptance state from this device. Cloud activity history is not deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            void (async () => {
              const userId = user?.id ?? null;
              try {
                await signOut();
              } finally {
                await clearAllLocalAppData(userId);
              }
              router.replace("/auth/sign-in");
            })().catch((err) => {
              Alert.alert("Reset failed", err instanceof Error ? err.message : "Could not reset local data.");
            });
          }
        }
      ]
    );
  }

  async function toggleNotification(preference: NotificationPreference) {
    const nextValue = !notificationPreferences[preference];
    setActivePreference(preference);
    try {
      await setNotificationPreference(preference, nextValue);
      setNotificationPreferences((current) => ({ ...current, [preference]: nextValue }));
    } catch (err) {
      Alert.alert("Notifications", err instanceof Error ? err.message : "Could not update this reminder.");
    } finally {
      setActivePreference(null);
    }
  }

  if (isLoading) {
    return (
      <AppLayout scroll>
        <LoadingState label="Loading profile..." />
      </AppLayout>
    );
  }

  if (error || !profile) {
    return (
      <AppLayout scroll>
        <ErrorState message={error ?? "Profile is unavailable."} onRetry={loadProfile} />
      </AppLayout>
    );
  }

  return (
    <AppLayout scroll>
      <TouchableCard radius={radii.hero} style={styles.profileHeader} onPress={() => router.push({ pathname: "/onboarding", params: { mode: "edit" } })}>
        <View style={styles.avatarGlow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{profile.displayName.slice(0, 1).toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.name}>{profile.displayName}</Text>
        <View style={styles.tags}>
          <Tag text={`LVL ${profile.level}`} />
          <Tag text={profile.rankTitle} />
          <Tag text={`${profile.xp} XP`} />
        </View>
      </TouchableCard>

      <TouchableCard radius={radii.xl} style={styles.subscriptionCard} onPress={() => router.push("/paywall")}>
        <View style={styles.crownBubble}>
          <Ionicons name={profile.subscription === "free" ? "lock-closed" : "trophy"} size={20} color={profile.subscription === "free" ? colors.textTertiary : colors.gold} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>FITNEO {profile.subscription.toUpperCase()}</Text>
          <Text style={styles.cardSubtitle}>{profile.subscription === "free" ? "Tap to start free trial" : "Manage your plan"}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </TouchableCard>

      <TouchableCard radius={radii.xl} style={styles.badgesCard} onPress={() => router.push("/badges")}>
        <View style={styles.rowBetween}>
          <Text style={styles.section}>BADGES</Text>
          <Text style={styles.accent}>{profile.badgesEarned} / {profile.badgesTotal}</Text>
        </View>
        <View style={styles.badgeRow}>
          {["flash", "flame", "trophy", "barbell", "restaurant"].map((icon) => (
            <View key={icon} style={styles.badgeBubble}>
              <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.textTertiary} />
            </View>
          ))}
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </View>
      </TouchableCard>

      <RowCard icon="trophy" title="Leaderboard" subtitle="See where you rank" onPress={() => router.push("/(tabs)/leaderboard")} />
      <RowCard icon="person-circle" title="Tell us about yourself" subtitle="Mirror and update onboarding answers" onPress={() => router.push({ pathname: "/onboarding", params: { mode: "edit" } })} />
      <LegalSettingsMenu />

      <TouchableCard radius={radii.xl} style={styles.settingsCard}>
        <Text style={styles.section}>NOTIFICATIONS</Text>
        <SettingsRow icon="notifications" title="Workout reminders" enabled={notificationPreferences.workout} loading={activePreference === "workout"} onPress={() => void toggleNotification("workout")} />
        <SettingsRow icon="flame" title="Streak alerts" enabled={notificationPreferences.streak} loading={activePreference === "streak"} onPress={() => void toggleNotification("streak")} />
        <SettingsRow icon="bulb" title="FITNEO AI daily check-in" enabled={notificationPreferences.coach} loading={activePreference === "coach"} onPress={() => void toggleNotification("coach")} />
      </TouchableCard>

      <RowCard icon="share-outline" title={isExporting ? "Preparing Export..." : "Export Data"} subtitle="Share your profile and history as JSON" onPress={isExporting ? undefined : () => void exportData()} />
      {__DEV__ ? (
        <RowCard
          icon="card"
          title="RevenueCat Test Console"
          subtitle="Inspect entitlements and run sandbox checkouts"
          onPress={() => router.push("/subscription-test")}
        />
      ) : null}
      <TouchableCard radius={radii.xl} style={styles.resetCard} onPress={confirmReset}>
        {isExporting ? <ActivityIndicator size="small" color={colors.danger} /> : <Ionicons name="trash" size={16} color={colors.danger} />}
        <Text style={styles.resetText}>Reset All Data</Text>
      </TouchableCard>
      <TouchableOpacity activeOpacity={0.78} style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <EmptySpacer />
    </AppLayout>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{text}</Text>
    </View>
  );
}

function SettingsRow({
  enabled,
  icon,
  loading,
  onPress,
  title
}: {
  enabled: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  loading: boolean;
  onPress: () => void;
  title: string;
}) {
  return (
    <TouchableOpacity activeOpacity={0.78} style={styles.settingsRow} onPress={onPress} disabled={loading}>
      <Ionicons name={icon} size={15} color={colors.accent} style={styles.settingsIcon} />
      <Text style={styles.settingsText}>{title}</Text>
      {loading ? <ActivityIndicator size="small" color={colors.accent} /> : (
        <View style={[styles.toggle, enabled && styles.toggleEnabled]}>
          <View style={[styles.toggleKnob, enabled && styles.toggleKnobEnabled]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 24
  },
  avatarGlow: {
    alignItems: "center",
    backgroundColor: "rgba(10,132,255,0.25)",
    borderRadius: 50,
    height: 100,
    justifyContent: "center",
    width: 100
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 43,
    height: 86,
    justifyContent: "center",
    width: 86
  },
  avatarInitial: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: "700"
  },
  name: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "700"
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center"
  },
  tag: {
    backgroundColor: "rgba(10,132,255,0.15)",
    borderRadius: radii.round,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  tagText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700"
  },
  subscriptionCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    padding: 18
  },
  crownBubble: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  flex: {
    flex: 1
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700"
  },
  cardSubtitle: {
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: 3
  },
  badgesCard: {
    gap: 14,
    padding: 18
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  section: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5
  },
  accent: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700"
  },
  badgeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  badgeBubble: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    opacity: 0.55,
    width: 44
  },
  settingsCard: {
    gap: 8,
    padding: 18
  },
  settingsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 46
  },
  settingsIcon: {
    width: 28
  },
  settingsText: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 15
  },
  toggle: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 15,
    height: 30,
    justifyContent: "center",
    paddingHorizontal: 3,
    width: 50
  },
  toggleEnabled: { backgroundColor: colors.accent },
  toggleKnob: {
    backgroundColor: colors.textPrimary,
    borderRadius: 12,
    height: 24,
    transform: [{ translateX: 0 }],
    width: 24
  },
  toggleKnobEnabled: { transform: [{ translateX: 20 }] },
  divider: {
    backgroundColor: "rgba(255,255,255,0.08)",
    height: 1,
    marginVertical: 8
  },
  resetCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    padding: 18
  },
  resetText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "700"
  },
  logoutButton: {
    alignItems: "center",
    borderColor: "rgba(255,69,58,0.35)",
    borderRadius: radii.lg,
    borderWidth: 1,
    minHeight: 52,
    justifyContent: "center"
  },
  logoutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "800"
  }
});
