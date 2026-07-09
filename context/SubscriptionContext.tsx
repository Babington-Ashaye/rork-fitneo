import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type SubscriptionTier = "free" | "pro" | "elite";

type SubscriptionContextValue = {
  tier: SubscriptionTier;
  isTrial: boolean;
  isPremium: boolean;
  isElite: boolean;
  isLoading: boolean;
  isFreeExpired: boolean;
  aiScansRemaining: number;
  aiMessagesToday: number;
  weeklyWorkoutCount: number;
  refreshSubscription: () => Promise<void>;
};

type ProfileRow = {
  subscription_status: SubscriptionTier | null;
  trial_expires_at: string | null;
  ai_scans_remaining: number | null;
  ai_messages_today: number | null;
  weekly_workout_count: number | null;
};

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshSubscription(): Promise<void> {
    if (!isSupabaseConfigured) {
      setProfile({
        subscription_status: "free",
        trial_expires_at: null,
        ai_scans_remaining: 0,
        ai_messages_today: 0,
        weekly_workout_count: 0
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const { data } = await supabase
      .from("user_profiles")
      .select("subscription_status, trial_expires_at, ai_scans_remaining, ai_messages_today, weekly_workout_count")
      .eq("id", userId)
      .maybeSingle();

    setProfile((data as ProfileRow | null) ?? null);
    setIsLoading(false);
  }

  useEffect(() => {
    void refreshSubscription();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      void refreshSubscription();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<SubscriptionContextValue>(() => {
    const tier = profile?.subscription_status ?? "free";
    const trialExpiresAt = profile?.trial_expires_at ? new Date(profile.trial_expires_at) : null;
    const isTrial = tier === "free" && Boolean(trialExpiresAt && trialExpiresAt.getTime() > Date.now());
    const isElite = tier === "elite";
    const isPremium = tier === "pro" || tier === "elite" || isTrial;
    const isFreeExpired = Boolean(profile) && tier === "free" && !isTrial;

    return {
      tier,
      isTrial,
      isPremium,
      isElite,
      isLoading,
      isFreeExpired,
      aiScansRemaining: profile?.ai_scans_remaining ?? 0,
      aiMessagesToday: profile?.ai_messages_today ?? 0,
      weeklyWorkoutCount: profile?.weekly_workout_count ?? 0,
      refreshSubscription
    };
  }, [isLoading, profile]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used inside SubscriptionProvider");
  }
  return context;
}
