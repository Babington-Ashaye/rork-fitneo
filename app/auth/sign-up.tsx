import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { AuthNotice } from "@/components/AuthNotice";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured, supabaseConfigStatus } from "@/lib/supabase";
import { colors, radii } from "@/lib/theme";

export default function SignUpScreen() {
  const { error, isLoading, signInWithGoogle, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const authErrorMessage = getAuthErrorMessage(localError ?? error);

  async function submit() {
    setLocalError(null);
    setStatusMessage(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setLocalError("Please enter your email.");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }
    const result = await signUp(cleanEmail, password);
    if (result.needsEmailConfirmation) {
      setPassword("");
      setStatusMessage(result.message ?? "Account created. Check your email to confirm your account.");
      return;
    }
    if (result.ok) {
      router.replace("/");
      return;
    }
    if (result.message) {
      setLocalError(result.message);
    }
  }

  async function continueWithGoogle() {
    setLocalError(null);
    setStatusMessage(null);
    const ok = await signInWithGoogle();
    if (ok) {
      router.replace("/");
    }
  }

  return (
    <AppLayout style={styles.authViewport} contentContainerStyle={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboard}>
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.logoBlock}>
            <View style={styles.logoGlow}>
              <Ionicons name="fitness" size={42} color={colors.accent} />
            </View>
            <Text style={styles.logo}>FITNEO</Text>
            <Text style={styles.tagline}>Create your AI-powered fitness OS.</Text>
          </View>

          <View style={styles.form}>
        <Text style={styles.title}>Create Account</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          onBlur={() => setEmailFocused(false)}
          onFocus={() => setEmailFocused(true)}
          placeholder="Email Address"
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, emailFocused && styles.inputFocused]}
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
          underlineColorAndroid="transparent"
        />
        <View style={[styles.passwordRow, passwordFocused && styles.inputFocused]}>
          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.textTertiary}
            onBlur={() => setPasswordFocused(false)}
            onFocus={() => setPasswordFocused(true)}
            secureTextEntry={!showPassword}
            style={styles.passwordInput}
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
            underlineColorAndroid="transparent"
          />
          <TouchableOpacity activeOpacity={0.72} onPress={() => setShowPassword((current) => !current)} style={styles.eyeButton}>
            <Ionicons name={showPassword ? "eye" : "eye-off"} size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
        {!isSupabaseConfigured ? (
          <AuthNotice
            icon="cloud-offline"
            title="Secure sign-up is waiting on configuration"
            message={`Missing ${[
              !supabaseConfigStatus.hasUrl ? "EXPO_PUBLIC_SUPABASE_URL" : null,
              !supabaseConfigStatus.hasAnonKey ? "EXPO_PUBLIC_SUPABASE_ANON_KEY" : null
            ].filter(Boolean).join(" and ")}. Add it in Vercel Environment Variables, then redeploy with a clean build cache.`}
          />
        ) : null}
        {statusMessage ? <AuthNotice icon="mail" title="Check your email" message={statusMessage} /> : null}
        {authErrorMessage ? <AuthNotice icon="alert-circle" title="Sign-up needs attention" message={authErrorMessage} danger /> : null}
        <TouchableOpacity activeOpacity={0.82} disabled={isLoading} onPress={submit} style={[styles.primaryButton, isLoading && styles.disabled]}>
          {isLoading ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.primaryText}>Create Account</Text>}
        </TouchableOpacity>
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>
        <TouchableOpacity activeOpacity={0.82} disabled={isLoading} onPress={continueWithGoogle} style={styles.googleButton}>
          <Image source={require("../../assets/google-g.png")} style={styles.googleLogo} />
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>
        <View style={styles.footerBlock}>
          <Text style={styles.legal}>
            By continuing, you agree to FITNEO's Consumer Terms & Usage Policy and acknowledge our Privacy Policy.
          </Text>
          <Link href="/login" asChild>
            <TouchableOpacity activeOpacity={0.72} style={styles.loginRow}>
              <Text style={styles.loginMuted}>Already have an account?</Text>
              <Text style={styles.loginAction}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppLayout>
  );
}

function getAuthErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === "string") return error.trim() || null;
  if (typeof error === "object") {
    const record = error as { message?: unknown; code?: unknown };
    const message = typeof record.message === "string" ? record.message.trim() : "";
    const code = typeof record.code === "string" ? record.code.trim() : "";
    return message || code || null;
  }
  return "Please check your details and try again.";
}

const styles = StyleSheet.create({
  authViewport: {
    ...(Platform.OS === "web"
      ? {
          height: "100dvh" as never,
          maxHeight: "100dvh" as never,
          overflow: "hidden" as const,
          width: "100%"
        }
      : {})
  },
  screen: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 0
  },
  keyboard: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    width: "100%"
  },
  scroll: {
    flex: 1,
    width: "100%"
  },
  scrollContent: {
    alignItems: "center",
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 18
  },
  logoBlock: {
    alignItems: "center",
    gap: 12,
    paddingTop: 0
  },
  logoGlow: {
    alignItems: "center",
    backgroundColor: "rgba(10,132,255,0.18)",
    borderRadius: 50,
    height: 100,
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOpacity: 0.55,
    shadowRadius: 18,
    width: 100
  },
  logo: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 6,
    fontFamily: Platform.select({ web: "Inter, Avenir Next, Montserrat, system-ui, sans-serif", default: undefined }),
    textShadowColor: "rgba(10,132,255,0.62)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 14
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: "center"
  },
  form: {
    gap: 16,
    marginTop: 30,
    maxWidth: 400,
    width: "100%"
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "700"
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 16
  },
  inputFocused: {
    borderColor: "rgba(0,242,160,0.62)",
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 12
  },
  passwordRow: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 52
  },
  passwordInput: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 16
  },
  eyeButton: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    width: 48
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: 52
  },
  disabled: {
    opacity: 0.65
  },
  primaryText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700"
  },
  dividerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  divider: {
    backgroundColor: "rgba(255,255,255,0.10)",
    flex: 1,
    height: 1
  },
  dividerText: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: "700"
  },
  googleButton: {
    alignItems: "center",
    backgroundColor: colors.textPrimary,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    minHeight: 52,
    padding: 14
  },
  googleLogo: {
    height: 20,
    resizeMode: "contain",
    width: 20
  },
  googleText: {
    color: "#333333",
    fontSize: 16,
    fontWeight: "700"
  },
  legal: {
    color: colors.textTertiary,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center"
  },
  link: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center"
  },
  footerBlock: {
    gap: 8,
    paddingBottom: 8
  },
  loginRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 36
  },
  loginMuted: {
    color: colors.textTertiary,
    fontSize: 13,
    fontWeight: "600"
  },
  loginAction: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "900"
  }
});
