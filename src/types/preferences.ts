export type ThemePreference = "light" | "dark" | "system";
export type LanguagePreference = "system" | "es" | "en";
export type TemperatureUnit = "C" | "F";

export interface AlertSetting {
  enabled: boolean;
  /**
   * period/fertile/phase: days in advance (0 = same day only).
   * late: days after the expected date.
   */
  days: number;
}

export type AlertType = "period" | "fertile" | "phase" | "late";

export interface NotificationPreferences {
  enabled: boolean;
  hour: number;
  minute: number;
  period: AlertSetting;
  fertile: AlertSetting;
  phase: AlertSetting;
  late: AlertSetting;
}

export interface Preferences {
  onboardingCompleted: boolean;
  disclaimerAccepted: boolean;
  theme: ThemePreference;
  /** The user answered the "follow system dark mode" prompt. */
  systemThemePromptDismissed: boolean;
  language: LanguagePreference;
  temperatureUnit: TemperatureUnit;
  notifications: NotificationPreferences;
}

export const ALERT_DAY_LIMITS: Record<AlertType, { min: number; max: number }> = {
  period: { min: 1, max: 7 },
  fertile: { min: 0, max: 3 },
  phase: { min: 0, max: 3 },
  late: { min: 1, max: 7 },
};

export const DEFAULT_PREFERENCES: Preferences = {
  onboardingCompleted: false,
  disclaimerAccepted: false,
  theme: "light",
  systemThemePromptDismissed: false,
  language: "system",
  temperatureUnit: "C",
  notifications: {
    enabled: false,
    hour: 9,
    minute: 0,
    period: { enabled: true, days: 2 },
    fertile: { enabled: true, days: 1 },
    phase: { enabled: true, days: 0 },
    late: { enabled: true, days: 2 },
  },
};
