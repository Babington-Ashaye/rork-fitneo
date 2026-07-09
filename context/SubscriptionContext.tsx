import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import type {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage
} from "react-native-purchases";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const REVENUECAT_API_KEY = "test_ZzlVNfzMbUjBXRMknqDjIEOaWQe";
const WEB_CHECKOUT_URLS = {
  pro: "https://fitneo.app/checkout/pro",
  elite: "https://fitneo.app/checkout/elite"
} as const;

let isRevenueCatConfigured = false;
let revenueCatConfigurePromise: Promise<void> | null = null;

export type SubscriptionTier = "free" | "pro" | "elite";
export type CheckoutTier = "pro" | "elite";
export type BillingCadence = "monthly" | "yearly";
export type SubscriptionPlatform = "native" | "web";
export type RevenueCatActiveTier = "None" | "Pro" | "Elite";

export type SubscriptionStatusResult = {
  platform: SubscriptionPlatform;
  activeTier: RevenueCatActiveTier;
  activeEntitlements: Record<string, unknown>;
  message: string;
};

export type SubscriptionCheckoutResult = SubscriptionStatusResult & {
  requestedTier: CheckoutTier;
  checkoutUrl?: string;
};

type SubscriptionContextValue = {
  tier: SubscriptionTier;
  subscriptionPlatform: SubscriptionPlatform;
  revenueCatAvailable: boolean;
  isTrial: boolean;
  isPremium: boolean;
  isElite: boolean;
  isLoading: boolean;
  isFreeExpired: boolean;
  aiScansRemaining: number;
  aiMessagesToday: number;
  weeklyWorkoutCount: number;
  refreshSubscription: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<SubscriptionStatusResult>;
  startSubscriptionCheckout: (
    tier: CheckoutTier,
    cadence?: BillingCadence
  ) => Promise<SubscriptionCheckoutResult>;
  getWebCheckoutUrl: (tier: CheckoutTier, cadence?: BillingCadence) => string;
};

type ProfileRow = {
  subscription_status: SubscriptionTier | null;
  trial_expires_at: string | null;
  ai_scans_remaining: number | null;
  ai_messages_today: number | null;
  weekly_workout_count: number | null;
};

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

type PurchasesModule = typeof import("react-native-purchases").default;

async function getNativePurchases(): Promise<PurchasesModule> {
  if (Platform.OS === "web") {
    throw new Error("RevenueCat native SDK is not available on web.");
  }

  const purchasesModule = await import("react-native-purchases");
  return purchasesModule.default;
}

async function configureRevenueCat(): Promise<void> {
  if (Platform.OS === "web" || isRevenueCatConfigured) return;

  if (!revenueCatConfigurePromise) {
    revenueCatConfigurePromise = (async () => {
      const Purchases = await getNativePurchases();

      if (__DEV__) {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      }

      Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      isRevenueCatConfigured = true;
    })().catch((error) => {
      revenueCatConfigurePromise = null;
      throw error;
    });
  }

  return revenueCatConfigurePromise;
}

function getRevenueCatTier(customerInfo: CustomerInfo): RevenueCatActiveTier {
  const activeEntitlements = Object.keys(customerInfo.entitlements.active).map((key) =>
    key.toLowerCase()
  );

  if (activeEntitlements.includes("elite")) return "Elite";
  if (activeEntitlements.includes("pro")) return "Pro";
  return "None";
}

