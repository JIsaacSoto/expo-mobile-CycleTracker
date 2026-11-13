import { StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import SectionCard from "@/components/ui/SectionCard";
import { useI18n } from "@/i18n";
import type { CycleStats } from "@/types/cycle";
import { useAppTheme } from "@/theme";

export default function StatsCard({ stats }: { stats: CycleStats }) {
  const theme = useAppTheme();
  const { t } = useI18n();

  const tiles = [
    { label: t("stats.avgCycle"), value: stats.cycleLength, color: theme.colors.primary },
    { label: t("stats.avgPeriod"), value: stats.periodLength, color: theme.colors.phase.menstrual.main },
    { label: t("stats.luteal"), value: stats.lutealLength, color: theme.colors.phase.luteal.main },
  ];

  const regularity =
    stats.isRegular === null
      ? { icon: "information-outline", color: theme.colors.onSurfaceVariant, text: t("stats.regularityPending") }
      : stats.isRegular
        ? { icon: "check-circle-outline", color: theme.colors.success, text: t("stats.regular") }
        : {
            icon: "alert-outline",
            color: theme.colors.warning,
            text: t("stats.irregular", { days: stats.variation ?? 0 }),
          };

  return (
    <SectionCard title={t("stats.title")} icon="chart-donut" iconColor={theme.colors.primary}>
      <View style={styles.tiles}>
        {tiles.map((tile) => (
          <View key={tile.label} style={[styles.tile, { backgroundColor: theme.colors.surface }]}>
            <Text variant="headlineSmall" style={{ color: tile.color, fontWeight: "700" }}>
              {tile.value}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t("common.daysUnit", { count: tile.value })}
            </Text>
            <Text variant="labelMedium" numberOfLines={1}>
              {tile.label}
            </Text>
          </View>
        ))}
      </View>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {stats.cycleLengthSource === "history"
          ? t("stats.basedOn", { count: stats.cycleLengths.length })
          : t("stats.declared")}
      </Text>
      <View style={styles.regularity}>
        <Icon source={regularity.icon} size={18} color={regularity.color} />
        <Text variant="bodyMedium" style={{ flex: 1, color: regularity.color }}>
          {regularity.text}
        </Text>
      </View>
      {stats.isRegular === false ? (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {t("stats.irregularHint")}
        </Text>
      ) : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: "row", gap: 8 },
  tile: { flex: 1, borderRadius: 14, alignItems: "center", paddingVertical: 10, paddingHorizontal: 4 },
  regularity: { flexDirection: "row", alignItems: "center", gap: 8 },
});
