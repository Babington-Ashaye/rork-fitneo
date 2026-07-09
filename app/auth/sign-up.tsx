import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { colors, radii } from "@/lib/theme";

export default function SignUpScreen() {
  const { error, isLoading, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function submit() {
    setLocalError(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setLocalError("Please enter your email.");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }
    const ok = await signUp(cleanEmail, password);
    if (ok) {
      router.replace("/");
    }
  }

  return (
    <AppLayout scroll contentContainerStyle={styles.screen}>
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
          placeholder="Email Address"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
          underlineColorAndroid="transparent"
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.textTertiary}
          secureTextEntry
          style={styles.input}
          textContentType="newPassword"
          value={password}
          onChangeText={setPassword}
          underlineColorAndroid="transparent"
        />
        {localError || error ? <Text style={styles.error}>{localError ?? error}</Text> : null}
        <TouchableOpacity activeOpacity={0.82} disabled={isLoading} onPress={submit} style={[styles.primaryButton, isLoading && styles.disabled]}>
          {isLoading ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.primaryText}>Create Account</Text>}
        </TouchableOpacity>
        <Text style={styles.legal}>
          By continuing, you agree to FITNEO's Consumer Terms & Usage Policy and acknowledge our Privacy Policy.
        </Text>
        <Link href="/auth/sign-in" asChild>
          <TouchableOpacity activeOpacity={0.72}>
            <Text style={styles.link}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    paddingHorizontal: 24
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
    letterSpacing: 6
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
