import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { EmptySpacer, ErrorState, ScreenTitle, SkeletonBlock, TouchableCard } from "@/components/ScreenKit";
import { ChatSessionSummary, fetchChatSessions } from "@/lib/api";
import { colors } from "@/lib/theme";
import { useSubscription } from "@/context/SubscriptionContext";

export default function ChatHistoryScreen() {
  const { isPremium } = useSubscription();
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPremium) {
      setLoading(false);
      return;
    }
    fetchChatSessions()
      .then(setSessions)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load chat history."))
      .finally(() => setLoading(false));
  }, [isPremium]);

  if (!isPremium) {
    return (
      <AppLayout contentContainerStyle={styles.locked}>
        <Ionicons name="lock-closed" size={34} color={colors.gold} />
        <Text style={styles.lockedTitle}>Full history is a Pro feature</Text>
        <Text style={styles.lockedCopy}>Upgrade to keep and revisit your complete FITNEO AI coaching history.</Text>
        <TouchableOpacity style={styles.upgrade} onPress={() => router.push("/paywall")}>
          <Text style={styles.upgradeText}>Explore Pro</Text>
        </TouchableOpacity>
      </AppLayout>
    );
  }

  return (
    <AppLayout scroll>
      <ScreenTitle title="Chat History" subtitle="Your FITNEO AI coaching sessions" />
      {loading ? <><SkeletonBlock height={74} /><SkeletonBlock height={74} /></> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && sessions.length === 0 ? <Text style={styles.empty}>No conversations yet.</Text> : null}
      {sessions.map((session) => (
        <TouchableCard key={session.id} radius={16} style={styles.card} onPress={() => router.push("/(tabs)/coach")}>
          <View style={styles.icon}><Ionicons name="chatbubble" size={16} color={colors.accent} /></View>
          <View style={styles.flex}>
            <Text style={styles.title}>{session.title}</Text>
            <Text style={styles.copy}>{new Date(session.createdAt).toLocaleDateString()}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableCard>
      ))}
      <EmptySpacer />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", flexDirection: "row", gap: 12, padding: 15 },
  icon: { alignItems: "center", backgroundColor: "rgba(10,132,255,0.12)", borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  flex: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 14, fontWeight: "800" },
  copy: { color: colors.textTertiary, fontSize: 11, marginTop: 3 },
  empty: { color: colors.textTertiary, fontSize: 13, paddingVertical: 30, textAlign: "center" }
  ,
  locked: { alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  lockedTitle: { color: colors.textPrimary, fontSize: 23, fontWeight: "900", textAlign: "center" },
  lockedCopy: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: "center" },
  upgrade: { backgroundColor: colors.accent, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 13 },
  upgradeText: { color: colors.textPrimary, fontSize: 14, fontWeight: "900" }
});
