import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import type {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage
} from "react-native-purchases";
import type { ExerciseAccessPlan } from "@/lib/exercises";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const REVENUECAT_API_KEY = "test_ZzlVNfzMbUjBXRMknqDjIEOaWQe";
const WEB_CHECKOUT_URLS = {
  pro: {
    default: process.env.EXPO_PUBLIC_PAYSTACK_PRO_URL?.trim()
  },
  elite: {
    default: process.env.EXPO_PUBLIC_PAYSTACK_ELITE_URL?.trim()
  }
} as const;
const GENERIC_WEB_CHECKOUT_URL = process.env.EXPO_PUBLIC_PAYSTACK_URL?.trim();
const FALLBACK_SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL?.trim() ??
  process.env.EXPO_PUBLIC_APP_URL?.trim() ??
  "https://o-phi.vercel.app";

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
  userPlan: ExerciseAccessPlan;
  subscriptionPlatform: SubscriptionPlatform;
  revenueCatAvailable: boolean;
  isTrial: boolean;
  trialDaysRemaining: number;
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

function getFallbackCheckoutUrl(tier: CheckoutTier, cadence?: BillingCadence): URL {
  const origin =
    Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : FALLBACK_SITE_URL.replace(/\/+$/, "");
  const url = new URL("/checkout", origin);
  url.searchParams.set("plan", tier);
  if (cadence) {
    url.searchParams.set("billing", cadence);
  }
  url.searchParams.set("status", "setup_required");
  return url;
}

function isFallbackCheckoutUrl(url: string) {
  return url.includes("/checkout") && url.includes("status=setup_required");
}

function assertResolvableCheckoutUrl(
  rawUrl: string | undefined,
  tier: CheckoutTier,
  cadence?: BillingCadence
): URL {
  if (!rawUrl) {
    return getFallbackCheckoutUrl(tier, cadence);
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("The configured checkout URL is invalid. It must be a full https:// URL.");
  }

  if (url.protocol !== "https:") {
    throw new Error("The configured checkout URL must use https:// for secure payment.");
  }

  if (url.hostname === "checkout.fitneo.app" || url.hostname === "fitneo.app") {
    return getFallbackCheckoutUrl(tier, cadence);
  }

  return url;
}

function getWebCheckoutUrl(tier: CheckoutTier, cadence?: BillingCadence): string {
  const configuredUrl = WEB_CHECKOUT_URLS[tier].default ?? GENERIC_WEB_CHECKOUT_URL;
  const url = assertResolvableCheckoutUrl(configuredUrl, tier, cadence);

  if (configuredUrl === GENERIC_WEB_CHECKOUT_URL) {
    url.searchParams.set("plan", tier);
  }
  if (cadence && !url.searchParams.has("billing")) {
    url.searchParams.set("billing", cadence);
  }
  return url.toString();
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
      const usingFallbackCheckout = isFallbackCheckoutUrl(checkoutUrl);

      if (typeof window !== "undefined") {
        try {
          const checkoutWindow = window.open(checkoutUrl, "_blank", "noopener,noreferrer");
          if (!checkoutWindow && window.location) {
            window.location.assign(checkoutUrl);
          }
        } catch {
          if (window.location) {
            window.location.assign(checkoutUrl);
          }
        }
      }

      return {
        platform: "web",
        requestedTier,
        checkoutUrl,
        activeTier: getLocalActiveTier(profile),
        activeEntitlements: {},
        message: usingFallbackCheckout
          ? "Opening FITNEO checkout setup. Add Paystack payment links in Vercel to activate live payments."
          : `Redirecting to secure ${requestedTier.toUpperCase()} payment checkout.`
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
    const trialDaysRemaining = isTrial && trialExpiresAt
      ? Math.max(1, Math.ceil((trialExpiresAt.getTime() - Date.now()) / 86400000))
      : 0;
    const isElite = tier === "elite";
    const isPremium = tier === "pro" || tier === "elite" || isTrial;
    const userPlan: ExerciseAccessPlan = isPremium ? "premium" : "free";
    const isFreeExpired = Boolean(profile) && tier === "free" && !isTrial;

    return {
      tier,
      userPlan,
      subscriptionPlatform: Platform.OS === "web" ? "web" : "native",
      revenueCatAvailable: Platform.OS !== "web",
      isTrial,
      trialDaysRemaining,
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
