import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    access_token?: string;
    refresh_token?: string;
    error_description?: string;
  }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        if (params.error_description) {
          throw new Error(decodeURIComponent(params.error_description));
        }
        if (params.code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
          if (exchangeError) throw exchangeError;
        } else if (params.access_token && params.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token
          });
          if (sessionError) throw sessionError;
        } else {
          const currentSession = (await supabase.auth.getSession()).data.session;
          if (!currentSession) throw new Error("Google did not return an authorization session.");
        }
        if (mounted) router.replace("/");
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Could not finish Google sign-in.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [params.access_token, params.code, params.error_description, params.refresh_token]);

  return (
    <AppLayout contentContainerStyle={styles.screen}>
      {error ? (
        <>
          <Text style={styles.title}>Sign-in could not finish</Text>
          <Text style={styles.copy}>{error}</Text>
          <Text style={styles.link} onPress={() => router.replace("/auth/sign-in")}>Return to sign in</Text>
        </>
      ) : (
        <>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.copy}>Finishing secure Google sign-in…</Text>
        </>
      )}
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: "center", gap: 12, justifyContent: "center", padding: 28 },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: "900", textAlign: "center" },
  copy: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: "center" },
  link: { color: colors.accent, fontSize: 14, fontWeight: "800", marginTop: 8 }
});
