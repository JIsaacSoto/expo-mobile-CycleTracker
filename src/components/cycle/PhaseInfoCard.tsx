import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button as PaperButton, Chip, Text } from "react-native-paper";
import SectionCard from "@/components/ui/SectionCard";
import { useI18n } from "@/i18n";
import type { CycleStatus } from "@/types/cycle";
import { useAppTheme } from "@/theme";

const ICONS = {
  menstrual: "water",
  follicular: "sprout-outline",
  ovulation: "egg-outline",
  luteal: "moon-waning-crescent",
} as const;

/** What happens in the body during the current phase (educational). */
export default function PhaseInfoCard({ status }: { status: CycleStatus }) {
  const theme = useAppTheme();
  const { t, tList } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const phase = status.phase;
  const segment = status.current.layout.phases.find((p) => p.phase === phase);
  const late = status.state === "late";
  const color = theme.colors.phase[phase].main;

  const days = segment
    ? segment.startDay === segment.endDay
      ? t("phaseInfo.dayOnly", { day: segment.startDay })
      : t("phaseInfo.days", { start: segment.startDay, end: late ? status.cycleDay : segment.endDay })
    : "";

  return (
    <SectionCard
      title={t(`phases.${phase}`)}
      icon={ICONS[phase]}
      iconColor={color}
      right={
        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {days}
        </Text>
      }
    >
      <Text variant="bodyMedium">{t(`phaseInfo.${phase}.body`)}</Text>
      <View style={[styles.hormones, { borderLeftColor: color }]}>
        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {t("phaseInfo.hormones")}
        </Text>
        <Text variant="bodyMedium">{t(`phaseInfo.${phase}.hormones`)}</Text>
      </View>

      {expanded ? (
        <>
          <Text variant="labelLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            {t("phaseInfo.youMayNotice")}
          </Text>
          <View style={styles.chips}>
            {tList(`phaseInfo.${phase}.notice`).map((item) => (
              <Chip key={item} compact style={{ backgroundColor: theme.colors.phase[phase].container }}>
                {item}
              </Chip>
            ))}
          </View>
          <Text variant="labelLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            {t("phaseInfo.tips")}
          </Text>
          {tList(`phaseInfo.${phase}.tips`).map((tip) => (
            <View key={tip} style={styles.tip}>
              <Text style={{ color }}>•</Text>
              <Text variant="bodyMedium" style={{ flex: 1 }}>
                {tip}
              </Text>
            </View>
          ))}
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            {t("phaseInfo.source")}
          </Text>
        </>
      ) : null}
      <PaperButton
        compact
        mode="text"
        icon={expanded ? "chevron-up" : "chevron-down"}
        onPress={() => setExpanded((v) => !v)}
        style={styles.toggle}
        contentStyle={{ flexDirection: "row-reverse" }}
      >
        {expanded ? t("common.close") : `${t("phaseInfo.youMayNotice")} · ${t("phaseInfo.tips")}`}
      </PaperButton>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  hormones: { borderLeftWidth: 3, paddingLeft: 10, gap: 2 },
  subtitle: { marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tip: { flexDirection: "row", gap: 8 },
  toggle: { alignSelf: "flex-start", marginLeft: -8 },
});
