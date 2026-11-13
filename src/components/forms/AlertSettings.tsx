import { StyleSheet, View } from "react-native";
import { Divider, Icon, Switch, Text } from "react-native-paper";
import NumberStepper from "@/components/ui/NumberStepper";
import { usePreferences } from "@/hooks/usePreferences";
import { useI18n } from "@/i18n";
import { ALERT_DAY_LIMITS, type AlertType } from "@/types/preferences";
import { useAppTheme } from "@/theme";

const ALERTS: { type: AlertType; icon: string; colorKey: "menstrual" | "fertile" | "luteal" | null }[] = [
  { type: "period", icon: "water-outline", colorKey: "menstrual" },
  { type: "fertile", icon: "flower-outline", colorKey: "fertile" },
  { type: "phase", icon: "circle-slice-6", colorKey: "luteal" },
  { type: "late", icon: "calendar-alert", colorKey: null },
];

interface Props {
  /** Hide the day steppers (onboarding). */
  compact?: boolean;
  disabled?: boolean;
}

/** Per-alert switches and "days in advance / days late" settings. */
export default function AlertSettings({ compact, disabled }: Props) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const { preferences, updateNotifications } = usePreferences();
  const prefs = preferences.notifications;

  const helpFor = (type: AlertType, days: number) => {
    switch (type) {
      case "period":
        return t("notifications.types.periodHelp", { count: days });
      case "fertile":
        return days === 0
          ? t("notifications.types.fertileHelpSameDay")
          : t("notifications.types.fertileHelp", { count: days });
      case "phase":
        return days === 0
          ? t("notifications.types.phaseHelpSameDay")
          : t("notifications.types.phaseHelp", { count: days });
      case "late":
        return t("notifications.types.lateHelp", { count: days });
    }
  };

  return (
    <View>
      {ALERTS.map(({ type, icon, colorKey }, i) => {
        const setting = prefs[type];
        const color = colorKey ? theme.colors.phase[colorKey].main : theme.colors.warning;
        return (
          <View key={type}>
            {i > 0 ? <Divider /> : null}
            <View style={[styles.row, disabled && { opacity: 0.5 }]}>
              <Icon source={icon} size={24} color={color} />
              <View style={styles.texts}>
                <Text variant="titleSmall">{t(`notifications.types.${type}`)}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {helpFor(type, setting.days)}
                </Text>
              </View>
              <Switch
                value={setting.enabled}
                disabled={disabled}
                onValueChange={(enabled) => updateNotifications({ [type]: { ...setting, enabled } })}
                accessibilityLabel={t(`notifications.types.${type}`)}
              />
            </View>
            {!compact && setting.enabled && !disabled ? (
              <View style={styles.stepper}>
                <NumberStepper
                  dense
                  label={type === "late" ? t("notifications.lateDays") : t("notifications.leadDays")}
                  value={setting.days}
                  min={ALERT_DAY_LIMITS[type].min}
                  max={ALERT_DAY_LIMITS[type].max}
                  format={(n) => t("common.days", { count: n })}
                  onChange={(days) => updateNotifications({ [type]: { ...setting, days } })}
                />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12 },
  texts: { flex: 1, gap: 2 },
  stepper: { paddingBottom: 12, paddingLeft: 38 },
});
