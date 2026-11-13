import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  Button as PaperButton,
  Dialog,
  Divider,
  HelperText,
  List,
  Portal,
  SegmentedButtons,
  Snackbar,
  Switch,
  Text,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import Constants from "expo-constants";
import Button from "@/components/ui/Button";
import NumberStepper from "@/components/ui/NumberStepper";
import ScreenHeader from "@/components/ui/ScreenHeader";
import SectionCard from "@/components/ui/SectionCard";
import ThemeToggle from "@/components/ui/ThemeToggle";
import CycleSettingsForm, { type CycleFormValues } from "@/components/forms/CycleSettingsForm";
import AlertSettings from "@/components/forms/AlertSettings";
import { useCycle } from "@/hooks/useCycle";
import { usePreferences } from "@/hooks/usePreferences";
import { useI18n } from "@/i18n";
import { validateSettings } from "@/lib/cycle";
import {
  cancelAllScheduled,
  getPermissionState,
  notificationsSupported,
  openSystemSettings,
  requestPermission,
  sendTestNotification,
  type PermissionState,
} from "@/services/notifications";
import type { LanguagePreference, TemperatureUnit, ThemePreference } from "@/types/preferences";
import { useAppTheme } from "@/theme";
import { styles } from "./ConfigScreen.styles";

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export default function ConfigScreen() {
  const theme = useAppTheme();
  const { t, tList } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, status, updateSettings, resetAll } = useCycle();
  const { preferences, updatePreferences, updateNotifications, resetPreferences } = usePreferences();
  const notif = preferences.notifications;

  const [values, setValues] = useState<CycleFormValues>({
    cycleLength: data.settings.cycleLength,
    periodLength: data.settings.periodLength,
    lutealLength: data.settings.lutealLength,
  });
  const [snack, setSnack] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [permission, setPermission] = useState<PermissionState>("undetermined");

  useEffect(() => {
    setValues({
      cycleLength: data.settings.cycleLength,
      periodLength: data.settings.periodLength,
      lutealLength: data.settings.lutealLength,
    });
  }, [data.settings.cycleLength, data.settings.periodLength, data.settings.lutealLength]);

  useFocusEffect(
    useCallback(() => {
      getPermissionState().then(setPermission);
    }, [])
  );

  const dirty =
    values.cycleLength !== data.settings.cycleLength ||
    values.periodLength !== data.settings.periodLength ||
    values.lutealLength !== data.settings.lutealLength;
  const valid = validateSettings(values).errors.length === 0;

  const saveCycle = () => {
    updateSettings(values);
    setSnack(t("settings.saved"));
  };

  const toggleNotifications = async (enabled: boolean) => {
    if (!enabled) {
      updateNotifications({ enabled: false });
      await cancelAllScheduled();
      return;
    }
    const state = await requestPermission(t("notifications.channelName"));
    setPermission(state);
    if (state === "granted") updateNotifications({ enabled: true });
  };

  const doReset = async () => {
    setConfirmReset(false);
    await cancelAllScheduled();
    await resetAll();
    resetPreferences();
    router.replace("/onboarding");
  };

  const stats = status?.stats;
  const measuredLuteal = stats?.measuredLutealLength;
  const supported = notificationsSupported();
  const timeSlot = notif.hour * 2 + (notif.minute >= 30 ? 1 : 0);
  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}>
        <ScreenHeader title={t("settings.title")} right={<ThemeToggle />} />

        {/* Cycle */}
        <SectionCard title={t("settings.cycleSection")} icon="circle-slice-6" iconColor={theme.colors.primary}>
          {stats ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t("settings.inUse", {
                cycle: stats.cycleLength,
                period: stats.periodLength,
                luteal: stats.lutealLength,
              })}
            </Text>
          ) : null}
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall">{t("settings.useHistory")}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t("settings.useHistoryHelp")}
              </Text>
            </View>
            <Switch
              value={data.settings.useHistoryAverage}
              onValueChange={(useHistoryAverage) => updateSettings({ useHistoryAverage })}
              accessibilityLabel={t("settings.useHistory")}
            />
          </View>
          <CycleSettingsForm values={values} onChange={setValues} />
          {measuredLuteal && measuredLuteal !== values.lutealLength ? (
            <View style={[styles.suggestion, { backgroundColor: theme.colors.secondaryContainer }]}>
              <Text variant="bodyMedium" style={{ flex: 1, color: theme.colors.onSecondaryContainer }}>
                {t("settings.measuredLuteal", { days: measuredLuteal })}
              </Text>
              <PaperButton
                compact
                onPress={() =>
                  setValues((v) => ({ ...v, lutealLength: Math.min(16, Math.max(10, measuredLuteal)) }))
                }
              >
                {t("common.use")}
              </PaperButton>
            </View>
          ) : null}
          <Button text={t("settings.saveChanges")} disabled={!dirty || !valid} onPress={saveCycle} />
        </SectionCard>

        {/* History */}
        <SectionCard>
          <List.Item
            title={t("settings.historySection")}
            description={t("settings.historyDescription", { count: data.periods.length })}
            left={(props) => <List.Icon {...props} icon="history" color={theme.colors.primary} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push("/history")}
            style={styles.listItem}
          />
        </SectionCard>

        {/* Notifications */}
        <SectionCard title={t("settings.notificationsSection")} icon="bell-outline" iconColor={theme.colors.primary}>
          {supported ? (
            <>
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleSmall">{t("notifications.master")}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {t("notifications.masterHelp")}
                  </Text>
                </View>
                <Switch
                  value={notif.enabled && permission === "granted"}
                  onValueChange={toggleNotifications}
                  accessibilityLabel={t("notifications.master")}
                />
              </View>
              {permission === "denied" ? (
                <View style={styles.permissionRow}>
                  <HelperText type="error" style={{ flex: 1 }}>
                    {t("notifications.permissionDenied")}
                  </HelperText>
                  <PaperButton compact onPress={openSystemSettings}>
                    {t("notifications.openSettings")}
                  </PaperButton>
                </View>
              ) : null}
              <Divider />
              <NumberStepper
                dense
                label={t("notifications.time")}
                value={timeSlot}
                min={0}
                max={47}
                format={(slot) => formatTime(Math.floor(slot / 2), slot % 2 ? 30 : 0)}
                onChange={(slot) => updateNotifications({ hour: Math.floor(slot / 2), minute: slot % 2 ? 30 : 0 })}
              />
              <AlertSettings disabled={!notif.enabled || permission !== "granted"} />
              {notif.enabled && permission === "granted" ? (
                <Button
                  mode="outlined"
                  icon="bell-ring-outline"
                  text={t("notifications.test")}
                  onPress={() =>
                    sendTestNotification(
                      t("notifications.testTitle"),
                      t("notifications.testBody"),
                      t("notifications.channelName")
                    )
                  }
                />
              ) : null}
            </>
          ) : (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t("notifications.unsupported")}
            </Text>
          )}
        </SectionCard>

        {/* Appearance */}
        <SectionCard title={t("settings.appearanceSection")} icon="palette-outline" iconColor={theme.colors.primary}>
          <Text variant="titleSmall">{t("theme.title")}</Text>
          <SegmentedButtons
            value={preferences.theme}
            onValueChange={(value) =>
              updatePreferences({ theme: value as ThemePreference, systemThemePromptDismissed: true })
            }
            buttons={[
              { value: "light", label: t("theme.light") },
              { value: "dark", label: t("theme.dark") },
              { value: "system", label: t("theme.system") },
            ]}
          />
          <Text variant="titleSmall" style={styles.fieldLabel}>
            {t("language.title")}
          </Text>
          <SegmentedButtons
            value={preferences.language}
            onValueChange={(value) => updatePreferences({ language: value as LanguagePreference })}
            buttons={[
              { value: "system", label: t("language.system") },
              { value: "es", label: t("language.es") },
              { value: "en", label: t("language.en") },
            ]}
          />
          <Text variant="titleSmall" style={styles.fieldLabel}>
            {t("settings.temperatureUnit")}
          </Text>
          <SegmentedButtons
            value={preferences.temperatureUnit}
            onValueChange={(value) => updatePreferences({ temperatureUnit: value as TemperatureUnit })}
            buttons={[
              { value: "C", label: "°C" },
              { value: "F", label: "°F" },
            ]}
          />
        </SectionCard>

        {/* Data */}
        <SectionCard title={t("settings.dataSection")} icon="shield-lock-outline" iconColor={theme.colors.primary}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("settings.privacy")}
          </Text>
          <Button
            mode="outlined"
            icon="delete-outline"
            text={t("settings.reset")}
            textColor={theme.colors.error}
            onPress={() => setConfirmReset(true)}
          />
        </SectionCard>

        {/* About */}
        <SectionCard title={t("settings.aboutSection")} icon="information-outline" iconColor={theme.colors.primary}>
          <Text variant="bodyMedium">{t("settings.version", { version })}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("disclaimer.full")}
          </Text>
          <Text variant="titleSmall" style={styles.fieldLabel}>
            {t("settings.sources")}
          </Text>
          {tList("settings.sourceList").map((source) => (
            <Text key={source} variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              • {source}
            </Text>
          ))}
        </SectionCard>
      </ScrollView>

      <Portal>
        <Dialog visible={confirmReset} onDismiss={() => setConfirmReset(false)}>
          <Dialog.Icon icon="alert-outline" />
          <Dialog.Title style={{ textAlign: "center" }}>{t("settings.resetTitle")}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t("settings.resetBody")}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setConfirmReset(false)}>{t("common.cancel")}</PaperButton>
            <PaperButton textColor={theme.colors.error} onPress={doReset}>
              {t("common.delete")}
            </PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={2500}>
        {snack ?? ""}
      </Snackbar>
    </View>
  );
}
