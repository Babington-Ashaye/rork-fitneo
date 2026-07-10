import { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { isSupabaseConfigured, missingSupabaseConfigMessage, supabase } from "@/lib/supabase";
import { secureStorage } from "@/lib/secureStorage";

const LOCAL_ONBOARDING_KEY = "fitneo.local.onboarding_completed";
const LEGAL_ACCEPTANCE_PREFIX = "fitneo.legal.accepted";
WebBrowser.maybeCompleteAuthSession();

function getOAuthRedirectUrl() {
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/auth/callback`;
  }

  return Linking.createURL("auth/callback");
}

function getFriendlyAuthError(error: unknown, fallback: string): string {
  const rawMessage = error instanceof Error ? error.message : "";
  const message = rawMessage.toLowerCase();

  if (message.includes("already registered") || message.includes("already exists")) {
    return "An account already exists for this email. Please sign in instead.";
  }
  if (message.includes("invalid email")) {
    return "Please enter a valid email address.";
  }
  if (message.includes("password")) {
    return rawMessage || "Please choose a stronger password.";
  }
  if (message.includes("rate limit") || message.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "Network issue while creating your account. Check your connection and try again.";
  }

  return rawMessage || fallback;
}

export type AuthProfile = {
  id: string;
  email: string | null;
  display_name: string | null;
  onboarding_completed: boolean | null;
  terms_accepted_at?: string | null;
  age?: number | null;
  gender?: string | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  primary_goal?: string | null;
  fitness_level?: string | null;
  activity_level?: string | null;
  daily_calorie_target?: number | null;
  daily_protein_target?: number | null;
  daily_carbs_target?: number | null;
  daily_fat_target?: number | null;
  dietary_preference?: string | null;
  onboarding_answers?: Record<string, unknown> | null;
};

type AuthContextValue = {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  needsOnboarding: boolean;
  needsLegalAcceptance: boolean;
  legalAcceptedAt: string | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  resetPassword: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  markLocalOnboardingComplete: () => Promise<void>;
  acceptLegalTerms: () => Promise<void>;
};

type SignUpResult = {
  ok: boolean;
  needsEmailConfirmation?: boolean;
  message?: string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [localOnboardingComplete, setLocalOnboardingComplete] = useState(false);
  const [legalAcceptedAt, setLegalAcceptedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadLocalOnboarding() {
    const value = await secureStorage.getItem(LOCAL_ONBOARDING_KEY);
    setLocalOnboardingComplete(value === "true");
  }

  async function hydrateLegalAcceptance(userId: string, remoteTimestamp?: string | null) {
    const key = `${LEGAL_ACCEPTANCE_PREFIX}.${userId}`;
    const localTimestamp = await secureStorage.getItem(key);
    const acceptedAt = remoteTimestamp ?? localTimestamp;
    setLegalAcceptedAt(acceptedAt);
    if (remoteTimestamp && remoteTimestamp !== localTimestamp) {
      await secureStorage.setItem(key, remoteTimestamp);
    }
  }

  async function ensureProfile(activeSession: Session | null): Promise<AuthProfile | null> {
    if (!activeSession?.user) {
      setProfile(null);
      setLegalAcceptedAt(null);
      return null;
    }

    if (!isSupabaseConfigured) {
      const localProfile: AuthProfile = {
        id: activeSession.user.id,
        email: activeSession.user.email ?? null,
        display_name: activeSession.user.email?.split("@")[0] ?? "Athlete",
        onboarding_completed: localOnboardingComplete
      };
      setProfile(localProfile);
      await hydrateLegalAcceptance(activeSession.user.id);
      return localProfile;
    }

    const user = activeSession.user;
    const baseProfile = {
      id: user.id,
      email: user.email ?? "",
      display_name: user.email?.split("@")[0] ?? "Athlete",
      onboarding_completed: false
    };

    const { data, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!data) {
      const { data: inserted, error: insertError } = await supabase
        .from("user_profiles")
        .upsert(baseProfile)
        .select("*")
        .single();
      if (insertError) {
        throw insertError;
      }
      setProfile(inserted as AuthProfile);
      await hydrateLegalAcceptance(user.id, (inserted as AuthProfile).terms_accepted_at);
      return inserted as AuthProfile;
    }

    setProfile(data as AuthProfile);
    await hydrateLegalAcceptance(user.id, (data as AuthProfile).terms_accepted_at);
    return data as AuthProfile;
  }

  async function refreshProfile() {
    try {
      setError(null);
      await ensureProfile(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile.");
    }
  }

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        setIsLoading(true);
        setError(null);
        await loadLocalOnboarding();

        if (!isSupabaseConfigured) {
          setSession(null);
          setProfile(null);
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (!mounted) {
          return;
        }
        setSession(data.session);
        await ensureProfile(data.session);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to restore session.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void boot();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void ensureProfile(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [localOnboardingComplete]);

  async function signIn(email: string, password: string) {
    setError(null);
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        setError(missingSupabaseConfigMessage);
        return false;
      }
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        throw signInError;
      }
      setSession(data.session);
      await ensureProfile(data.session);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect email or password.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function signUp(email: string, password: string) {
    setError(null);
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) {
        throw new Error("Please enter your email address.");
      }
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }
      if (!isSupabaseConfigured) {
        setError(missingSupabaseConfigMessage);
        return { ok: false, message: missingSupabaseConfigMessage };
      }
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: getOAuthRedirectUrl(),
          data: {
            display_name: cleanEmail.split("@")[0]
          }
        }
      });
      if (signUpError) {
        throw signUpError;
      }

      if (!data.user) {
        throw new Error("Sign-up did not return a user. Please try again.");
      }

      if (!data.session) {
        return {
          ok: true,
          needsEmailConfirmation: true,
          message: "Account created. Check your email to confirm your FITNEO account, then sign in."
        };
      }

      setSession(data.session);
      try {
        await ensureProfile(data.session);
      } catch (profileErr) {
        if (__DEV__) {
          console.warn("FITNEO profile sync after sign-up failed:", profileErr);
        }
      }

      return { ok: true, message: "Account created. Welcome to FITNEO." };
    } catch (err) {
      const message = getFriendlyAuthError(err, "Failed to create account.");
      setError(message);
      return { ok: false, message };
    } finally {
      setIsLoading(false);
    }
  }

  async function signInWithGoogle() {
    setError(null);
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        throw new Error(missingSupabaseConfigMessage);
      }

      const redirectTo = getOAuthRedirectUrl();
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true
        }
      });
      if (oauthError) {
        throw oauthError;
      }
      if (!data.url) {
        throw new Error("Google sign-in did not return an authorization URL.");
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== "success" || !result.url) {
        if (result.type === "cancel" || result.type === "dismiss") {
          return false;
        }
        throw new Error("Google sign-in could not complete.");
      }

      const callbackUrl = new URL(result.url);
      const hashParams = new URLSearchParams(callbackUrl.hash.replace(/^#/, ""));
      const authorizationCode = callbackUrl.searchParams.get("code");
      const accessToken = callbackUrl.searchParams.get("access_token") ?? hashParams.get("access_token");
      const refreshToken = callbackUrl.searchParams.get("refresh_token") ?? hashParams.get("refresh_token");
      const oauthDescription =
        callbackUrl.searchParams.get("error_description") ??
        hashParams.get("error_description");

      if (oauthDescription) {
        throw new Error(decodeURIComponent(oauthDescription.replace(/\+/g, " ")));
      }
      let oauthSession: Session | null = null;
      if (authorizationCode) {
        const { data: exchanged, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(authorizationCode);
        if (exchangeError) throw exchangeError;
        oauthSession = exchanged.session;
      } else if (accessToken && refreshToken) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        if (sessionError) throw sessionError;
        oauthSession = sessionData.session;
      } else {
        oauthSession = (await supabase.auth.getSession()).data.session;
      }
      if (!oauthSession) {
        throw new Error(`Google sign-in returned without a session. Allow ${redirectTo} in Supabase Auth redirect URLs.`);
      }
      setSession(oauthSession);
      await ensureProfile(oauthSession);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function resetPassword(email: string) {
    setError(null);
    try {
      if (!isSupabaseConfigured) {
        setError(missingSupabaseConfigMessage);
        return false;
      }

      const redirectTo = getOAuthRedirectUrl();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo
      });
      if (resetError) {
        throw resetError;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset email could not be sent.");
      return false;
    }
  }

  async function signOut() {
    setError(null);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setProfile(null);
    setLegalAcceptedAt(null);
  }

  async function markLocalOnboardingComplete() {
    await secureStorage.setItem(LOCAL_ONBOARDING_KEY, "true");
    setLocalOnboardingComplete(true);
  }

  async function acceptLegalTerms() {
    const userId = session?.user.id;
    if (!userId) {
      throw new Error("You must be signed in to accept the terms.");
    }
    const acceptedAt = new Date().toISOString();
    await secureStorage.setItem(`${LEGAL_ACCEPTANCE_PREFIX}.${userId}`, acceptedAt);
    setLegalAcceptedAt(acceptedAt);
    if (isSupabaseConfigured) {
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ terms_accepted_at: acceptedAt })
        .eq("id", userId);
      if (updateError) {
        // Local Keychain/Keystore evidence remains authoritative if sync is temporarily unavailable.
      }
    }
  }

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    const needsOnboarding = Boolean(user && profile && profile.onboarding_completed !== true);
    const needsLegalAcceptance = Boolean(user && !legalAcceptedAt);
    return {
      isLoading,
      session,
      user,
      profile,
      needsOnboarding,
      needsLegalAcceptance,
      legalAcceptedAt,
      error,
      signIn,
      signInWithGoogle,
      signUp,
      resetPassword,
      signOut,
      refreshProfile,
      markLocalOnboardingComplete,
      acceptLegalTerms
    };
  }, [error, isLoading, legalAcceptedAt, localOnboardingComplete, profile, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
