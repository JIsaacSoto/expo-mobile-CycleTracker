import { useColorScheme } from "react-native";
import { Banner } from "react-native-paper";
import { usePreferences } from "@/hooks/usePreferences";
import { useI18n } from "@/i18n";

/**
 * The app starts in light mode. When the phone uses dark mode, offer once
 * (inside the app) to follow the system theme.
 */
export default function SystemThemeBanner() {
  const scheme = useColorScheme();
  const { preferences, updatePreferences } = usePreferences();
  const { t } = useI18n();

  const visible =
    scheme === "dark" &&
    preferences.theme === "light" &&
    !preferences.systemThemePromptDismissed;

  return (
    <Banner
      visible={visible}
      icon="theme-light-dark"
      actions={[
        {
          label: t("theme.keepLight"),
          onPress: () => updatePreferences({ systemThemePromptDismissed: true }),
        },
        {
          label: t("theme.followSystem"),
          onPress: () =>
            updatePreferences({ theme: "system", systemThemePromptDismissed: true }),
        },
      ]}
    >
      {t("theme.systemPrompt")}
    </Banner>
  );
}
