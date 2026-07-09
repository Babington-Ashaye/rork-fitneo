import { Redirect } from "expo-router";
import { PageGradient, LoadingState, ErrorState } from "@/components/ScreenKit";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { error, isLoading, needsLegalAcceptance, needsOnboarding, session, refreshProfile } = useAuth();

  if (isLoading) {
    return (
      <PageGradient>
        <LoadingState label="Restoring your FITNEO session..." />
      </PageGradient>
    );
  }

  if (error) {
    return (
      <PageGradient>
        <ErrorState message={error} onRetry={refreshProfile} />
      </PageGradient>
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
