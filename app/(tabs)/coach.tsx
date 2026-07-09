import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { Chip, GlassCard, SkeletonBlock } from "@/components/ScreenKit";
import {
  ChatMessageRecord,
  ChatSessionSummary,
  createChatSession,
  fetchChatMessages,
  fetchChatSessions,
  saveChatMessage
} from "@/lib/api";
import { streamFitneoCoach } from "@/lib/edgeFunctions";
import { colors, radii } from "@/lib/theme";

const suggestions = ["Build my weekly plan", "Generate a HIIT workout", "Review my recovery", "Tune my calories"];

export default function CoachScreen() {
  const [prompt, setPrompt] = useState("");
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSessionSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  async function newChat() {
    setError(null);
    let session: ChatSessionSummary;
    try {
      session = await createChatSession("New Chat");
    } catch {
      session = { id: `local-${Date.now()}`, title: "New Chat", createdAt: new Date().toISOString() };
    }
    setSessions((current) => [session, ...current]);
    setActiveSession(session);
    setMessages([]);
    setHistoryOpen(false);
  }

  async function openSession(session: ChatSessionSummary) {
    setActiveSession(session);
    setHistoryOpen(false);
    setIsLoading(true);
    try {
      setMessages(await fetchChatMessages(session.id));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function boot() {
      try {
        const existing = await fetchChatSessions();
        setSessions(existing);
        if (existing[0]) {
          setActiveSession(existing[0]);
          setMessages(await fetchChatMessages(existing[0].id));
        } else {
          await newChat();
        }
      } catch (err) {
        const localSession = { id: `local-${Date.now()}`, title: "New Chat", createdAt: new Date().toISOString() };
        setActiveSession(localSession);
        setSessions([localSession]);
        setError(null);
      } finally {
        setIsLoading(false);
      }
    }
    void boot();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [isSending, messages]);

  const conversation = useMemo(
    () => messages.map((message) => ({ role: message.role, content: message.content })),
    [messages]
  );

  async function sendPrompt(value = prompt) {
    const cleanPrompt = value.trim();
    if (!cleanPrompt || isSending) {
      return;
    }

    setPrompt("");
    setError(null);
    setIsSending(true);
    setStreamingText("");
    try {
      let session = activeSession;
      if (!session) {
        try {
          session = await createChatSession(cleanPrompt.slice(0, 42));
        } catch {
          session = { id: `local-${Date.now()}`, title: cleanPrompt.slice(0, 42), createdAt: new Date().toISOString() };
        }
        setActiveSession(session);
        setSessions((current) => [session!, ...current]);
      }

      const userMessage: ChatMessageRecord = {
        id: `local-user-${Date.now()}`,
        role: "user",
        content: cleanPrompt,
        createdAt: new Date().toISOString()
      };
      setMessages((current) => [...current, userMessage]);
      try {
        await saveChatMessage(session.id, "user", cleanPrompt);
      } catch {
        // Chat persistence must never block the live coaching request.
      }

      const response = await streamFitneoCoach(cleanPrompt, {
        sessionId: session.id,
        history: conversation,
        onChunk: setStreamingText
      });
      if (response.error || !response.data?.message) {
        throw new Error(response.error ?? "FITNEO AI returned an empty response.");
      }

      const assistantMessage: ChatMessageRecord = {
        id: `local-assistant-${Date.now()}`,
        role: "assistant",
        content: response.data.message,
        createdAt: new Date().toISOString()
      };
      setMessages((current) => [...current, assistantMessage]);
      try {
        await saveChatMessage(session.id, "assistant", response.data.message);
      } catch {
        // The answer remains available in-memory when history sync is unavailable.
      }
      setStreamingText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "FITNEO AI could not respond.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <AppLayout contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setHistoryOpen((current) => !current)} style={styles.iconButton}>
          <Ionicons name="albums-outline" size={19} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.aiIdentity}>
          <View style={styles.onlineDot} />
          <View>
            <Text style={styles.title}>FITNEO AI</Text>
            <Text style={styles.online}>COACH ONLINE</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => void newChat()} style={styles.iconButton}>
          <Ionicons name="create-outline" size={19} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {historyOpen ? (
        <GlassCard radius={16} style={styles.historyPanel}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Chat history</Text>
            <TouchableOpacity onPress={() => void newChat()}>
              <Text style={styles.newChat}>+ New Chat</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sessionList}>
            {sessions.map((session) => (
              <TouchableOpacity key={session.id} onPress={() => void openSession(session)}>
                <Chip title={session.title} active={session.id === activeSession?.id} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </GlassCard>
      ) : null}

      <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messageContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <>
            <SkeletonBlock height={74} style={styles.assistantSkeleton} />
            <SkeletonBlock height={52} style={styles.userSkeleton} />
          </>
        ) : messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="sparkles" size={26} color={colors.accent} />
            <Text style={styles.emptyTitle}>What are we building today?</Text>
            <Text style={styles.emptyCopy}>Ask for a structured routine, nutrition target, or recovery adjustment.</Text>
          </View>
        ) : (
          messages.map((message) => (
            <View key={message.id} style={[styles.bubble, message.role === "user" ? styles.userBubble : styles.assistantBubble]}>
              <Text style={styles.messageText}>{message.content}</Text>
            </View>
          ))
        )}
        {isSending ? (
          <View style={[styles.bubble, styles.assistantBubble, styles.typingBubble]}>
            {streamingText ? (
              <Text style={styles.messageText}>{streamingText}</Text>
            ) : (
              <>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.typingText}>Building your response...</Text>
              </>
            )}
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <ScrollView horizontal style={styles.suggestionScroller} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestions}>
        {suggestions.map((suggestion) => (
          <TouchableOpacity key={suggestion} onPress={() => void sendPrompt(suggestion)}>
            <Chip title={suggestion} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.composer}>
        <View style={styles.composerMark}>
          <Ionicons name="sparkles" size={16} color={colors.accent} />
        </View>
        <TextInput
          multiline
          placeholder="Message FITNEO AI..."
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          value={prompt}
          onChangeText={setPrompt}
        />
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.sendButton, (!prompt.trim() || isSending) && styles.sendDisabled]}
          onPress={() => void sendPrompt()}
          disabled={!prompt.trim() || isSending}
        >
          <Ionicons name="arrow-up" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#070B14", gap: 10, paddingBottom: 12 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  iconButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 18, height: 38, justifyContent: "center", width: 38 },
  aiIdentity: { alignItems: "center", flexDirection: "row", gap: 10 },
  onlineDot: { backgroundColor: colors.teal, borderRadius: 6, height: 12, shadowColor: colors.teal, shadowOpacity: 0.8, shadowRadius: 8, width: 12 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "900", letterSpacing: 2 },
  online: { color: colors.teal, fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  historyPanel: { gap: 12, padding: 14 },
  historyHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  historyTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "800" },
  newChat: { color: colors.accent, fontSize: 13, fontWeight: "800" },
  sessionList: { gap: 8 },
  messages: { flex: 1 },
  messageContent: { flexGrow: 1, gap: 12, justifyContent: "flex-end", paddingBottom: 8, paddingTop: 18 },
  bubble: { borderRadius: 20, maxWidth: "90%", paddingHorizontal: 16, paddingVertical: 13 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#253044", borderBottomRightRadius: 6 },
  assistantBubble: { alignSelf: "flex-start", backgroundColor: "transparent", borderBottomLeftRadius: 5, paddingLeft: 4 },
  messageText: { color: colors.textPrimary, fontSize: 15, lineHeight: 23 },
  typingBubble: { alignItems: "center", flexDirection: "row", gap: 9 },
  typingText: { color: colors.textSecondary, fontSize: 12 },
  error: { color: colors.danger, fontSize: 12, lineHeight: 18, textAlign: "center" },
  emptyState: { alignItems: "center", gap: 9, justifyContent: "center", paddingHorizontal: 28, paddingVertical: 40 },
  emptyTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: "800", textAlign: "center" },
  emptyCopy: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: "center" },
  suggestionScroller: { flexGrow: 0, maxHeight: 44 },
  suggestions: { alignItems: "center", gap: 8, paddingRight: 8 },
  composer: { alignItems: "flex-end", backgroundColor: "#151C29", borderColor: "rgba(255,255,255,0.10)", borderRadius: 25, borderWidth: 1, flexDirection: "row", gap: 6, padding: 5 },
  composerMark: { alignItems: "center", height: 38, justifyContent: "center", width: 36 },
  input: { color: colors.textPrimary, flex: 1, fontSize: 15, maxHeight: 110, minHeight: 44, paddingHorizontal: 4, paddingVertical: 11 },
  sendButton: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 23, height: 46, justifyContent: "center", width: 46 },
  sendDisabled: { opacity: 0.4 },
  assistantSkeleton: { alignSelf: "flex-start", width: "82%" },
  userSkeleton: { alignSelf: "flex-end", width: "64%" }
});
