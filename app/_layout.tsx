import "react-native-gesture-handler";
import "@/lib/i18n";
import { router, Stack, useSegments } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { colors } from "@/lib/theme";
import { AppOpenAdGate } from "@/components/AppOpenAdGate";
import { WebViewportGuard } from "@/components/WebViewportGuard";
import { useSubscription } from "@/context/SubscriptionContext";
import { subscribeToNotificationNavigation } from "@/lib/notifications";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <WebViewportGuard />
      <LanguageProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const segments = useSegments();
  const { isLoading, needsLegalAcceptance, needsOnboarding, session } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    const firstSegment = segments[0];
    const inAuth = firstSegment === "auth";
    const inCheckout = firstSegment === "checkout";
    const inLegalConsent = firstSegment === "legal-consent";
    const inOnboarding = firstSegment === "onboarding";
    if (!session && !inAuth && !inCheckout) {
      router.replace("/auth/sign-in");
      return;
    }
    if (session && needsLegalAcceptance && !inLegalConsent) {
      router.replace("/legal-consent");
      return;
    }
    if (session && needsOnboarding && !inOnboarding && !inLegalConsent) {
      router.replace("/onboarding");
    }
  }, [isLoading, needsLegalAcceptance, needsOnboarding, segments, session]);

  useEffect(() => {
    return subscribeToNotificationNavigation((route) => {
      if (session) router.push(route as never);
    });
  }, [session]);

  return (
    <SubscriptionProvider>
      <StatusBar style="light" />
      <TierAwareAppOpenAd />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="auth/sign-up" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="legal-consent" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="paywall" options={{ title: "Upgrade" }} />
        <Stack.Screen name="checkout" options={{ headerShown: false }} />
        <Stack.Screen name="scanner" options={{ title: "AI Plate Scanner" }} />
        <Stack.Screen name="barcode-scanner" options={{ title: "Barcode Scanner" }} />
        <Stack.Screen name="custom-workout" options={{ headerShown: false }} />
        <Stack.Screen name="workout-preview" options={{ headerShown: false }} />
        <Stack.Screen name="active-workout" options={{ headerShown: false }} />
        <Stack.Screen name="sports-mode" options={{ title: "Sports Mode" }} />
        <Stack.Screen name="badges" options={{ title: "Badges" }} />
        <Stack.Screen name="chat-history" options={{ title: "Chat History" }} />
        <Stack.Screen name="subscription-test" options={{ title: "Subscription Testing" }} />
        <Stack.Screen name="legal/privacy" options={{ title: "Privacy Policy" }} />
        <Stack.Screen name="legal/terms" options={{ title: "Terms of Service" }} />
        <Stack.Screen name="legal/refund" options={{ title: "Refund Policy" }} />
        <Stack.Screen name="legal/imprint" options={{ title: "Imprint" }} />
        <Stack.Screen name="legal/support" options={{ title: "Support" }} />
      </Stack>
    </SubscriptionProvider>
  );
}

function TierAwareAppOpenAd() {
  const { isLoading, isPremium } = useSubscription();
  if (isLoading || isPremium) return null;
  return <AppOpenAdGate />;
}
