import { Redirect } from "expo-router";
import { AppLayout } from "@/components/AppLayout";
import { LoadingState, ErrorState } from "@/components/ScreenKit";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { error, isLoading, needsLegalAcceptance, needsOnboarding, session, refreshProfile } = useAuth();

  if (isLoading) {
    return (
      <AppLayout contentContainerStyle={{ flex: 1, justifyContent: "center" }}>
        <LoadingState label="Restoring your FITNEO session..." />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout contentContainerStyle={{ flex: 1, justifyContent: "center" }}>
        <ErrorState message={error} onRetry={refreshProfile} />
      </AppLayout>
    );
  }

  if (!session) {
    return <Redirect href="/auth/sign-in" />;
  }

  if (needsLegalAcceptance) {
    return <Redirect href="/legal-consent" />;
  }

  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
