import { useEffect, useMemo } from "react";
import { Platform, useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider, adaptNavigationTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CycleProvider } from "@/contexts/CycleContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { usePreferences } from "@/hooks/usePreferences";
import { I18nProvider, resolveLanguage } from "@/i18n";
import { darkTheme, lightTheme } from "@/theme";
import NotificationScheduler from "@/components/notifications/NotificationScheduler";

const { LightTheme: navLight, DarkTheme: navDark } = adaptNavigationTheme({
  reactNavigationLight: DefaultTheme,
  reactNavigationDark: DarkTheme,
  materialLight: lightTheme,
  materialDark: darkTheme,
});

function AppShell() {
  const { preferences } = usePreferences();
  const systemScheme = useColorScheme();
  const isDark =
    preferences.theme === "dark" || (preferences.theme === "system" && systemScheme === "dark");
  const theme = isDark ? darkTheme : lightTheme;
  const navigationTheme = useMemo(
    () => ({
      ...(isDark ? navDark : navLight),
      fonts: (isDark ? DarkTheme : DefaultTheme).fonts,
    }),
    [isDark]
  );
  const language = resolveLanguage(preferences.language);

  useEffect(() => {
    if (Platform.OS !== "web") {
      SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => undefined);
    }
  }, [theme]);

  return (
    <PaperProvider
      theme={theme}
      settings={{ icon: (props) => <MaterialCommunityIcons {...props} /> }}
    >
      <ThemeProvider value={navigationTheme}>
        <I18nProvider language={language}>
          <StatusBar style={isDark ? "light" : "dark"} />
          <NotificationScheduler />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
              contentStyle: { backgroundColor: theme.colors.background },
            }}
          >
            <Stack.Screen
              name="log/[date]"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen name="history" options={{ animation: "slide_from_right" }} />
          </Stack>
        </I18nProvider>
      </ThemeProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <CycleProvider>
          <AppShell />
        </CycleProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}
