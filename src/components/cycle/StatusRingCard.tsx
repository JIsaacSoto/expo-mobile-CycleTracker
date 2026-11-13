import { StyleSheet, View, useWindowDimensions } from "react-native";
import { Chip, Text } from "react-native-paper";
import CycleRing from "./CycleRing";
import PhaseLegend from "./PhaseLegend";
import Button from "@/components/ui/Button";
import SectionCard from "@/components/ui/SectionCard";
import { useI18n } from "@/i18n";
import type { CycleStatus } from "@/types/cycle";
import { useAppTheme } from "@/theme";

interface Props {
  status: CycleStatus;
  hasTodayLog: boolean;
  onLogPeriod: () => void;
  onLogToday: () => void;
}

/** Main card: ring, cycle day, phase, next period and quick actions. */
export default function StatusRingCard({ status, hasTodayLog, onLogPeriod, onLogToday }: Props) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const size = Math.min(width - 64, 320);
  const { current, cycleDay, state } = status;
  const layout = current.layout;
  const late = state === "late";
  const phaseColor = late ? theme.colors.warning : theme.colors.phase[status.phase].main;

  let headline: string;
  if (late) {
    headline =
      status.lateDays === 0
        ? t("cycle.periodExpectedToday")
        : t("cycle.late", { count: status.lateDays });
  } else if (status.isPeriodDay) {
    headline = t("cycle.periodDay", { day: cycleDay, length: current.periodLength });
  } else if (status.daysUntilNextPeriod <= 0) {
    headline = t("cycle.periodExpectedToday");
  } else {
    headline = t("cycle.periodIn", { count: status.daysUntilNextPeriod });
  }

  let detail: string | null = null;
  if (!late) {
    const toOvulation = layout.ovulationDay - cycleDay;
    if (toOvulation > 0) detail = t("cycle.ovulationIn", { count: toOvulation });
    else if (toOvulation === 0) detail = t("cycle.ovulationToday");
    else if (status.isFertileDay) detail = t("cycle.fertileNow");
  }

  const phaseName = late ? t("phases.late") : t(`phases.${status.phase}`);

  return (
    <SectionCard>
      <View style={styles.ringWrap}>
        <CycleRing
          layout={layout}
          cycleDay={cycleDay}
          size={size}
          accessibilityLabel={`${t("cycle.day", { day: cycleDay })} ${t("cycle.ofLength", {
            length: layout.cycleLength,
          })}. ${phaseName}. ${headline}`}
        >
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("cycle.dayLabel")}
          </Text>
          <Text
            variant="displayMedium"
            style={[styles.dayNumber, { color: theme.colors.onSurface }]}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {cycleDay}
          </Text>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            {late
              ? t("cycle.expectedLength", { length: layout.cycleLength })
              : t("cycle.ofLength", { length: layout.cycleLength })}
          </Text>
          <View style={[styles.phasePill, { backgroundColor: late ? theme.colors.warningContainer : theme.colors.phase[status.phase].container }]}>
            <View style={[styles.phaseDot, { backgroundColor: phaseColor }]} />
            <Text variant="labelLarge" numberOfLines={1} style={{ color: theme.colors.onSurface }}>
              {phaseName}
            </Text>
          </View>
        </CycleRing>
      </View>

      <View style={styles.headlineWrap}>
        <Text variant="titleLarge" style={[styles.headline, { color: late ? theme.colors.warning : theme.colors.onSurface }]}>
          {headline}
        </Text>
        {detail ? (
          <Text variant="bodyLarge" style={[styles.detail, { color: theme.colors.onSurfaceVariant }]}>
            {detail}
          </Text>
        ) : null}
        {!current.confirmed && !late ? (
          <Chip compact icon="auto-fix" style={styles.estimated} textStyle={{ fontSize: 12 }}>
            {t("cycle.estimated")}
          </Chip>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button text={t("cycle.logPeriod")} icon="water-plus-outline" onPress={onLogPeriod} style={styles.action} compact />
        <Button
          text={hasTodayLog ? t("cycle.editToday") : t("cycle.logToday")}
          icon="notebook-edit-outline"
          mode="contained-tonal"
          onPress={onLogToday}
          style={styles.action}
          compact
        />
      </View>

      <View style={[styles.legend, { borderTopColor: theme.colors.outlineVariant }]}>
        <PhaseLegend layout={layout} />
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  ringWrap: { alignItems: "center", paddingTop: 4 },
  dayNumber: { fontWeight: "700", lineHeight: 52 },
  phasePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
    maxWidth: "100%",
  },
  phaseDot: { width: 8, height: 8, borderRadius: 4 },
  headlineWrap: { alignItems: "center", gap: 4 },
  headline: { fontWeight: "700", textAlign: "center" },
  detail: { textAlign: "center" },
  estimated: { marginTop: 4 },
  actions: { flexDirection: "row", gap: 10, marginTop: 6 },
  action: { flex: 1 },
  legend: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, marginTop: 4 },
});
