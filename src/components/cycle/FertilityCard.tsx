import { StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import SectionCard from "@/components/ui/SectionCard";
import { useI18n } from "@/i18n";
import type { CycleStatus, FertilityLevel } from "@/types/cycle";
import { useAppTheme } from "@/theme";

const LEVELS: FertilityLevel[] = ["low", "medium", "high"];

export default function FertilityCard({ status }: { status: CycleStatus }) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const level = status.fertility;
  const color =
    level === "high"
      ? theme.colors.phase.ovulation.main
      : level === "medium"
        ? theme.colors.phase.fertile.main
        : level === "low"
          ? theme.colors.phase.follicular.main
          : theme.colors.warning;
  const filled = level ? LEVELS.indexOf(level) + 1 : 0;
  const source = status.current.ovulationSource;

  return (
    <SectionCard title={t("fertility.title")} icon="flower-outline" iconColor={theme.colors.phase.fertile.main}>
      <View style={styles.levelRow}>
        <Text variant="headlineSmall" style={{ color, fontWeight: "700" }}>
          {level ? t(`fertility.${level}`) : t("fertility.unknown")}
        </Text>
        <View style={styles.meter} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {LEVELS.map((l, i) => (
            <View
              key={l}
              style={[
                styles.bar,
                { height: 10 + i * 7, backgroundColor: i < filled ? color : theme.colors.surfaceVariant },
              ]}
            />
          ))}
        </View>
      </View>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {level ? t(`fertility.${level}Body`) : t("fertility.unknownBody")}
      </Text>
      {level ? (
        <View style={styles.sourceRow}>
          <Icon
            source={source === "lh" ? "test-tube" : source === "bbt" ? "thermometer" : "calendar-text-outline"}
            size={16}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
            {source === "lh"
              ? t("fertility.sourceLh")
              : source === "bbt"
                ? t("fertility.sourceBbt")
                : t("fertility.sourceEstimated")}
          </Text>
        </View>
      ) : null}
      <View style={[styles.warning, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Icon source="alert-circle-outline" size={16} color={theme.colors.onSurfaceVariant} />
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
          {t("fertility.warning")}
        </Text>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  levelRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  meter: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  bar: { width: 10, borderRadius: 3 },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  warning: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 8 },
});
