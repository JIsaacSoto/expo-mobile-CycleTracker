import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadPreferences, savePreferences } from "@/services/storage";
import {
  DEFAULT_PREFERENCES,
  type NotificationPreferences,
  type Preferences,
} from "@/types/preferences";

export interface PreferencesContextValue {
  preferences: Preferences;
  hydrated: boolean;
  updatePreferences: (patch: Partial<Preferences>) => void;
  updateNotifications: (patch: Partial<NotificationPreferences>) => void;
  resetPreferences: () => void;
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);
  const skipNextSave = useRef(true);

  useEffect(() => {
    let mounted = true;
    loadPreferences().then((loaded) => {
      if (!mounted) return;
      setPreferences(loaded);
      setHydrated(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    savePreferences(preferences);
  }, [preferences, hydrated]);

  const updatePreferences = useCallback((patch: Partial<Preferences>) => {
    setPreferences((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateNotifications = useCallback((patch: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, ...patch },
    }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  const value = useMemo(
    () => ({ preferences, hydrated, updatePreferences, updateNotifications, resetPreferences }),
    [preferences, hydrated, updatePreferences, updateNotifications, resetPreferences]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
