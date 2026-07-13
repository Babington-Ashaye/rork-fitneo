import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/AppLayout";
import { LegalSettingsMenu } from "@/components/LegalSettingsMenu";
import { EmptySpacer, ErrorState, LoadingState, RowCard, TouchableCard } from "@/components/ScreenKit";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { fetchProfileSummary, ProfileSummary } from "@/lib/api";
import { colors, radii } from "@/lib/theme";
import { clearAllLocalAppData, exportCurrentUserData } from "@/lib/dataOperations";
import {
  loadNotificationPreferences,
  NotificationPreference,
  NotificationPreferences,
  setNotificationPreference
} from "@/lib/notifications";

const PROFILE_PHOTO_KEY = "fitneo.profile.photoUri";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { signOut, user } = useAuth();
  const { isFreeExpired, isTrial, trialDaysRemaining } = useSubscription();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
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
      setError(err instanceof Error ? err.message : t("profileScreen.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
    void loadStoredAvatar();
    void loadNotificationPreferences().then(setNotificationPreferences);
  }, []);

  async function loadStoredAvatar() {
    const storedUri = await AsyncStorage.getItem(PROFILE_PHOTO_KEY);
    if (!storedUri) {
      setAvatarUri(null);
      return;
    }
    if (/^https?:\/\//i.test(storedUri) || storedUri.startsWith("data:") || storedUri.startsWith("blob:")) {
      setAvatarUri(storedUri);
      return;
    }
    try {
      const info = await FileSystem.getInfoAsync(storedUri);
      if (info.exists) {
        setAvatarUri(storedUri);
        return;
      }
    } catch {
      // Fall through to clearing the stale URI.
    }
    await AsyncStorage.removeItem(PROFILE_PHOTO_KEY);
    setAvatarUri(null);
  }

  async function logout() {
    await signOut();
    router.replace("/auth/sign-in");
  }

  async function exportData() {
    setIsExporting(true);
    try {
      await exportCurrentUserData();
    } catch (err) {
      Alert.alert(t("profileScreen.exportFailed"), err instanceof Error ? err.message : t("profileScreen.exportFailedCopy"));
    } finally {
      setIsExporting(false);
    }
  }

  async function pickProfilePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("profileScreen.photoPermission"), t("profileScreen.photoPermissionCopy"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.82
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    const uri = result.assets[0].uri;
    setAvatarUri(uri);
    await AsyncStorage.setItem(PROFILE_PHOTO_KEY, uri);
  }

  function confirmReset() {
    Alert.alert(
      t("profileScreen.resetConfirmTitle"),
      t("profileScreen.resetConfirmCopy"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profileScreen.reset"),
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
              Alert.alert(t("profileScreen.resetFailed"), err instanceof Error ? err.message : t("profileScreen.resetFailedCopy"));
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
      Alert.alert(t("profileScreen.notifications"), err instanceof Error ? err.message : t("profileScreen.notificationFailed"));
    } finally {
      setActivePreference(null);
    }
  }

  if (isLoading) {
    return (
      <AppLayout scroll>
        <LoadingState label={t("profileScreen.loading")} />
      </AppLayout>
    );
  }

  if (error || !profile) {
    return (
      <AppLayout scroll>
        <ErrorState message={error ?? t("profileScreen.unavailable")} onRetry={loadProfile} />
      </AppLayout>
    );
  }

  const subscriptionLabel = getSubscriptionLabel(profile.subscription);
  const subscriptionSubtitle = getSubscriptionSubtitle({
    isFreeExpired,
    isTrial,
    status: profile.subscription,
    t,
    trialDaysRemaining
  });

  return (
    <AppLayout scroll>
      <TouchableCard radius={radii.hero} style={styles.profileHeader} onPress={() => router.push({ pathname: "/onboarding", params: { mode: "edit" } })}>
        <ImageBackground source={{ uri: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80" }} resizeMode="cover" style={StyleSheet.absoluteFillObject} imageStyle={styles.profileHeroImage}>
          <LinearGradient colors={["rgba(0,0,0,0.18)", "rgba(0,0,0,0.84)"]} style={StyleSheet.absoluteFillObject} />
        </ImageBackground>
        <View style={styles.avatarGlow}>
          <TouchableOpacity activeOpacity={0.82} style={styles.avatar} onPress={pickProfilePhoto}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>{profile.displayName.slice(0, 1).toUpperCase()}</Text>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={13} color={colors.textPrimary} />
            </View>
          </TouchableOpacity>
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
          <Text style={styles.cardTitle}>FITNEO {subscriptionLabel}</Text>
          <Text style={styles.cardSubtitle}>{subscriptionSubtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </TouchableCard>

      <TouchableCard radius={radii.xl} style={styles.badgesCard} onPress={() => router.push("/badges")}>
        <View style={styles.rowBetween}>
          <Text style={styles.section}>{t("profileScreen.badges")}</Text>
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

      <RowCard icon="trophy" title={t("profileScreen.leaderboard")} subtitle={t("profileScreen.leaderboardSubtitle")} onPress={() => router.push("/(tabs)/leaderboard")} />
      <RowCard icon="person-circle" title={t("profileScreen.tellUs")} subtitle={t("profileScreen.tellUsSubtitle")} onPress={() => router.push({ pathname: "/onboarding", params: { mode: "edit" } })} />
      <LegalSettingsMenu />

      <TouchableCard radius={radii.xl} style={styles.settingsCard}>
        <Text style={styles.section}>{t("profileScreen.notifications")}</Text>
        <SettingsRow icon="notifications" title={t("profileScreen.workoutReminders")} enabled={notificationPreferences.workout} loading={activePreference === "workout"} onPress={() => void toggleNotification("workout")} />
        <SettingsRow icon="flame" title={t("profileScreen.streakAlerts")} enabled={notificationPreferences.streak} loading={activePreference === "streak"} onPress={() => void toggleNotification("streak")} />
        <SettingsRow icon="bulb" title={t("profileScreen.aiCheckIn")} enabled={notificationPreferences.coach} loading={activePreference === "coach"} onPress={() => void toggleNotification("coach")} />
      </TouchableCard>

      <RowCard icon="share-outline" title={isExporting ? t("profileScreen.preparingExport") : t("profileScreen.exportData")} subtitle={t("profileScreen.exportSubtitle")} onPress={isExporting ? undefined : () => void exportData()} />
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
        <Text style={styles.resetText}>{t("profileScreen.resetAllData")}</Text>
      </TouchableCard>
      <TouchableOpacity activeOpacity={0.78} style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>{t("profileScreen.signOut")}</Text>
      </TouchableOpacity>

      <EmptySpacer />
    </AppLayout>
  );
}

function getSubscriptionLabel(status: string) {
  if (status === "elite") return "ELITE";
  if (status === "pro") return "PRO";
  return "FREE";
}

function getSubscriptionSubtitle({
  isFreeExpired,
  isTrial,
  status,
  t,
  trialDaysRemaining
}: {
  isFreeExpired: boolean;
  isTrial: boolean;
  status: string;
  t: (key: string, options?: Record<string, unknown>) => string;
  trialDaysRemaining: number;
}) {
  if (isTrial) return t("profileScreen.trialDaysLeft", { count: trialDaysRemaining });
  if (status === "elite") return t("profileScreen.manageElite");
  if (status === "pro") return t("profileScreen.managePro");
  if (isFreeExpired || status === "free") return t("profileScreen.upgradeToPro");
  return t("profileScreen.managePlan");
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
    minHeight: 250,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingVertical: 24
  },
  profileHeroImage: {
    borderRadius: radii.hero
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
    overflow: "hidden",
    width: 86
  },
  avatarImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  cameraBadge: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.72)",
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 14,
    borderWidth: 1,
    bottom: 4,
    height: 28,
    justifyContent: "center",
    position: "absolute",
    right: 4,
    width: 28
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
