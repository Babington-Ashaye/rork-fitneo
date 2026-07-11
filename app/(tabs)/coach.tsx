import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { Chip, SkeletonBlock } from "@/components/ScreenKit";
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

const suggestions = ["Build my weekly plan", "Generate a HIIT workout", "Review my recovery", "Tune my calories"];
const LOCAL_HISTORY_KEY = "fitneo.ai.chatHistory.v1";

const coachMemory: {
  activeSession: ChatSessionSummary | null;
  messages: ChatMessageRecord[];
  sessions: ChatSessionSummary[];
} = {
  activeSession: null,
  messages: [],
  sessions: []
};

type LocalCoachSnapshot = typeof coachMemory;

async function loadLocalCoachSnapshot(): Promise<LocalCoachSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_HISTORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalCoachSnapshot>;
    if (!Array.isArray(parsed.messages) || !Array.isArray(parsed.sessions)) return null;
    return {
      activeSession: parsed.activeSession ?? parsed.sessions[0] ?? null,
      messages: parsed.messages,
      sessions: parsed.sessions
    };
  } catch {
    return null;
  }
}

async function saveLocalCoachSnapshot(snapshot: LocalCoachSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(snapshot));
  } catch {
    // Local history is a convenience layer; it should never break the live chat UI.
  }
}

