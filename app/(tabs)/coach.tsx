import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
import { askFitneoCoachWithRetry } from "@/lib/edgeFunctions";
import { colors, radii } from "@/lib/theme";
import { useSubscription } from "@/context/SubscriptionContext";

const suggestions = ["Build my weekly plan", "Generate a HIIT workout", "Review my recovery", "Tune my calories"];

const coachMemory: {
  activeSession: ChatSessionSummary | null;
  messages: ChatMessageRecord[];
  sessions: ChatSessionSummary[];
} = {
  activeSession: null,
  messages: [],
  sessions: []
};

export default function CoachScreen() {
  const { isPremium } = useSubscription();
  const [prompt, setPrompt] = useState("");
  const [sessions, setSessions] = useState<ChatSessionSummary[]>(coachMemory.sessions);
  const [activeSession, setActiveSession] = useState<ChatSessionSummary | null>(coachMemory.activeSession);
  const [messages, setMessages] = useState<ChatMessageRecord[]>(coachMemory.messages);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!coachMemory.activeSession);
  const [isSending, setIsSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [composerFocused, setComposerFocused] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  async function newChat() {
    setError(null);
    setSaveStatus(null);
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
    setSaveStatus(null);
    setIsLoading(true);
    try {
      setMessages(await fetchChatMessages(session.id));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function boot() {
      if (coachMemory.activeSession) {
        setIsLoading(false);
        return;
      }

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
    coachMemory.activeSession = activeSession;
    coachMemory.messages = messages;
    coachMemory.sessions = sessions;
  }, [activeSession, messages, sessions]);

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
    setSaveStatus(null);
    setLastFailedPrompt(null);
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

      const response = await askFitneoCoachWithRetry(cleanPrompt, {
        sessionId: session.id,
        history: conversation,
        onChunk: setStreamingText
      }, 2);
      if (response.error || !response.data?.message) {
        throw new Error(response.error ?? "FITNEO AI returned an empty response.");
      }

      const assistantMessage: ChatMessageRecord = {
        id: `local-assistant-${Date.now()}`,
        role: "assistant",
        content: formatCoachMessage(response.data.message),
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
      setLastFailedPrompt(cleanPrompt);
      setError(err instanceof Error ? err.message : "FITNEO AI is busy right now. Please try again in a moment.");
    } finally {
      setIsSending(false);
    }
  }

  function clearHistory() {
    setMessages([]);
    setStreamingText("");
    setError(null);
    setLastFailedPrompt(null);
    setSaveStatus("Conversation history cleared for this session.");
  }

  function saveConversation() {
    coachMemory.activeSession = activeSession;
    coachMemory.messages = messages;
    coachMemory.sessions = sessions;
    setSaveStatus(messages.length > 0 ? "Conversation saved locally for this app session." : "Nothing to save yet.");
  }

  return (
    <AppLayout contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)")} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.aiIdentity}>
          <View style={styles.aiOrb}><Ionicons name="hardware-chip" size={18} color={colors.accent} /></View>
          <View>
            <Text style={styles.title}>FITNEO AI</Text>
            <Text style={styles.online}>COACH ONLINE</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setHistoryOpen((current) => !current)} style={styles.iconButton}>
            <Ionicons name="albums-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => void newChat()} style={styles.iconButton}>
            <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.conversationActions}>
        <TouchableOpacity activeOpacity={0.78} style={styles.actionButton} onPress={clearHistory}>
          <Ionicons name="trash-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.actionText}>Clear History</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.78} style={[styles.actionButton, styles.saveActionButton]} onPress={saveConversation}>
          <Ionicons name="bookmark-outline" size={14} color={colors.accent} />
          <Text style={[styles.actionText, styles.saveActionText]}>Save Conversation</Text>
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
              <Text style={styles.messageText}>{formatCoachMessage(message.content)}</Text>
            </View>
          ))
        )}
        {isSending ? (
          <View style={[styles.bubble, styles.assistantBubble, styles.typingBubble]}>
            {streamingText ? (
              <Text style={styles.messageText}>{formatCoachMessage(streamingText)}</Text>
            ) : (
              <View style={styles.typingDots}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, styles.typingDotDim]} />
                <View style={[styles.typingDot, styles.typingDotFaint]} />
              </View>
            )}
          </View>
        ) : null}
        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="cloud-offline" size={16} color={colors.gold} />
            <Text style={styles.errorText}>{error}</Text>
            {lastFailedPrompt ? (
              <TouchableOpacity activeOpacity={0.78} style={styles.retryButton} onPress={() => void sendPrompt(lastFailedPrompt)}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
        {saveStatus ? <Text style={styles.saveStatus}>{saveStatus}</Text> : null}
      </ScrollView>

      <ScrollView horizontal style={styles.suggestionScroller} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestions}>
        {suggestions.map((suggestion) => (
          <TouchableOpacity key={suggestion} onPress={() => void sendPrompt(suggestion)}>
            <Chip title={suggestion} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[styles.composer, composerFocused && styles.composerFocused]}>
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
          onBlur={() => setComposerFocused(false)}
          onFocus={() => setComposerFocused(true)}
          underlineColorAndroid="transparent"
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

function formatCoachMessage(value: string) {
  return value
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, gap: 10, paddingBottom: 24 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: 10 },
  headerActions: { alignItems: "center", flexDirection: "row", gap: 8 },
  conversationActions: { flexDirection: "row", gap: 8 },
  actionButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.045)", borderColor: colors.cardStroke, borderRadius: 14, borderWidth: 1, flex: 1, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 40 },
  actionText: { color: colors.textSecondary, fontSize: 12, fontWeight: "800" },
  saveActionButton: { backgroundColor: "rgba(0,163,255,0.08)", borderColor: "rgba(0,163,255,0.24)" },
  saveActionText: { color: colors.accent },
  iconButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 18, height: 38, justifyContent: "center", width: 38 },
  aiIdentity: { alignItems: "center", flexDirection: "row", gap: 10 },
  aiOrb: { alignItems: "center", backgroundColor: "rgba(0,163,255,0.14)", borderColor: "rgba(0,163,255,0.45)", borderRadius: 18, borderWidth: 1, height: 36, justifyContent: "center", shadowColor: colors.accent, shadowOpacity: 0.55, shadowRadius: 12, width: 36 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "900", letterSpacing: 2 },
  online: { color: colors.teal, fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  historyPanel: { gap: 12, padding: 14 },
  historyHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  historyTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "800" },
  newChat: { color: colors.accent, fontSize: 13, fontWeight: "800" },
  sessionList: { gap: 8 },
  messages: { flex: 1, zIndex: 1 },
  messageContent: { flexGrow: 1, gap: 12, justifyContent: "flex-end", paddingBottom: 18, paddingTop: 18 },
  bubble: { borderRadius: 20, maxWidth: "90%", paddingHorizontal: 16, paddingVertical: 13 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#253044", borderBottomRightRadius: 6 },
  assistantBubble: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.055)", borderColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderBottomLeftRadius: 5 },
  messageText: { color: colors.textPrimary, fontSize: 15, lineHeight: 23 },
  typingBubble: { alignItems: "center", flexDirection: "row", gap: 9 },
  typingDots: { alignItems: "center", flexDirection: "row", gap: 5, paddingHorizontal: 4, paddingVertical: 5 },
  typingDot: { backgroundColor: colors.accent, borderRadius: 4, height: 8, width: 8 },
  typingDotDim: { opacity: 0.58 },
  typingDotFaint: { opacity: 0.28 },
  errorCard: { alignItems: "center", alignSelf: "center", backgroundColor: "rgba(255,199,51,0.10)", borderColor: "rgba(255,199,51,0.26)", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 9, marginTop: 4, maxWidth: "94%", padding: 12 },
  errorText: { color: colors.textSecondary, flex: 1, fontSize: 12, lineHeight: 17 },
  retryButton: { backgroundColor: "rgba(255,199,51,0.16)", borderColor: "rgba(255,199,51,0.40)", borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: colors.gold, fontSize: 11, fontWeight: "900" },
  saveStatus: { color: colors.teal, fontSize: 12, lineHeight: 18, textAlign: "center" },
  emptyState: { alignItems: "center", gap: 9, justifyContent: "center", paddingHorizontal: 28, paddingVertical: 40 },
  emptyTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: "800", textAlign: "center" },
  emptyCopy: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: "center" },
  suggestionScroller: { flexGrow: 0, maxHeight: 44, zIndex: 4 },
  suggestions: { alignItems: "center", gap: 8, paddingRight: 8 },
  composer: { alignItems: "center", backgroundColor: "#101015", borderColor: "rgba(0,163,255,0.34)", borderRadius: 22, borderWidth: 1, flexDirection: "row", gap: 5, padding: 5, shadowColor: colors.accent, shadowOpacity: 0.18, shadowRadius: 16, zIndex: 5 },
  composerFocused: { borderColor: "rgba(0,163,255,0.72)", marginHorizontal: -10, shadowOpacity: 0.32 },
  composerMark: { alignItems: "center", height: 38, justifyContent: "center", width: 36 },
  input: { color: colors.textPrimary, flex: 1, fontSize: 14, maxHeight: 56, minHeight: 38, paddingHorizontal: 4, paddingVertical: 8 },
  sendButton: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 19, height: 38, justifyContent: "center", width: 38 },
  sendDisabled: { opacity: 0.4 },
  assistantSkeleton: { alignSelf: "flex-start", width: "82%" },
  userSkeleton: { alignSelf: "flex-end", width: "64%" }
});



