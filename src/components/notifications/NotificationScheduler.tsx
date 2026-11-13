import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { useCycle } from "@/hooks/useCycle";
import { usePreferences } from "@/hooks/usePreferences";
import { useI18n } from "@/i18n";
import { buildNotificationPlan } from "@/lib/notificationPlan";
import {
  addNotificationOpenListener,
  cancelAllScheduled,
  configureNotificationHandler,
  getPermissionState,
  notificationsSupported,
  replaceScheduled,
} from "@/services/notifications";

/**
 * Keeps scheduled local notifications in sync with the cycle data and the
 * alert preferences. Every change (new period, log, settings, language)
 * rebuilds the plan; identical plans are not rescheduled.
 */
export default function NotificationScheduler() {
  const router = useRouter();
  const { status, timeline, hydrated } = useCycle();
  const { preferences, hydrated: preferencesReady } = usePreferences();
  const { t, formatDate } = useI18n();
  const lastSignature = useRef<string | null>(null);
  const supported = notificationsSupported();

  useEffect(() => {
    if (!supported) return;
    configureNotificationHandler();
    return addNotificationOpenListener((url) => router.push(url as never));
  }, [supported, router]);

  useEffect(() => {
    if (!supported || !hydrated || !preferencesReady) return;
    const timer = setTimeout(async () => {
      const prefs = preferences.notifications;
      if (!prefs.enabled || !preferences.onboardingCompleted || !status) {
        if (lastSignature.current !== "none") {
          await cancelAllScheduled();
          lastSignature.current = "none";
        }
        return;
      }
      if ((await getPermissionState()) !== "granted") return;
      const plan = buildNotificationPlan({ status, timeline, prefs, now: new Date(), t, formatDate });
      const signature = JSON.stringify(plan.map((p) => [p.id, p.date.getTime(), p.title, p.body]));
      if (signature === lastSignature.current) return;
      try {
        await replaceScheduled(plan, t("notifications.channelName"));
        lastSignature.current = signature;
      } catch (error) {
        console.warn("[notifications] Could not schedule", error);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [supported, hydrated, preferencesReady, preferences, status, timeline, t, formatDate]);

  return null;
}
