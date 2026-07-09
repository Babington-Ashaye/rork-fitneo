import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { EmptySpacer, ErrorState, ScreenTitle, SkeletonBlock, TouchableCard } from "@/components/ScreenKit";
import { ChatSessionSummary, fetchChatSessions } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function ChatHistoryScreen() {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChatSessions()
      .then(setSessions)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load chat history."))
      .finally(() => setLoading(false));
  }, []);

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
});