export default function CoachScreen() {
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

  function getChatTitle(value: string) {
    const clean = value.replace(/\s+/g, " ").trim();
    if (!clean) return "New Chat";
    return clean.length > 34 ? `${clean.slice(0, 34)}…` : clean;
  }

  function isGreeting(value: string) {
    return /^(hi|hello|hey|yo|good morning|good afternoon|good evening)\W*$/i.test(value.trim());
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

      const localSnapshot = await loadLocalCoachSnapshot();
      if (localSnapshot?.activeSession) {
        coachMemory.activeSession = localSnapshot.activeSession;
        coachMemory.messages = localSnapshot.messages;
        coachMemory.sessions = localSnapshot.sessions;
        setActiveSession(localSnapshot.activeSession);
        setMessages(localSnapshot.messages);
        setSessions(localSnapshot.sessions);
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
        if (!localSnapshot?.activeSession) {
          const localSession = { id: `local-${Date.now()}`, title: "New Chat", createdAt: new Date().toISOString() };
          setActiveSession(localSession);
          setSessions([localSession]);
        }
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
    void saveLocalCoachSnapshot({
      activeSession,
      messages,
      sessions
    });
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
          session = await createChatSession(getChatTitle(cleanPrompt));
        } catch {
          session = { id: `local-${Date.now()}`, title: getChatTitle(cleanPrompt), createdAt: new Date().toISOString() };
        }
        setActiveSession(session);
        setSessions((current) => [session!, ...current]);
      } else if (session.title === "New Chat") {
        const titledSession = { ...session, title: getChatTitle(cleanPrompt) };
        session = titledSession;
        setActiveSession(titledSession);
        setSessions((current) => current.map((item) => item.id === titledSession.id ? titledSession : item));
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

      if (isGreeting(cleanPrompt)) {
        const assistantMessage: ChatMessageRecord = {
          id: `local-assistant-${Date.now()}`,
          role: "assistant",
          content: "How can I assist your fitness journey today?",
          createdAt: new Date().toISOString()
        };
        setMessages((current) => [...current, assistantMessage]);
        setStreamingText("");
        return;
      }

      const response = await askFitneoCoachWithRetry(cleanPrompt, {
        sessionId: session.id,
        history: conversation,
        onChunk: setStreamingText
      }, 1);
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
    void saveLocalCoachSnapshot({ activeSession, messages, sessions });
    setSaveStatus(messages.length > 0 ? "Conversation saved on this device." : "Nothing to save yet.");
  }

  async function copyMessage(content: string) {
    const clean = formatCoachMessage(content);
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(clean);
      setSaveStatus("Answer copied.");
      return;
    }
    setSaveStatus("Copy is available in your browser menu on this device.");
  }

  async function shareMessage(content: string) {
    try {
      await Share.share({ message: formatCoachMessage(content) });
    } catch {
      setSaveStatus("Sharing is not available on this device.");
    }
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
        <View style={styles.drawerLayer}>
          <TouchableOpacity activeOpacity={1} style={styles.drawerScrim} onPress={() => setHistoryOpen(false)} />
          <View style={styles.historyPanel}>
          <View style={styles.historyHeader}>
            <Text style={styles.drawerBrand}>ChatGPT-style history</Text>
            <TouchableOpacity onPress={() => void newChat()}>
              <Text style={styles.newChat}>+ New Chat</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sessionList}>
            {sessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                onPress={() => void openSession(session)}
                style={[styles.sessionRow, session.id === activeSession?.id && styles.sessionRowActive]}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={session.id === activeSession?.id ? colors.textPrimary : colors.textSecondary} />
                <View style={styles.sessionTextBlock}>
                  <Text numberOfLines={1} style={[styles.sessionTitle, session.id === activeSession?.id && styles.sessionTitleActive]}>
                  {session.title}
                  </Text>
                  <Text numberOfLines={1} style={[styles.sessionPreview, session.id === activeSession?.id && styles.sessionPreviewActive]}>
                    {session.id === activeSession?.id && messages[0]?.content ? messages[0].content : "Fitness coaching thread"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          </View>
        </View>
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
            <View key={message.id} style={[styles.messageGroup, message.role === "user" && styles.userMessageGroup]}>
              <View style={[styles.bubble, message.role === "user" ? styles.userBubble : styles.assistantBubble]}>
                <Text style={styles.messageText}>{formatCoachMessage(message.content)}</Text>
              </View>
              {message.role === "assistant" ? (
                <View style={styles.messageActions}>
                  <TouchableOpacity style={styles.messageAction} onPress={() => void copyMessage(message.content)}>
                    <Ionicons name="copy-outline" size={15} color={colors.textTertiary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.messageAction} onPress={() => setSaveStatus("Thanks — FITNEO will tune future answers.")}>
                    <Ionicons name="thumbs-up-outline" size={15} color={colors.textTertiary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.messageAction} onPress={() => setSaveStatus("Feedback noted — I’ll make the next answer cleaner.")}>
                    <Ionicons name="thumbs-down-outline" size={15} color={colors.textTertiary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.messageAction} onPress={() => void shareMessage(message.content)}>
                    <Ionicons name="share-outline" size={15} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              ) : null}
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
  drawerLayer: { bottom: 0, left: 0, position: "absolute", right: 0, top: 0, zIndex: 40 },
  drawerScrim: { backgroundColor: "rgba(0,0,0,0.48)", bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  historyPanel: {
    backgroundColor: "#050506",
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 26,
    borderWidth: 1,
    bottom: 12,
    gap: 18,
    left: 0,
    padding: 18,
    position: "absolute",
    top: 0,
    width: "82%",
    zIndex: 41
  },
  historyHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  drawerBrand: { color: colors.textPrimary, fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  newChat: { color: colors.accent, fontSize: 13, fontWeight: "800" },
  sessionList: { gap: 10, paddingBottom: 18 },
  sessionRow: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.07)", borderColor: colors.cardStroke, borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, minHeight: 58, paddingHorizontal: 12 },
  sessionRowActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  sessionTextBlock: { flex: 1, minWidth: 0 },
  sessionTitle: { color: colors.textSecondary, fontSize: 13, fontWeight: "900" },
  sessionTitleActive: { color: colors.textPrimary },
  sessionPreview: { color: colors.textTertiary, fontSize: 10, marginTop: 3 },
  sessionPreviewActive: { color: "rgba(255,255,255,0.82)" },
  messages: { flex: 1, zIndex: 1 },
  messageContent: { flexGrow: 1, gap: 12, justifyContent: "flex-end", paddingBottom: 18, paddingTop: 18 },
  messageGroup: { alignSelf: "flex-start", maxWidth: "94%" },
  userMessageGroup: { alignSelf: "flex-end" },
  bubble: { borderRadius: 20, maxWidth: "100%", paddingHorizontal: 16, paddingVertical: 13 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#253044", borderBottomRightRadius: 6 },
  assistantBubble: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.055)", borderColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderBottomLeftRadius: 5 },
  messageText: { color: colors.textPrimary, fontSize: 15, lineHeight: 23 },
  messageActions: { alignItems: "center", flexDirection: "row", gap: 6, marginLeft: 6, marginTop: 7 },
  messageAction: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.045)", borderRadius: 13, height: 26, justifyContent: "center", width: 26 },
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



