import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useI18n } from "@/i18n";
import { useAppTheme } from "@/theme";

export default function CalendarLegend() {
  const theme = useAppTheme();
  const { t } = useI18n();
  const { phase } = theme.colors;

  const items = [
    { key: "period", style: { backgroundColor: phase.menstrual.main } },
    {
      key: "predictedPeriod",
      style: {
        backgroundColor: phase.menstrual.container,
        borderColor: phase.menstrual.main,
        borderWidth: 1.5,
        borderStyle: "dashed" as const,
      },
    },
    { key: "fertile", style: { backgroundColor: phase.fertile.container } },
    {
      key: "ovulation",
      style: { backgroundColor: phase.ovulation.container, borderColor: phase.ovulation.main, borderWidth: 1.5 },
    },
    { key: "today", style: { borderColor: theme.colors.primary, borderWidth: 2, borderRadius: 5 } },
    { key: "logged", dot: true },
  ] as const;

  return (
    <View style={styles.wrap}>
      {items.map((item) => (
        <View key={item.key} style={styles.item}>
          {"dot" in item ? (
            <View style={styles.swatchBox}>
              <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
            </View>
          ) : (
            <View style={[styles.swatch, item.style]} />
          )}
          <Text variant="labelMedium">{t(`calendar.legend.${item.key}`)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", rowGap: 10, columnGap: 6 },
  item: { flexDirection: "row", alignItems: "center", gap: 8, width: "48%" },
  swatch: { width: 18, height: 18, borderRadius: 9 },
  swatchBox: { width: 18, height: 18, alignItems: "center", justifyContent: "center" },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