function findTierPackage(
  offerings: PurchasesOfferings,
  tier: CheckoutTier,
  cadence?: BillingCadence
): PurchasesPackage {
  const allOfferings = Object.values(offerings.all);
  const matchingOffering = allOfferings.find(
    (offering) => offering.identifier.toLowerCase() === tier
  );
  const candidates = matchingOffering?.availablePackages.length
    ? matchingOffering.availablePackages
    : allOfferings.flatMap((offering) => offering.availablePackages);

  const packageMatches = (item: PurchasesPackage, shouldMatchCadence: boolean) => {
    const searchableIdentifier =
      `${item.identifier} ${item.product.identifier} ${item.offeringIdentifier}`.toLowerCase();
    const matchesTier = searchableIdentifier.includes(tier);

    if (!matchesTier || !shouldMatchCadence || !cadence) return matchesTier;

    const cadenceAliases =
      cadence === "yearly" ? ["year", "yearly", "annual"] : ["month", "monthly"];

    return cadenceAliases.some((alias) => searchableIdentifier.includes(alias));
  };

  const match =
    candidates.find((item) => packageMatches(item, true)) ??
    candidates.find((item) => packageMatches(item, false));

  if (match) return match;

  const available = candidates
    .map((item) => `${item.identifier} (${item.product.identifier})`)
    .join(", ");
  throw new Error(
    `No RevenueCat package matched "${tier}". Available packages: ${available || "none"}`
  );
}

function getLocalActiveTier(profile: ProfileRow | null): RevenueCatActiveTier {
  if (profile?.subscription_status === "elite") return "Elite";
  if (profile?.subscription_status === "pro") return "Pro";
  return "None";
}

function getWebCheckoutUrl(tier: CheckoutTier, cadence?: BillingCadence): string {
  const baseUrl = WEB_CHECKOUT_URLS[tier];
  return cadence ? `${baseUrl}?billing=${cadence}` : baseUrl;
}

export function SubscriptionProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void configureRevenueCat();
  }, []);

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

  async function checkSubscriptionStatus(): Promise<SubscriptionStatusResult> {
    if (Platform.OS === "web") {
      return {
        platform: "web",
        activeTier: getLocalActiveTier(profile),
        activeEntitlements: {},
        message:
          "Web mode is using FITNEO profile access only. RevenueCat native SDK was bypassed safely."
      };
    }

    await configureRevenueCat();
    const Purchases = await getNativePurchases();
    const customerInfo = await Purchases.getCustomerInfo();

    return {
      platform: "native",
      activeTier: getRevenueCatTier(customerInfo),
      activeEntitlements: customerInfo.entitlements.active as Record<string, unknown>,
      message: "RevenueCat customer info loaded from the native SDK."
    };
  }

  async function startSubscriptionCheckout(
    requestedTier: CheckoutTier,
    cadence?: BillingCadence
  ): Promise<SubscriptionCheckoutResult> {
    if (Platform.OS === "web") {
      const checkoutUrl = getWebCheckoutUrl(requestedTier, cadence);

      if (typeof window !== "undefined" && window.location) {
        window.location.href = checkoutUrl;
      }

      return {
        platform: "web",
        requestedTier,
        checkoutUrl,
        activeTier: getLocalActiveTier(profile),
        activeEntitlements: {},
        message: `Redirecting to the ${requestedTier.toUpperCase()} web checkout placeholder.`
      };
    }

    await configureRevenueCat();
    const Purchases = await getNativePurchases();
    const offerings = await Purchases.getOfferings();
    const selectedPackage = findTierPackage(offerings, requestedTier, cadence);
    const { customerInfo } = await Purchases.purchasePackage(selectedPackage);

    return {
      platform: "native",
      requestedTier,
      activeTier: getRevenueCatTier(customerInfo),
      activeEntitlements: customerInfo.entitlements.active as Record<string, unknown>,
      message: `Completed ${requestedTier.toUpperCase()} native checkout.`
    };
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
      subscriptionPlatform: Platform.OS === "web" ? "web" : "native",
      revenueCatAvailable: Platform.OS !== "web",
      isTrial,
      isPremium,
      isElite,
      isLoading,
      isFreeExpired,
      aiScansRemaining: profile?.ai_scans_remaining ?? 0,
      aiMessagesToday: profile?.ai_messages_today ?? 0,
      weeklyWorkoutCount: profile?.weekly_workout_count ?? 0,
      refreshSubscription,
      checkSubscriptionStatus,
      startSubscriptionCheckout,
      getWebCheckoutUrl
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
