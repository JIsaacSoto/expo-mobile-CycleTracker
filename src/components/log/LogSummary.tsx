import { StyleSheet, View } from "react-native";
import { Chip, Text } from "react-native-paper";
import { usePreferences } from "@/hooks/usePreferences";
import { useI18n } from "@/i18n";
import type { DailyLog } from "@/types/log";
import { useAppTheme } from "@/theme";
import { formatTemperature } from "./temperature";

/** Compact chips with everything logged on a day. */
export default function LogSummary({ log }: { log: DailyLog }) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const { preferences } = usePreferences();

  const chips: { key: string; icon: string; label: string; color?: string }[] = [];
  if (log.flow) {
    chips.push({
      key: "flow",
      icon: "water",
      label: `${t("log.flow")}: ${t(`log.flowLevels.${log.flow}`)}`,
      color: theme.colors.phase.menstrual.container,
    });
  }
  log.symptoms?.forEach((s) => chips.push({ key: `s-${s}`, icon: "emoticon-sick-outline", label: t(`log.symptomList.${s}`) }));
  log.moods?.forEach((m) => chips.push({ key: `m-${m}`, icon: "emoticon-outline", label: t(`log.moodList.${m}`) }));
  if (typeof log.bbt === "number") {
    chips.push({
      key: "bbt",
      icon: "thermometer",
      label: formatTemperature(log.bbt, preferences.temperatureUnit),
      color: theme.colors.phase.luteal.container,
    });
  }
  if (log.mucus) {
    chips.push({ key: "mucus", icon: "water-opacity", label: t(`log.mucusTypes.${log.mucus}`), color: theme.colors.phase.fertile.container });
  }
  if (log.lhTest) {
    chips.push({
      key: "lh",
      icon: "test-tube",
      label: `LH: ${t(`log.lhResults.${log.lhTest}`)}`,
      color: log.lhTest === "positive" ? theme.colors.phase.ovulation.container : undefined,
    });
  }
  if (log.sex) chips.push({ key: "sex", icon: "heart-outline", label: t(`log.sexTypes.${log.sex}`) });
  log.medications?.forEach((m) => chips.push({ key: `med-${m}`, icon: "pill", label: t(`log.medicationList.${m}`) }));

  return (
    <View style={{ gap: 8 }}>
      {chips.length ? (
        <View style={styles.chips}>
          {chips.map((c) => (
            <Chip key={c.key} icon={c.icon} compact style={c.color ? { backgroundColor: c.color } : undefined}>
              {c.label}
            </Chip>
          ))}
        </View>
      ) : null}
      {log.note?.trim() ? (
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, fontStyle: "italic" }} numberOfLines={3}>
          “{log.note.trim()}”
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
});
