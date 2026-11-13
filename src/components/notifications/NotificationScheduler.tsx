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

  // Syncs run one after another; a run is skipped when a newer one is queued,
  // so a slow scheduling pass can never interleave with a newer plan.
  const queue = useRef<Promise<void>>(Promise.resolve());
  const generation = useRef(0);

  useEffect(() => {
    if (!supported || !hydrated || !preferencesReady) return;
    const timer = setTimeout(() => {
      const run = ++generation.current;
      queue.current = queue.current
        .then(async () => {
          if (run !== generation.current) return;
          const prefs = preferences.notifications;
          if (!prefs.enabled || !preferences.onboardingCompleted || !status) {
            if (lastSignature.current !== "none") {
              await cancelAllScheduled();
              lastSignature.current = "none";
            }
            return;
          }
          if ((await getPermissionState()) !== "granted") return;
          if (run !== generation.current) return;
          const plan = buildNotificationPlan({ status, timeline, prefs, now: new Date(), t, formatDate });
          const signature = JSON.stringify(plan.map((p) => [p.id, p.date.getTime(), p.title, p.body]));
          if (signature === lastSignature.current) return;
          lastSignature.current = null;
          await replaceScheduled(plan, t("notifications.channelName"));
          lastSignature.current = signature;
        })
        .catch((error) => console.warn("[notifications] Could not schedule", error));
    }, 800);
    return () => clearTimeout(timer);
  }, [supported, hydrated, preferencesReady, preferences, status, timeline, t, formatDate]);

  return null;
}
