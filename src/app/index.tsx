import { Redirect } from "expo-router";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useCycle } from "@/hooks/useCycle";
import { usePreferences } from "@/hooks/usePreferences";

/** Entry point: waits for stored data, then shows onboarding (first launch) or the dashboard. */
export default function EntryRoute() {
  const { preferences, hydrated: preferencesReady } = usePreferences();
  const { status, hydrated: cycleReady } = useCycle();

  if (!preferencesReady || !cycleReady) return <LoadingScreen />;

  if (!preferences.onboardingCompleted || !status) {
    return <Redirect href="/onboarding" />;
  }
  return <Redirect href="/dashboard/cycle" />;
}
