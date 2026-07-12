import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { colors, radii } from "@/lib/theme";

const medicalDisclaimer =
  "FITNEO and its AI Coach provide fitness and nutritional information for educational purposes only. FITNEO is not a medical professional, and users should consult a physician before starting any diet or exercise program.";

export default function LegalConsentScreen() {
  const { acceptLegalTerms, needsOnboarding } = useAuth();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [medicalAccepted, setMedicalAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canContinue = termsAccepted && medicalAccepted && !isSaving;

  async function continueToApp() {
    if (!canContinue) return;
    setIsSaving(true);
    setError(null);
    try {
      await acceptLegalTerms();
      router.replace(needsOnboarding ? "/onboarding" : "/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record your acceptance.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brand}>
          <View style={styles.brandIcon}><Ionicons name="shield-checkmark" size={30} color={colors.accent} /></View>
          <Text style={styles.wordmark}>FITNEO</Text>
          <Text style={styles.kicker}>BEFORE YOU BEGIN</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Terms & Health Notice</Text>
          <Text style={styles.intro}>Please review and accept both confirmations. You cannot continue until both are selected.</Text>

          <ConsentRow
            checked={termsAccepted}
            onPress={() => setTermsAccepted((current) => !current)}
            title="I accept the Terms of Service"
            body="I agree to use FITNEO lawfully, provide accurate account information, and understand that recommendations depend on the information I provide."
          />
          <ConsentRow
            checked={medicalAccepted}
            onPress={() => setMedicalAccepted((current) => !current)}
            title="I acknowledge the Medical Liability Disclaimer"
            body={medicalDisclaimer}
          />

          <Text style={styles.timestampNote}>Your acceptance date and time will be recorded securely.</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.82}
            disabled={!canContinue}
            onPress={() => void continueToApp()}
            style={[styles.button, !canContinue && styles.buttonDisabled]}
          >
            {isSaving ? <ActivityIndicator color={colors.textPrimary} /> : (
              <>
                <Text style={styles.buttonText}>Accept and Continue</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.textPrimary} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function ConsentRow({
  body,
  checked,
  onPress,
  title
}: {
  body: string;
  checked: boolean;
  onPress: () => void;
  title: string;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      activeOpacity={0.78}
      onPress={onPress}
      style={[styles.consent, checked && styles.consentChecked]}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <Ionicons name="checkmark" size={17} color={colors.textPrimary} /> : null}
      </View>
      <View style={styles.consentCopy}>
        <Text style={styles.consentTitle}>{title}</Text>
        <Text style={styles.consentBody}>{body}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", padding: 22, paddingBottom: 40, paddingTop: 54 },
  brand: { alignItems: "center", gap: 8, marginBottom: 24 },
  brandIcon: { alignItems: "center", backgroundColor: "rgba(10,132,255,0.14)", borderRadius: 28, height: 56, justifyContent: "center", width: 56 },
  wordmark: { color: colors.textPrimary, fontSize: 29, fontWeight: "900", letterSpacing: 5 },
  kicker: { color: colors.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.8 },
  card: { backgroundColor: "rgba(18,24,40,0.96)", borderColor: colors.cardStroke, borderRadius: 24, borderWidth: 1, gap: 14, padding: 20 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: "900" },
  intro: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 2 },
  consent: { alignItems: "flex-start", backgroundColor: "rgba(255,255,255,0.035)", borderColor: colors.cardStroke, borderRadius: radii.lg, borderWidth: 1, flexDirection: "row", gap: 12, padding: 14 },
  consentChecked: { backgroundColor: "rgba(10,132,255,0.10)", borderColor: "rgba(10,132,255,0.65)" },
  checkbox: { alignItems: "center", borderColor: colors.textTertiary, borderRadius: 7, borderWidth: 1.5, height: 25, justifyContent: "center", marginTop: 1, width: 25 },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  consentCopy: { flex: 1, gap: 6 },
  consentTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "800" },
  consentBody: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  timestampNote: { color: colors.textTertiary, fontSize: 10, lineHeight: 15, textAlign: "center" },
  error: { color: colors.danger, fontSize: 12, textAlign: "center" },
  button: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 15, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 55 },
  buttonDisabled: { opacity: 0.38 },
  buttonText: { color: colors.textPrimary, fontSize: 15, fontWeight: "900" }
});
