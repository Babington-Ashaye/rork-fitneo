import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { RefObject, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { AuthNotice } from "@/components/AuthNotice";
import { AuthSkeleton } from "@/components/AuthSkeleton";
import { TouchableCard } from "@/components/ScreenKit";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured, supabaseConfigStatus } from "@/lib/supabase";
import { colors, radii } from "@/lib/theme";

/*
  Google OAuth setup:
  - Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    and EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in .env and Vercel.
  - Get the client IDs from console.cloud.google.com.
  - Keep the app scheme as "fitneo" and allow the matching callback in Supabase.
*/

export default function SignInScreen() {
  const { error, isLoading, resetPassword, signIn, signInWithGoogle } = useAuth();
  const emailInputRef = useRef<TextInput>(null);
  const [isScreenReady, setIsScreenReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const authErrorMessage = getAuthErrorMessage(localError ?? error);

  useEffect(() => {
    const timer = setTimeout(() => setIsScreenReady(true), 180);
    return () => clearTimeout(timer);
  }, []);

  async function submit() {
    setLocalError(null);
    setStatusMessage(null);
    setHintMessage(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setLocalError("Please enter your email.");
      return;
    }
    if (!password) {
      setLocalError("Please enter your password.");
      return;
    }

    const ok = await signIn(cleanEmail, password);
    if (ok) {
      router.replace("/");
    }
  }

  async function continueWithGoogle() {
    setLocalError(null);
    setStatusMessage(null);
    setHintMessage(null);
    setIsGoogleLoading(true);
    const ok = await signInWithGoogle();
    setIsGoogleLoading(false);
    if (ok) {
      router.replace("/");
    }
  }

  async function requestPasswordReset() {
    setLocalError(null);
    setStatusMessage(null);
    setHintMessage(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      emailInputRef.current?.focus();
      setHintMessage("Enter your email first and we'll send a secure reset link.");
      return;
    }

    const ok = await resetPassword(cleanEmail);
    if (ok) {
      setStatusMessage("Password reset link sent. Check your inbox to continue securely.");
    }
  }

  return (
    <AppLayout style={styles.authViewport} contentContainerStyle={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "web" ? undefined : Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboard}>
        <ImageBackground source={{ uri: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80" }} resizeMode="cover" style={StyleSheet.absoluteFillObject}>
          <View style={styles.authOverlay} />
        </ImageBackground>
        {!isScreenReady ? (
          <AuthSkeleton />
        ) : (
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
        <View style={styles.logoBlock}>
          <View style={styles.logoGlow}>
            <Ionicons name="fitness" size={30} color={colors.accent} />
          </View>
          <View style={styles.wordmarkWrap}>
            <Text style={styles.logo}>FITNEO</Text>
            <LinearGradient colors={["transparent", colors.accent, colors.teal, "transparent"]} style={styles.logoReflection} />
          </View>
          <Text style={styles.tagline}>The future of fitness is you.</Text>
        </View>

        <View style={styles.formShell}>
          <Text style={styles.title}>Welcome Back</Text>
          <Field
            inputRef={emailInputRef}
            label="Email"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (hintMessage) setHintMessage(null);
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
          />
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.passwordRow, passwordFocused && styles.inputFocused]}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={() => setPasswordFocused(false)}
                onFocus={() => setPasswordFocused(true)}
                placeholder="Enter password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
                textContentType="password"
                value={password}
                onChangeText={setPassword}
                underlineColorAndroid="transparent"
              />
              <TouchableOpacity activeOpacity={0.72} onPress={() => setShowPassword((current) => !current)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? "eye" : "eye-off"} size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.72} onPress={requestPasswordReset}>
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.noticeSlot}>
            {hintMessage ? <Text style={styles.hintText}>{hintMessage}</Text> : null}
          </View>

          {!isSupabaseConfigured ? (
            <AuthNotice
              icon="cloud-offline"
              title="Secure login is waiting on configuration"
              message={`Missing ${[
                !supabaseConfigStatus.hasUrl ? "EXPO_PUBLIC_SUPABASE_URL" : null,
                !supabaseConfigStatus.hasAnonKey ? "EXPO_PUBLIC_SUPABASE_ANON_KEY" : null
              ].filter(Boolean).join(" and ")}. Add it in Vercel Environment Variables, then redeploy with a clean build cache.`}
            />
          ) : null}

          {statusMessage ? <AuthNotice icon="mail" title="Reset email sent" message={statusMessage} /> : null}

          {authErrorMessage ? <AuthNotice icon="alert-circle" title="Sign-in needs attention" message={authErrorMessage} danger /> : null}

          <TouchableOpacity activeOpacity={0.82} disabled={isLoading} onPress={submit} style={[styles.primaryButton, isLoading && styles.disabled]}>
            {isLoading ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.primaryText}>Sign In</Text>}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <TouchableCard radius={radii.md} style={styles.googleButton} onPress={isLoading || isGoogleLoading ? undefined : continueWithGoogle}>
            <Image source={require("../../assets/google-g.png")} style={styles.googleLogo} />
            {isGoogleLoading ? <ActivityIndicator color="#333333" /> : <Text style={styles.googleText}>Continue with Google</Text>}
          </TouchableCard>

          <View style={styles.footerBlock}>
            <Link href="/auth/sign-up" asChild>
              <TouchableOpacity activeOpacity={0.76} style={styles.signupRow}>
                <Text style={styles.signupMuted}>Don't have an account?</Text>
                <Text style={styles.signupAction}>Sign up</Text>
              </TouchableOpacity>
            </Link>

            <Text style={styles.legal}>
              By continuing, you agree to FITNEO's Consumer Terms & Usage Policy and acknowledge our Privacy Policy.
            </Text>
          </View>

        </View>
          </ScrollView>
        )}
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

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  inputRef
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address";
  inputRef?: RefObject<TextInput | null>;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={inputRef}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={[styles.input, focused && styles.inputFocused]}
        textContentType="emailAddress"
        value={value}
        onChangeText={onChangeText}
        underlineColorAndroid="transparent"
      />
    </View>
  );
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
  authOverlay: {
    backgroundColor: "rgba(0,0,0,0.75)",
    flex: 1
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
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingVertical: 12
  },
  logoBlock: {
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingTop: 0
  },
  logoGlow: {
    alignItems: "center",
    backgroundColor: "rgba(10,132,255,0.18)",
    borderRadius: 50,
    height: 58,
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOpacity: 0.55,
    shadowRadius: 18,
    width: 58
  },
  logo: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 4,
    fontFamily: Platform.select({ web: "Inter, Avenir Next, Montserrat, system-ui, sans-serif", default: undefined }),
    textShadowColor: "rgba(10,132,255,0.7)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 14
  },
  wordmarkWrap: {
    alignItems: "center"
  },
  logoReflection: {
    borderRadius: 2,
    height: 2,
    marginTop: 3,
    opacity: 0.8,
    width: 138
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.4
  },
  formShell: {
    backgroundColor: "rgba(13,13,18,0.92)",
    borderColor: "rgba(255,255,255,0.10)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    gap: 9,
    marginTop: 10,
    maxWidth: 400,
    padding: 20,
    width: "100%"
  },
  title: {
    color: colors.textPrimary,
    fontSize: 25,
    fontWeight: "700",
    marginBottom: 2
  },
  fieldWrap: {
    gap: 7
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700"
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 16,
    minHeight: 48,
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
    minHeight: 48
  },
  passwordInput: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16
  },
  eyeButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44
  },
  forgot: {
    alignSelf: "flex-end",
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700"
  },
  noticeSlot: {
    justifyContent: "center",
    minHeight: 22
  },
  hintText: {
    color: colors.teal,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "right"
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: 48
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
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    minHeight: 48,
    padding: 12
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
  googleButtonDisabled: {
    opacity: 0.72
  },
  signupRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 28
  },
  signupMuted: {
    color: colors.textTertiary,
    fontSize: 13,
    fontWeight: "600"
  },
  signupAction: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "900"
  },
  footerBlock: {
    gap: 6,
    paddingBottom: 0
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
  }
});


