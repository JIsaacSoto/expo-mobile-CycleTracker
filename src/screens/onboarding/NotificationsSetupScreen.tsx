import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Card, HelperText, Icon, IconButton, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Button from "@/components/ui/Button";
import AlertSettings from "@/components/forms/AlertSettings";
import { usePreferences } from "@/hooks/usePreferences";
import { useI18n } from "@/i18n";
import { notificationsSupported, requestPermission } from "@/services/notifications";
import { useAppTheme } from "@/theme";

export default function NotificationsSetupScreen() {
  const theme = useAppTheme();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updatePreferences, updateNotifications } = usePreferences();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const supported = notificationsSupported();

  const finish = () => {
    updatePreferences({ onboardingCompleted: true });
    router.replace("/dashboard/cycle");
  };

  const enable = async () => {
    setBusy(true);
    const state = await requestPermission(t("notifications.channelName"));
    setBusy(false);
    if (state === "granted") {
      updateNotifications({ enabled: true });
      finish();
    } else {
      setMessage(state === "unsupported" ? t("notificationsSetup.unsupported") : t("notificationsSetup.denied"));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} accessibilityLabel={t("common.back")} />
        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {t("onboarding.stepOf", { step: 2, total: 2 })}
        </Text>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
          <Icon source="bell-ring-outline" size={56} color={theme.colors.primary} />
        </View>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          {t("notificationsSetup.title")}
        </Text>
        <Text variant="bodyLarge" style={[styles.body, { color: theme.colors.onSurfaceVariant }]}>
          {t("notificationsSetup.body")}
        </Text>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.elevation.level1 }]}>
          <Card.Content>
            <AlertSettings compact />
          </Card.Content>
        </Card>

        {message || !supported ? (
          <HelperText type="info" style={{ color: theme.colors.warning }}>
            {message ?? t("notificationsSetup.unsupported")}
          </HelperText>
        ) : null}

        <View style={styles.actions}>
          {supported && !message ? (
            <Button text={t("notificationsSetup.enable")} icon="bell-outline" onPress={enable} loading={busy} disabled={busy} />
          ) : null}
          <Button
            mode={supported && !message ? "text" : "contained"}
            text={supported && !message ? t("common.notNow") : t("common.continue")}
            onPress={finish}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingRight: 16, justifyContent: "space-between" },
  content: { paddingHorizontal: 20, alignItems: "stretch" },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  title: { fontWeight: "700", textAlign: "center", marginBottom: 8 },
  body: { textAlign: "center", marginBottom: 20 },
  card: { borderRadius: 16 },
  actions: { marginTop: 24, gap: 8 },
});
