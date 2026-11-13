import { useState } from "react";
import { IconButton, Menu } from "react-native-paper";
import { usePreferences } from "@/hooks/usePreferences";
import { useI18n } from "@/i18n";
import type { ThemePreference } from "@/types/preferences";
import { useAppTheme } from "@/theme";

const ICONS: Record<ThemePreference, string> = {
  light: "white-balance-sunny",
  dark: "weather-night",
  system: "theme-light-dark",
};

/** Visible switch between light, dark and system themes. */
export default function ThemeToggle() {
  const [open, setOpen] = useState(false);
  const { preferences, updatePreferences } = usePreferences();
  const { t } = useI18n();
  const theme = useAppTheme();

  const choose = (value: ThemePreference) => {
    updatePreferences({ theme: value, systemThemePromptDismissed: true });
    setOpen(false);
  };

  return (
    <Menu
      visible={open}
      onDismiss={() => setOpen(false)}
      anchorPosition="bottom"
      anchor={
        <IconButton
          icon={ICONS[preferences.theme]}
          mode="contained-tonal"
          onPress={() => setOpen(true)}
          accessibilityLabel={t("theme.title")}
        />
      }
    >
      {(["light", "dark", "system"] as const).map((option) => (
        <Menu.Item
          key={option}
          leadingIcon={ICONS[option]}
          title={t(`theme.${option}`)}
          onPress={() => choose(option)}
          trailingIcon={preferences.theme === option ? "check" : undefined}
          titleStyle={
            preferences.theme === option ? { color: theme.colors.primary } : undefined
          }
        />
      ))}
    </Menu>
  );
}
