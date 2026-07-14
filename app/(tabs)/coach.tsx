import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { FitneoAiMark } from "@/components/FitneoAiMark";
import { SkeletonBlock } from "@/components/ScreenKit";
import { useAuth } from "@/context/AuthContext";
import {
  ChatMessageRecord,
  ChatSessionSummary,
  createChatSession,
  fetchChatMessages,
  fetchChatSessions,
  saveChatMessage,
  updateChatSessionTitle
} from "@/lib/api";
import { askFitneoCoachWithRetry } from "@/lib/edgeFunctions";
import { generatePersonalizedPlan } from "@/lib/generateAiPlan";
import { colors, radii, spacing } from "@/lib/theme";

const suggestions = [
  { icon: "calendar-outline" as const, title: "Build my weekly plan" },
  { icon: "flash-outline" as const, title: "Generate a HIIT workout" },
  { icon: "pulse-outline" as const, title: "Review my recovery" },
  { icon: "restaurant-outline" as const, title: "Tune my calories" }
];
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
  const { user } = useAuth();
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyQuery, setHistoryQuery] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const dotOne = useRef(new Animated.Value(0.35)).current;
  const dotTwo = useRef(new Animated.Value(0.35)).current;
  const dotThree = useRef(new Animated.Value(0.35)).current;

  async function newChat() {
    setError(null);
    setSaveStatus(null);
    setHistoryOpen(false);
    setMenuOpen(false);
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

  function formatSessionDate(value?: string) {
    if (!value) return "";
    const created = new Date(value);
    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const startCreated = new Date(created.getFullYear(), created.getMonth(), created.getDate()).getTime();
    const dayDiff = Math.round((startToday - startCreated) / 86_400_000);
    if (dayDiff === 0) return "Today";
    if (dayDiff === 1) return "Yesterday";
    return created.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function getSessionTitle(session: ChatSessionSummary) {
    if (session.id === activeSession?.id) {
      const firstUser = messages.find((message) => message.role === "user")?.content;
      if (firstUser) return getChatTitle(firstUser);
    }
    return session.title && session.title !== "New Chat" ? session.title : "New Chat";
  }

  function getSessionPreview(session: ChatSessionSummary) {
    if (session.id === activeSession?.id) {
      const firstAi = messages.find((message) => message.role === "assistant")?.content;
      if (firstAi) return formatCoachMessage(firstAi).slice(0, 58);
      if (messages.length === 0) return "New conversation";
    }
    if (session.preview) return session.preview;
    return session.title && session.title !== "New Chat" ? "Saved coaching thread" : "New conversation";
  }

  function persistSessionTitle(session: ChatSessionSummary, title: string) {
    const titledSession = { ...session, title };
    setActiveSession((current) => current?.id === session.id ? titledSession : current);
    setSessions((current) => current.map((item) => item.id === session.id ? titledSession : item));
    if (!session.id.startsWith("local-")) {
      void updateChatSessionTitle(session.id, title).catch(() => {
        // Local title is still useful even if cloud title sync is unavailable.
      });
    }
    return titledSession;
  }

  async function openSession(session: ChatSessionSummary) {
    setActiveSession(session);
    setHistoryOpen(false);
    setSaveStatus(null);
    setIsLoading(true);
    try {
      const sessionMessages = await fetchChatMessages(session.id);
      setMessages(sessionMessages);
      const firstUser = sessionMessages.find((message) => message.role === "user")?.content;
      if (firstUser && session.title === "New Chat") {
        persistSessionTitle(session, getChatTitle(firstUser));
      }
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

  useEffect(() => {
    if (!isSending || streamingText) return;
    const makePulse = (value: Animated.Value) => Animated.sequence([
      Animated.timing(value, { duration: 260, toValue: 1, useNativeDriver: true }),
      Animated.timing(value, { duration: 260, toValue: 0.35, useNativeDriver: true })
    ]);
    const loop = Animated.loop(
      Animated.stagger(200, [makePulse(dotOne), makePulse(dotTwo), makePulse(dotThree)])
    );
    loop.start();
    return () => loop.stop();
  }, [dotOne, dotThree, dotTwo, isSending, streamingText]);

  const conversation = useMemo(
    () => messages.map((message) => ({ role: message.role, content: message.content })),
    [messages]
  );

  const filteredSessions = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();
    if (!query) return sessions;
    return sessions.filter((session) => {
      const title = getSessionTitle(session).toLowerCase();
      const preview = getSessionPreview(session).toLowerCase();
      return title.includes(query) || preview.includes(query);
    });
  }, [activeSession?.id, historyQuery, messages, sessions]);

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
      const nextTitle = getChatTitle(cleanPrompt);
      if (!session) {
        try {
          session = await createChatSession(nextTitle);
        } catch {
          session = { id: `local-${Date.now()}`, title: nextTitle, createdAt: new Date().toISOString() };
        }
        setActiveSession(session);
        setSessions((current) => [session!, ...current]);
      } else if (session.title === "New Chat") {
        session = persistSessionTitle(session, nextTitle);
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
      if (user?.id && shouldGenerateAppPlan(cleanPrompt)) {
        void generatePersonalizedPlan(user.id)
          .then(() => setSaveStatus("Your AI training plan has been generated and saved to My Plan."))
          .catch(() => setSaveStatus("FITNEO answered, but could not save a new app plan yet."));
      }
      setStreamingText("");
    } catch (err) {
      setLastFailedPrompt(cleanPrompt);
      setStreamingText("");
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
        <HeaderIconButton onPress={() => router.replace("/(tabs)")}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </HeaderIconButton>
        <View style={styles.aiIdentity}>
          <FitneoAiMark size={23} />
          <View>
            <Text style={styles.title}>FITNEO AI</Text>
            <View style={styles.subtitleRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.online}>{activeSession ? getSessionTitle(activeSession) : "New Chat"}</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          <HeaderIconButton onPress={() => { setMenuOpen(false); setHistoryOpen((current) => !current); }}>
            <Ionicons name="albums-outline" size={18} color={colors.textPrimary} />
          </HeaderIconButton>
          <HeaderIconButton onPress={() => void newChat()}>
            <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
          </HeaderIconButton>
          <HeaderIconButton onPress={() => { setHistoryOpen(false); setMenuOpen((current) => !current); }}>
            <Ionicons name="ellipsis-horizontal" size={18} color={colors.textPrimary} />
          </HeaderIconButton>
        </View>
      </View>

      {menuOpen ? (
        <View style={styles.menuCard}>
          <TouchableOpacity activeOpacity={0.78} style={styles.menuItem} onPress={() => { clearHistory(); setMenuOpen(false); }}>
            <Ionicons name="trash-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.menuText}>Clear History</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.78} style={styles.menuItem} onPress={() => { saveConversation(); setMenuOpen(false); }}>
            <Ionicons name="bookmark-outline" size={15} color={colors.accent} />
            <Text style={[styles.menuText, styles.saveActionText]}>Save Conversation</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {historyOpen ? (
        <View style={styles.drawerLayer}>
          <TouchableOpacity activeOpacity={1} style={styles.drawerScrim} onPress={() => setHistoryOpen(false)} />
          <View style={styles.historyPanel}>
          <View style={styles.historyHeader}>
            <Text style={styles.drawerBrand}>History</Text>
            <TouchableOpacity onPress={() => void newChat()}>
              <Text style={styles.newChat}>+ New Chat</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.historySearch}>
            <Ionicons name="search" size={16} color={colors.textTertiary} />
            <TextInput
              placeholder="Search conversations"
              placeholderTextColor={colors.textTertiary}
              style={styles.historySearchInput}
              value={historyQuery}
              onChangeText={setHistoryQuery}
              underlineColorAndroid="transparent"
            />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sessionList}>
            {filteredSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                onPress={() => void openSession(session)}
                style={[styles.sessionRow, session.id === activeSession?.id && styles.sessionRowActive]}
              >
                <View style={styles.sessionTextBlock}>
                  <Text numberOfLines={1} style={[styles.sessionTitle, session.id === activeSession?.id && styles.sessionTitleActive]}>
                    {getSessionTitle(session)}
                  </Text>
                  <Text numberOfLines={1} style={[styles.sessionPreview, session.id === activeSession?.id && styles.sessionPreviewActive]}>
                    {getSessionPreview(session)}
                  </Text>
                </View>
                <Text style={[styles.sessionDate, session.id === activeSession?.id && styles.sessionDateActive]}>{formatSessionDate(session.createdAt)}</Text>
              </TouchableOpacity>
            ))}
            {filteredSessions.length === 0 ? (
              <Text style={styles.noSessions}>No matching conversations yet.</Text>
            ) : null}
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
            <View style={styles.emptyOrb}>
              <FitneoAiMark size={34} />
            </View>
            <Text style={styles.emptyTitle}>Train smarter today.</Text>
            <Text style={styles.emptyCopy}>Tell FITNEO what you need — a plan, a meal target, recovery help, or a tighter routine.</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.emptySuggestions}
              style={styles.emptySuggestionScroller}
            >
              {suggestions.map((suggestion) => (
                <TouchableOpacity key={suggestion.title} style={styles.emptySuggestionChip} onPress={() => void sendPrompt(suggestion.title)}>
                  <Ionicons name={suggestion.icon} size={16} color={colors.accent} />
                  <Text style={styles.emptySuggestionText}>{suggestion.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          messages.map((message) => (
            <AnimatedMessageGroup key={message.id} role={message.role}>
              {message.role === "assistant" ? (
                <View style={styles.senderRow}>
                  <FitneoAiMark size={14} />
                  <Text style={styles.senderLabel}>FITNEO AI</Text>
                </View>
              ) : null}
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
            </AnimatedMessageGroup>
          ))
        )}
        {isSending ? (
          <View style={styles.typingGroup}>
            <View style={styles.senderRow}>
              <FitneoAiMark size={14} />
              <Text style={styles.senderLabel}>FITNEO AI</Text>
            </View>
            {streamingText ? (
              <Text style={styles.messageText}>{formatCoachMessage(streamingText)}</Text>
            ) : (
              <View style={styles.typingDots}>
                <Animated.View style={[styles.typingDot, { opacity: dotOne }]} />
                <Animated.View style={[styles.typingDot, { opacity: dotTwo }]} />
                <Animated.View style={[styles.typingDot, { opacity: dotThree }]} />
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

      <View style={styles.composerSeparator} />
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
        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            prompt.trim() && !isSending && styles.sendButtonReady,
            (!prompt.trim() || isSending) && styles.sendDisabled,
            pressed && prompt.trim() && !isSending && styles.sendPressed
          ]}
          onPress={() => void sendPrompt()}
          disabled={!prompt.trim() || isSending}
        >
          <Ionicons name={prompt.trim() && !isSending ? "arrow-up" : "mic-outline"} size={20} color={colors.textPrimary} />
        </Pressable>
      </View>
    </AppLayout>
  );
}

function HeaderIconButton({ children, onPress }: { children: ReactNode; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
    >
      {children}
    </Pressable>
  );
}

function AnimatedMessageGroup({ children, role }: { children: ReactNode; role: ChatMessageRecord["role"] }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { duration: 220, toValue: 1, useNativeDriver: true }),
      Animated.timing(translateY, { duration: 220, toValue: 0, useNativeDriver: true })
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.messageGroup,
        role === "user" && styles.userMessageGroup,
        { opacity, transform: [{ translateY }] }
      ]}
    >
      {children}
    </Animated.View>
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

function shouldGenerateAppPlan(value: string) {
  const normalized = value.toLowerCase();
  return (
    /(generate|build|create|make|calibrate).{0,28}(training|workout|weekly|4-week|sport)?.{0,18}plan/.test(normalized) ||
    /plan.{0,24}(generate|build|create|make|calibrate)/.test(normalized) ||
    normalized.includes("build my weekly plan")
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, gap: spacing.md, paddingBottom: spacing.xxl },
  flex: { flex: 1 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  headerActions: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  menuCard: { alignSelf: "flex-end", backgroundColor: colors.surfaceSoft, borderColor: colors.cardStroke, borderRadius: radii.lg, borderWidth: 1, gap: spacing.tiny, marginTop: -4, padding: spacing.sm, position: "absolute", right: 0, top: 48, width: 210, zIndex: 50 },
  menuItem: { alignItems: "center", borderRadius: 12, flexDirection: "row", gap: 9, minHeight: 40, paddingHorizontal: 10 },
  menuText: { color: colors.textSecondary, fontSize: 12, fontWeight: "800" },
  saveActionText: { color: colors.accent },
  iconButton: { alignItems: "center", borderRadius: radii.pill, height: 38, justifyContent: "center", opacity: 0.92, width: 38 },
  iconButtonPressed: { backgroundColor: colors.surfaceMuted, opacity: 0.66, transform: [{ scale: 0.94 }] },
  aiIdentity: { alignItems: "center", flex: 1, flexDirection: "row", gap: spacing.sm, minWidth: 0 },
  aiOrb: { alignItems: "center", backgroundColor: "rgba(0,163,255,0.18)", borderColor: "rgba(0,163,255,0.55)", borderRadius: 18, borderWidth: 1, height: 36, justifyContent: "center", shadowColor: colors.accent, shadowOpacity: 0.55, shadowRadius: 12, width: 36 },
  title: { color: colors.textPrimary, fontSize: 17, fontWeight: "900", letterSpacing: 1.2 },
  subtitleRow: { alignItems: "center", flexDirection: "row", gap: spacing.xs, marginTop: 2 },
  onlineDot: { backgroundColor: colors.teal, borderRadius: 4, height: 7, shadowColor: colors.teal, shadowOpacity: 0.9, shadowRadius: 8, width: 7 },
  online: { color: colors.textTertiary, fontSize: 11, fontWeight: "700", maxWidth: 190 },
  coachHero: { alignItems: "center", backgroundColor: "rgba(10,132,255,0.10)", borderColor: "rgba(10,132,255,0.24)", borderRadius: 20, borderWidth: 1, flexDirection: "row", gap: 12, padding: 14 },
  coachHeroIcon: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  coachHeroTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "900" },
  coachHeroCopy: { color: colors.textSecondary, fontSize: 11, fontWeight: "700", lineHeight: 16, marginTop: 2 },
  drawerLayer: { bottom: 0, left: 0, position: "absolute", right: 0, top: 0, zIndex: 40 },
  drawerScrim: { backgroundColor: "rgba(0,0,0,0.48)", bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  historyPanel: {
    backgroundColor: colors.background,
    borderRightColor: colors.cardStroke,
    borderRightWidth: 1,
    bottom: 0,
    gap: spacing.lg,
    left: 0,
    padding: spacing.lg,
    position: "absolute",
    top: 0,
    width: "88%",
    zIndex: 41
  },
  historyHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  drawerBrand: { color: colors.textPrimary, fontSize: 26, fontWeight: "900", letterSpacing: -0.7 },
  newChat: { color: colors.accent, fontSize: 13, fontWeight: "800" },
  historySearch: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, flexDirection: "row", gap: spacing.sm, minHeight: 44, paddingHorizontal: spacing.md },
  historySearchInput: { color: colors.textPrimary, flex: 1, fontSize: 14, paddingVertical: spacing.sm },
  sessionList: { gap: spacing.sm, paddingBottom: spacing.xl },
  sessionRow: { alignItems: "center", backgroundColor: "transparent", borderRadius: radii.lg, flexDirection: "row", gap: spacing.sm, minHeight: 64, paddingHorizontal: spacing.md },
  sessionRowActive: { backgroundColor: colors.surfaceAccentWash },
  sessionTextBlock: { flex: 1, minWidth: 0 },
  sessionTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "900" },
  sessionTitleActive: { color: colors.textPrimary },
  sessionPreview: { color: colors.textTertiary, fontSize: 11, lineHeight: 16, marginTop: 3 },
  sessionPreviewActive: { color: colors.textSecondary },
  sessionDate: { backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, color: colors.textTertiary, fontSize: 9, fontWeight: "900", marginLeft: 6, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4 },
  sessionDateActive: { backgroundColor: "rgba(0,163,255,0.16)", color: colors.accent },
  noSessions: { color: colors.textTertiary, fontSize: 13, fontWeight: "700", padding: spacing.md, textAlign: "center" },
  messages: { flex: 1, zIndex: 1 },
  messageContent: { flexGrow: 1, gap: spacing.lg, justifyContent: "flex-end", paddingBottom: spacing.xl, paddingTop: spacing.lg },
  messageGroup: { alignSelf: "flex-start", maxWidth: "94%" },
  userMessageGroup: { alignSelf: "flex-end" },
  bubble: { borderRadius: 22, maxWidth: "100%", paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  userBubble: { alignSelf: "flex-end", backgroundColor: colors.appBlueDeep, borderBottomRightRadius: spacing.xs },
  assistantBubble: { alignSelf: "flex-start", backgroundColor: "transparent", paddingHorizontal: spacing.xs, paddingVertical: spacing.xs },
  senderRow: { alignItems: "center", flexDirection: "row", gap: spacing.xs, marginBottom: spacing.xs, marginLeft: spacing.xs },
  senderLabel: { color: colors.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  messageText: { color: colors.textPrimary, fontSize: 15, lineHeight: 25 },
  messageActions: { alignItems: "center", flexDirection: "row", gap: spacing.xs, marginLeft: spacing.xs, marginTop: spacing.xs },
  messageAction: { alignItems: "center", borderRadius: radii.pill, height: 30, justifyContent: "center", width: 30 },
  typingGroup: { alignSelf: "flex-start", maxWidth: "94%", paddingHorizontal: spacing.xs },
  typingBubble: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  typingDots: { alignItems: "center", flexDirection: "row", gap: spacing.xs, paddingHorizontal: spacing.xs, paddingVertical: spacing.sm },
  typingDot: { backgroundColor: colors.accent, borderRadius: 4, height: 8, width: 8 },
  errorCard: { alignItems: "center", alignSelf: "center", backgroundColor: "rgba(255,199,51,0.10)", borderColor: "rgba(255,199,51,0.26)", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 9, marginTop: 4, maxWidth: "94%", padding: 12 },
  errorText: { color: colors.textSecondary, flex: 1, fontSize: 12, lineHeight: 17 },
  retryButton: { backgroundColor: "rgba(255,199,51,0.16)", borderColor: "rgba(255,199,51,0.40)", borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: colors.gold, fontSize: 11, fontWeight: "900" },
  saveStatus: { color: colors.teal, fontSize: 12, lineHeight: 18, textAlign: "center" },
  emptyState: { alignItems: "flex-start", gap: spacing.md, justifyContent: "center", paddingVertical: 40 },
  emptyOrb: { alignItems: "center", backgroundColor: colors.surfaceAccentWash, borderRadius: radii.pill, height: 68, justifyContent: "center", marginBottom: spacing.sm, width: 68 },
  emptyTitle: { color: colors.textPrimary, fontSize: 34, fontWeight: "900", letterSpacing: -1.2, lineHeight: 38 },
  emptyCopy: { color: colors.textSecondary, fontSize: 15, lineHeight: 23, maxWidth: 360 },
  emptySuggestionScroller: { flexGrow: 0, marginHorizontal: -spacing.screen, marginTop: spacing.md, maxHeight: 54 },
  emptySuggestions: { alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.screen },
  emptySuggestionChip: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, flexDirection: "row", gap: spacing.sm, minHeight: 46, paddingHorizontal: spacing.md },
  emptySuggestionText: { color: colors.textPrimary, fontSize: 13, fontWeight: "800" },
  composerSeparator: { backgroundColor: "rgba(255,255,255,0.06)", height: 1, marginBottom: 2 },
  composer: { alignItems: "center", backgroundColor: colors.surfaceSoft, borderColor: "transparent", borderRadius: radii.pill, borderWidth: 1, flexDirection: "row", gap: spacing.xs, padding: spacing.xs, shadowColor: colors.black, shadowOpacity: 0.30, shadowRadius: 20, zIndex: 5 },
  composerFocused: { borderColor: "rgba(0,163,255,0.70)", shadowColor: colors.accent, shadowOpacity: 0.24 },
  composerMark: { alignItems: "center", height: 38, justifyContent: "center", width: 36 },
  input: { color: colors.textPrimary, flex: 1, fontSize: 14, maxHeight: 56, minHeight: 38, paddingHorizontal: 4, paddingVertical: 8 },
  sendButton: { alignItems: "center", backgroundColor: colors.surfaceElevated, borderRadius: radii.pill, height: 38, justifyContent: "center", width: 38 },
  sendButtonReady: { backgroundColor: colors.accent, transform: [{ scale: 1.04 }] },
  sendDisabled: { opacity: 0.52 },
  sendPressed: { opacity: 0.78, transform: [{ scale: 0.94 }] },
  assistantSkeleton: { alignSelf: "flex-start", width: "82%" },
  userSkeleton: { alignSelf: "flex-end", width: "64%" }
});



