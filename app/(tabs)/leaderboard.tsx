import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { EmptySpacer, ErrorState, GlassCard, ScreenTitle, SkeletonBlock } from "@/components/ScreenKit";
import { fetchLeaderboardEntries, LeaderboardEntry } from "@/lib/api";
import { colors } from "@/lib/theme";

type RankingMode = "xp" | "streak" | "week";

export default function LeaderboardScreen() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [mode, setMode] = useState<RankingMode>("xp");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(isRefresh = false) {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      setEntries(await fetchLeaderboardEntries());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the leaderboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const ranked = useMemo(() => {
    const value = (entry: LeaderboardEntry) =>
      mode === "xp" ? entry.totalXp : mode === "streak" ? entry.currentStreak : entry.workoutsThisWeek;
    const sorted = [...entries].sort((a, b) => value(b) - value(a));
    return sorted.map((entry, index) => ({
      entry,
      rank: index > 0 && value(sorted[index - 1]) === value(entry)
        ? sorted.slice(0, index).findIndex((candidate) => value(candidate) === value(entry)) + 1
        : index + 1
    }));
  }, [entries, mode]);

  const ownRank = ranked.find((item) => item.entry.isCurrentUser)?.rank;

  return (
    <AppLayout
      scroll
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.accent} onRefresh={() => void load(true)} />}
    >
      <GlassCard radius={16} style={styles.weekly}>
        <View style={styles.inline}>
          <Ionicons name="trophy" size={17} color={colors.gold} />
          <Text style={styles.section}>THIS WEEK COMPETITION</Text>
        </View>
        <Text style={styles.reset}>Resets Monday</Text>
      </GlassCard>

      {ownRank ? (
        <GlassCard radius={16} selected style={styles.rankContext}>
          <Ionicons name="medal" size={24} color={ownRank <= 3 ? colors.gold : colors.accent} />
          <View>
            <Text style={styles.rankTitle}>You are Rank #{ownRank}</Text>
            <Text style={styles.rankCopy}>among {ranked.length} active athletes</Text>
          </View>
        </GlassCard>
      ) : null}

      <ScreenTitle title="Leaderboard" subtitle="Live rankings from the FITNEO community" />
      <View style={styles.segment}>
        {([
          ["xp", "XP"],
          ["streak", "Streak"],
          ["week", "This Week"]
        ] as Array<[RankingMode, string]>).map(([key, label]) => (
          <TouchableOpacity key={key} onPress={() => setMode(key)} style={[styles.segmentItem, mode === key && styles.segmentActive]}>
            <Text style={[styles.segmentText, mode === key && styles.segmentActiveText]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <>
          <SkeletonBlock height={70} radius={16} />
          <SkeletonBlock height={70} radius={16} />
          <SkeletonBlock height={70} radius={16} />
        </>
      ) : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && ranked.length === 0 ? (
        <GlassCard radius={16} style={styles.empty}>
          <Ionicons name="people" size={26} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No rankings yet</Text>
          <Text style={styles.emptyCopy}>Complete a workout to publish your first live score.</Text>
        </GlassCard>
      ) : null}
      {!loading && !error ? ranked.map(({ entry, rank }) => (
        <GlassCard key={entry.userId} radius={16} selected={entry.isCurrentUser} style={styles.row}>
          <View style={styles.rankSlot}>
            {rank <= 3 ? <Ionicons name="medal" size={21} color={rank === 1 ? colors.gold : rank === 2 ? "#BFC5CF" : "#C88955"} /> : <Text style={styles.rank}>{rank}</Text>}
          </View>
          <View style={[styles.avatar, { backgroundColor: entry.avatarColor }]}>
            <Text style={styles.initial}>{entry.displayName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={[styles.name, entry.isCurrentUser && styles.you]}>{entry.displayName}{entry.isCurrentUser ? " (You)" : ""}</Text>
            <Text style={styles.level}>Level {Math.max(1, Math.floor(entry.totalXp / 1000) + 1)}</Text>
          </View>
          <Text style={styles.value}>{mode === "xp" ? `${entry.totalXp.toLocaleString()} XP` : mode === "streak" ? `${entry.currentStreak} days` : `${entry.workoutsThisWeek} workouts`}</Text>
        </GlassCard>
      )) : null}
      <EmptySpacer />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  weekly: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", padding: 14 },
  inline: { alignItems: "center", flexDirection: "row", gap: 8 },
  section: { color: colors.textTertiary, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  reset: { color: colors.textTertiary, fontSize: 10 },
  rankContext: { alignItems: "center", flexDirection: "row", gap: 12, padding: 14 },
  rankTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "800" },
  rankCopy: { color: colors.textTertiary, fontSize: 11, marginTop: 2 },
  segment: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, flexDirection: "row", padding: 3 },
  segmentItem: { borderRadius: 11, flex: 1, paddingVertical: 9 },
  segmentActive: { backgroundColor: colors.accent },
  segmentText: { color: colors.textSecondary, fontSize: 12, fontWeight: "800", textAlign: "center" },
  segmentActiveText: { color: colors.textPrimary },
  row: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 70, padding: 13 },
  rankSlot: { alignItems: "center", width: 28 },
  rank: { color: colors.textTertiary, fontSize: 14, fontWeight: "800" },
  avatar: { alignItems: "center", borderRadius: 19, height: 38, justifyContent: "center", width: 38 },
  initial: { color: colors.textPrimary, fontSize: 14, fontWeight: "900" },
  flex: { flex: 1, minWidth: 0 },
  name: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
  you: { color: colors.accent },
  level: { color: colors.textTertiary, fontSize: 10, marginTop: 2 },
  value: { color: colors.textSecondary, fontSize: 12, fontWeight: "800", maxWidth: 92, textAlign: "right" },
  empty: { alignItems: "center", gap: 8, padding: 24 },
  emptyTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "800" },
  emptyCopy: { color: colors.textTertiary, fontSize: 12, textAlign: "center" }
});
