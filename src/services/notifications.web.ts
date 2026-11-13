/**
 * Web build: local notifications are not available. Same API as
 * notifications.ts, without importing expo-notifications.
 */
import type { NotificationSpec } from "@/lib/notificationPlan";

export const CHANNEL_ID = "cycle-alerts";

export type PermissionState = "granted" | "denied" | "undetermined" | "unsupported";

export const notificationsSupported = (): boolean => false;
export const configureNotificationHandler = (): void => undefined;
export const ensureChannel = async (_channelName: string): Promise<void> => undefined;
export const getPermissionState = async (): Promise<PermissionState> => "unsupported";
export const requestPermission = async (_channelName: string): Promise<PermissionState> => "unsupported";
export const openSystemSettings = (): void => undefined;
export const replaceScheduled = async (_plan: NotificationSpec[], _channelName: string): Promise<void> =>
  undefined;
export const cancelAllScheduled = async (): Promise<void> => undefined;
export const sendTestNotification = async (_title: string, _body: string, _channelName: string) =>
  undefined;
export const addNotificationOpenListener = (_onOpen: (url: string) => void): (() => void) => () =>
  undefined;
