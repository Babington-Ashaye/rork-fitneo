import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { secureStorage } from "@/lib/secureStorage";

export type NotificationPreference = "workout" | "streak" | "coach";
export type NotificationPreferences = Record<NotificationPreference, boolean>;

const preferenceKeys: Record<NotificationPreference, string> = {
  workout: "fitneo.notifications.workout",
  streak: "fitneo.notifications.streak",
  coach: "fitneo.notifications.coach"
};
const LOCAL_NOTIFICATION_MARKER = "local-notification-preference-enabled";
const preferenceMirrorKeys: Record<NotificationPreference, string> = {
  workout: "fitneo.notifications.enabled.workout",
  streak: "fitneo.notifications.enabled.streak",
  coach: "fitneo.notifications.enabled.coach"
};

const schedules: Record<NotificationPreference, {
  hour: number;
  minute: number;
  title: string;
  body: string;
}> = {
  workout: {
    hour: 18,
    minute: 0,
    title: "Your FITNEO workout is ready",
    body: "Keep the promise you made to yourself. Start today's session."
  },
  streak: {
    hour: 20,
    minute: 30,
    title: "Protect your FITNEO streak",
    body: "A short session still counts. Log movement before the day ends."
  },
  coach: {
    hour: 8,
    minute: 0,
    title: "FITNEO AI daily check-in",
    body: "Open your coach for today's training, nutrition, and recovery focus."
  }
};

type NotificationsModule = typeof import("expo-notifications");

async function getNativeNotifications(): Promise<NotificationsModule | null> {
  if (Platform.OS === "web") return null;
  return import("expo-notifications");
}

void getNativeNotifications().then((Notifications) => {
  Notifications?.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true
    })
  });
});

export async function initializeNotifications() {
  const Notifications = await getNativeNotifications();
  if (!Notifications) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("fitneo-reminders", {
      name: "FITNEO reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: "#0A84FF"
    });
  }
}

export async function loadNotificationPreferences(): Promise<NotificationPreferences> {
  const entries = await Promise.all(
    (Object.keys(preferenceKeys) as NotificationPreference[]).map(async (key) => {
      const secureValue = await secureStorage.getItem(preferenceKeys[key]);
      const mirrorValue = await AsyncStorage.getItem(preferenceMirrorKeys[key]);
      return [
        key,
        secureValue !== null || mirrorValue === "true"
      ] as const;
    })
  );
  return Object.fromEntries(entries) as NotificationPreferences;
}

export async function setNotificationPreference(
  preference: NotificationPreference,
  enabled: boolean
) {
  await initializeNotifications();
  const Notifications = await getNativeNotifications();
  const storageKey = preferenceKeys[preference];
  const existingIdentifier = await secureStorage.getItem(storageKey);

  if (existingIdentifier) {
    if (Notifications && existingIdentifier !== LOCAL_NOTIFICATION_MARKER) {
      await Notifications.cancelScheduledNotificationAsync(existingIdentifier);
    }
    await secureStorage.removeItem(storageKey);
  }
  if (!enabled) {
    await AsyncStorage.removeItem(preferenceMirrorKeys[preference]);
    return;
  }

  await AsyncStorage.setItem(preferenceMirrorKeys[preference], "true");

  if (!Notifications) {
    await secureStorage.setItem(storageKey, LOCAL_NOTIFICATION_MARKER);
    return;
  }

  const permissions = await Notifications.getPermissionsAsync();
  let finalStatus = permissions.status;
  if (finalStatus !== "granted") {
    finalStatus = (await Notifications.requestPermissionsAsync()).status;
  }
  if (finalStatus !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const schedule = schedules[preference];
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: schedule.title,
      body: schedule.body,
      data: { preference, route: preference === "coach" ? "/(tabs)/coach" : "/(tabs)" }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: schedule.hour,
      minute: schedule.minute,
      channelId: Platform.OS === "android" ? "fitneo-reminders" : undefined
    }
  });
  await secureStorage.setItem(storageKey, identifier);
  await AsyncStorage.setItem(preferenceMirrorKeys[preference], "true");
}

export async function clearNotificationState() {
  const Notifications = await getNativeNotifications();
  try {
    await Notifications?.cancelAllScheduledNotificationsAsync();
  } finally {
    await Promise.all(
      [
        ...Object.values(preferenceKeys).map((key) => secureStorage.removeItem(key)),
        ...Object.values(preferenceMirrorKeys).map((key) => AsyncStorage.removeItem(key))
      ]
    );
  }
}

export function subscribeToNotificationNavigation(
  onRoute: (route: string) => void
) {
  if (Platform.OS === "web") return () => {};

  let remove = () => {};
  void getNativeNotifications().then((Notifications) => {
    const subscription = Notifications?.addNotificationResponseReceivedListener((response) => {
      const route = response.notification.request.content.data?.route;
      if (typeof route === "string") onRoute(route);
    });
    remove = () => subscription?.remove();
  });
  return () => remove();
}
