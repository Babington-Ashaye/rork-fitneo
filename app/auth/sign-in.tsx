import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { TouchableCard } from "@/components/ScreenKit";
import { useAuth } from "@/context/AuthContext";
import { colors, radii } from "@/lib/theme";

export default function SignInScreen() {
  const { error, isLoading, signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function submit() {
    setLocalError(null);
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
    const ok = await signInWithGoogle();
    if (ok) {
      router.replace("/");
    }
  }

  return (
    <AppLayout scroll contentContainerStyle={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <View style={styles.logoBlock}>
          <View style={styles.logoGlow}>
            <Ionicons name="fitness" size={42} color={colors.accent} />
          </View>
          <View style={styles.wordmarkWrap}>
            <Text style={styles.logo}>FITNEO</Text>
            <LinearGradient colors={["transparent", colors.accent, colors.teal, "transparent"]} style={styles.logoReflection} />
          </View>
          <Text style={styles.tagline}>The future of fitness is you.</Text>
        </View>

        <View style={styles.formShell}>
          <Text style={styles.title}>Welcome Back</Text>
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Enter password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
                textContentType="password"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity activeOpacity={0.72} onPress={() => setShowPassword((current) => !current)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? "eye" : "eye-off"} size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.72} onPress={() => setLocalError("Password reset will use Supabase email recovery once redirect URLs are configured.")}>
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>

          {localError || error ? <Text style={styles.error}>{localError ?? error}</Text> : null}

          <TouchableOpacity activeOpacity={0.82} disabled={isLoading} onPress={submit} style={[styles.primaryButton, isLoading && styles.disabled]}>
            {isLoading ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.primaryText}>Sign In</Text>}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <TouchableCard radius={radii.md} style={styles.googleButton} onPress={continueWithGoogle}>
            <Image source={require("../../assets/google-g.png")} style={styles.googleLogo} />
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableCard>

          <Text style={styles.legal}>
            By continuing, you agree to FITNEO's Consumer Terms & Usage Policy and acknowledge our Privacy Policy.
          </Text>

          <Link href="/auth/sign-up" asChild>
            <TouchableOpacity activeOpacity={0.72}>
              <Text style={styles.link}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </AppLayout>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address";
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
        textContentType="emailAddress"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    paddingHorizontal: 24
  },
  keyboard: {
    alignItems: "center",
    width: "100%"
  },
  logoBlock: {
    alignItems: "center",
    gap: 12,
    paddingTop: 48
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
    letterSpacing: 4,
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
    fontSize: 15
  },
  formShell: {
    gap: 16,
    marginTop: 30,
    maxWidth: 400,
    width: "100%"
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
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
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 16
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
    paddingHorizontal: 16
  },
  eyeButton: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    width: 48
  },
  forgot: {
    alignSelf: "flex-end",
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700"
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center"
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
  }
});
