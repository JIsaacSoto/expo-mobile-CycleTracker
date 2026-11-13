import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useI18n } from "@/i18n";
import type { CycleLayout, Phase } from "@/types/cycle";
import { useAppTheme } from "@/theme";

const ORDER: Phase[] = ["menstrual", "follicular", "ovulation", "luteal"];

export default function PhaseLegend({ layout }: { layout: CycleLayout }) {
  const theme = useAppTheme();
  const { t } = useI18n();

  const range = (phase: Phase) => {
    const s = layout.phases.find((p) => p.phase === phase);
    if (!s) return null;
    return s.startDay === s.endDay
      ? t("phaseInfo.dayOnly", { day: s.startDay })
      : t("phaseInfo.days", { start: s.startDay, end: s.endDay });
  };

  return (
    <View style={styles.wrap} accessibilityLabel={t("cycle.legend")}>
      {ORDER.map((phase) => {
        const days = range(phase);
        if (!days) return null;
        return (
          <View key={phase} style={styles.item}>
            <View style={[styles.swatch, { backgroundColor: theme.colors.phase[phase].main }]} />
            <View>
              <Text variant="labelMedium">{t(`phases.${phase}`)}</Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {days}
              </Text>
            </View>
          </View>
        );
      })}
      <View style={styles.item}>
        <View style={[styles.line, { backgroundColor: theme.colors.phase.fertile.main }]} />
        <View>
          <Text variant="labelMedium">{t("phases.fertile")}</Text>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("phaseInfo.days", { start: layout.fertileStartDay, end: layout.fertileEndDay })}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", rowGap: 10, columnGap: 8 },
  item: { flexDirection: "row", alignItems: "center", gap: 8, width: "48%" },
  swatch: { width: 14, height: 14, borderRadius: 7 },
  line: { width: 14, height: 5, borderRadius: 3 },
});
