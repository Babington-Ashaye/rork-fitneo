import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { colors, radii } from "@/lib/theme";

const FEEDBACK_QUEUE_KEY = "fitneo.feedback.queue.v1";

export default function FeedbackScreen() {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function submitFeedback() {
    const clean = message.trim();
    if (clean.length < 4) {
      Alert.alert("Tell us a little more", "Write what you want improved so the FITNEO team can act on it.");
      return;
    }

    setIsSending(true);
    try {
      const existing = await AsyncStorage.getItem(FEEDBACK_QUEUE_KEY);
      const queue = existing ? JSON.parse(existing) as Array<{ message: string; createdAt: string }> : [];
      const nextQueue = [{ message: clean, createdAt: new Date().toISOString() }, ...queue].slice(0, 25);
      await AsyncStorage.setItem(FEEDBACK_QUEUE_KEY, JSON.stringify(nextQueue));

      const subject = encodeURIComponent("FITNEO feedback");
      const body = encodeURIComponent(clean);
      const mailto = `mailto:support@fitneo.app?subject=${subject}&body=${body}`;
      const canOpenMail = await Linking.canOpenURL(mailto);
      if (canOpenMail) {
        await Linking.openURL(mailto);
      }

      setMessage("");
      Alert.alert("Feedback saved", canOpenMail ? "Your mail app is open with the feedback ready to send." : "Thanks — your feedback was saved on this device.");
    } catch (err) {
      Alert.alert("Feedback failed", err instanceof Error ? err.message : "Could not save your feedback right now.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <AppLayout contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.78} style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Improve FITNEO</Text>
        <View style={styles.backSpacer} />
      </View>

      <View style={styles.hero}>
        <View style={styles.iconBubble}>
          <Ionicons name="chatbubble-ellipses" size={24} color={colors.textPrimary} />
        </View>
        <Text style={styles.title}>Tell us what to improve</Text>
        <Text style={styles.copy}>Report a bug, request a feature, or tell us where the app still feels weak. This screen is for real user feedback now — no more dead end.</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Your feedback</Text>
        <TextInput
          multiline
          numberOfLines={8}
          onChangeText={setMessage}
          placeholder="Example: The workout cards need clearer images for runners..."
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          textAlignVertical="top"
          underlineColorAndroid="transparent"
          value={message}
        />
        <TouchableOpacity activeOpacity={0.84} disabled={isSending} style={[styles.submitButton, isSending && styles.disabled]} onPress={() => void submitFeedback()}>
          <Text style={styles.submitText}>{isSending ? "Saving..." : "Send Feedback"}</Text>
          <Ionicons name="send" size={16} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 18 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  backButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 20, height: 42, justifyContent: "center", width: 42 },
  backSpacer: { height: 42, width: 42 },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "900" },
  hero: { backgroundColor: "rgba(10,132,255,0.10)", borderColor: "rgba(10,132,255,0.24)", borderRadius: 24, borderWidth: 1, gap: 10, padding: 20 },
  iconBubble: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 20, height: 42, justifyContent: "center", width: 42 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: "900", letterSpacing: -0.8 },
  copy: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  formCard: { backgroundColor: colors.surfaceSoft, borderColor: colors.cardStroke, borderRadius: 24, borderWidth: 1, gap: 12, padding: 18 },
  label: { color: colors.textPrimary, fontSize: 13, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase" },
  input: { backgroundColor: "rgba(255,255,255,0.045)", borderColor: colors.cardStroke, borderRadius: 18, borderWidth: 1, color: colors.textPrimary, fontSize: 15, lineHeight: 22, minHeight: 170, padding: 14 },
  submitButton: { alignItems: "center", backgroundColor: colors.accent, borderRadius: radii.lg, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 54 },
  submitText: { color: colors.textPrimary, fontSize: 15, fontWeight: "900" },
  disabled: { opacity: 0.55 }
});
