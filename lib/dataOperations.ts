import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { clearNotificationState } from "@/lib/notifications";
import { secureStorage } from "@/lib/secureStorage";
import { getCurrentUserId } from "@/lib/api";
import { supabase } from "@/lib/supabase";

const LOCAL_ONBOARDING_KEY = "fitneo.local.onboarding_completed";
const LEGAL_ACCEPTANCE_PREFIX = "fitneo.legal.accepted";

export async function exportCurrentUserData() {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("You must be signed in to export data.");

  const [
    profile,
    bodyMetrics,
    workoutSessions,
    nutritionLogs,
    xpTransactions,
    badges,
    workoutPrograms,
    chatSessions,
    chatMessages,
    localWorkouts
  ] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("body_metrics").select("*").eq("user_id", userId).order("recorded_date"),
    supabase.from("workout_sessions").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("nutrition_logs").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("xp_transactions").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("badges").select("*").eq("user_id", userId).order("earned_at"),
    supabase.from("workout_programs").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("chat_sessions").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("chat_messages").select("*").eq("user_id", userId).order("created_at"),
    AsyncStorage.getItem("fitneo.custom_workouts")
  ]);

  const responses = [
    profile,
    bodyMetrics,
    workoutSessions,
    nutritionLogs,
    xpTransactions,
    badges,
    workoutPrograms,
    chatSessions,
    chatMessages
  ];
  const firstError = responses.find((response) => response.error)?.error;
  if (firstError) throw firstError;

  const payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    userId,
    profile: profile.data,
    historicalMetrics: bodyMetrics.data ?? [],
    activity: {
      workoutSessions: workoutSessions.data ?? [],
      nutritionLogs: nutritionLogs.data ?? [],
      xpTransactions: xpTransactions.data ?? [],
      badges: badges.data ?? []
    },
    plans: {
      remote: workoutPrograms.data ?? [],
      local: localWorkouts ? JSON.parse(localWorkouts) : []
    },
    aiCoach: {
      sessions: chatSessions.data ?? [],
      messages: chatMessages.data ?? []
    }
  };

  if (Platform.OS === "web" && typeof document !== "undefined") {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const fileName = `fitneo-data-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    await awardLocalBadge(userId, "data_exporter", "Data Exporter");
    return fileName;
  }

  const directory = FileSystem.cacheDirectory;
  if (!directory) throw new Error("No writable export directory is available.");
  const fileUri = `${directory}fitneo-data-${new Date().toISOString().slice(0, 10)}.json`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2), {
    encoding: FileSystem.EncodingType.UTF8
  });
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Native sharing is not available on this device.");
  }
  await Sharing.shareAsync(fileUri, {
    dialogTitle: "Export FITNEO data",
    mimeType: "application/json",
    UTI: "public.json"
  });
  await awardLocalBadge(userId, "data_exporter", "Data Exporter");
  return fileUri;
}

async function awardLocalBadge(userId: string, badgeId: string, badgeName: string) {
  const existing = await supabase
    .from("badges")
    .select("badge_id")
    .eq("user_id", userId)
    .eq("badge_id", badgeId)
    .maybeSingle();
  if (existing.data || existing.error) return;
  await supabase.from("badges").insert({
    user_id: userId,
    badge_id: badgeId,
    badge_name: badgeName,
    earned_at: new Date().toISOString()
  });
}

export async function clearAllLocalAppData(userId: string | null) {
  await clearNotificationState().catch(() => undefined);
  await AsyncStorage.clear();
  await secureStorage.removeItem(LOCAL_ONBOARDING_KEY);
  if (userId) {
    await secureStorage.removeItem(`${LEGAL_ACCEPTANCE_PREFIX}.${userId}`);
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
      await secureStorage.removeItem(`sb-${projectRef}-auth-token`);
    } catch {
      // The configured Supabase URL is validated when the client is created.
    }
  }
}
