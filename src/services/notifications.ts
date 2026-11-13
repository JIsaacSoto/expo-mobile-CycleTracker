import { Linking, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { NotificationSpec } from "@/lib/notificationPlan";
import { BRAND } from "@/theme";

export const CHANNEL_ID = "cycle-alerts";

export type PermissionState = "granted" | "denied" | "undetermined" | "unsupported";

export function notificationsSupported(): boolean {
  return Platform.OS === "android" || Platform.OS === "ios";
}

let handlerConfigured = false;

/** Shows alerts while the app is open too. */
export function configureNotificationHandler(): void {
  if (handlerConfigured || !notificationsSupported()) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureChannel(channelName: string): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: channelName,
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: BRAND,
  });
}

export async function getPermissionState(): Promise<PermissionState> {
  if (!notificationsSupported()) return "unsupported";
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return "granted";
    return settings.canAskAgain ? "undetermined" : "denied";
  } catch {
    return "unsupported";
  }
}

/** Asks for permission (Android 13+ shows the system dialog). */
export async function requestPermission(channelName: string): Promise<PermissionState> {
  if (!notificationsSupported()) return "unsupported";
  try {
    await ensureChannel(channelName);
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return "granted";
    if (!current.canAskAgain) return "denied";
    const result = await Notifications.requestPermissionsAsync();
    return result.granted ? "granted" : result.canAskAgain ? "undetermined" : "denied";
  } catch {
    return "unsupported";
  }
}

export function openSystemSettings(): void {
  Linking.openSettings().catch(() => undefined);
}

/** Replaces every scheduled CycleTracker notification with the given plan. */
export async function replaceScheduled(plan: NotificationSpec[], channelName: string): Promise<void> {
  if (!notificationsSupported()) return;
  await ensureChannel(channelName);
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const spec of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: spec.id,
      content: {
        title: spec.title,
        body: spec.body,
        data: { type: spec.type, url: "/dashboard/cycle" },
        color: BRAND,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: spec.date,
        channelId: CHANNEL_ID,
      },
    });
  }
}

export async function cancelAllScheduled(): Promise<void> {
  if (!notificationsSupported()) return;
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
}

export async function sendTestNotification(title: string, body: string, channelName: string) {
  if (!notificationsSupported()) return;
  await ensureChannel(channelName);
  await Notifications.scheduleNotificationAsync({
    content: { title, body, color: BRAND },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      channelId: CHANNEL_ID,
    },
  });
}

/** Calls `onOpen(url)` when the user taps a notification. Returns an unsubscribe function. */
export function addNotificationOpenListener(onOpen: (url: string) => void): () => void {
  if (!notificationsSupported()) return () => undefined;
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const url = response.notification.request.content.data?.url;
    if (typeof url === "string") onOpen(url);
  });
  return () => subscription.remove();
}
