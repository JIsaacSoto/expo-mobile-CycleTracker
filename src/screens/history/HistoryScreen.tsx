import { useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Button as PaperButton, Dialog, FAB, Icon, IconButton, Portal, Snackbar, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import PeriodDialog from "@/components/cycle/PeriodDialog";
import { useCycle } from "@/hooks/useCycle";
import { capitalize, useI18n } from "@/i18n";
import { getIntervals, recordedPeriodLength, sortPeriods } from "@/lib/cycle";
import type { PeriodEntry } from "@/types/cycle";
import { useAppTheme } from "@/theme";

export default function HistoryScreen() {
  const theme = useAppTheme();
  const { t, formatDate } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, status, addPeriod, updatePeriod, removePeriod } = useCycle();
  const [editing, setEditing] = useState<PeriodEntry | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<PeriodEntry | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const rows = useMemo(() => {
    const intervals = new Map(getIntervals(data).map((i) => [i.start, i]));
    return sortPeriods(data.periods)
      .reverse()
      .map((entry) => ({
        entry,
        interval: intervals.get(entry.startDate) ?? null,
        bleeding: recordedPeriodLength(entry, data.logs),
      }));
  }, [data]);

  const latest = rows[0]?.entry.startDate;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} accessibilityLabel={t("common.back")} />
        <Text variant="titleLarge" style={{ flex: 1 }} accessibilityRole="header">
          {t("history.title")}
        </Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(row) => row.entry.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 96 }]}
        renderItem={({ item }) => {
          const { entry, interval, bleeding } = item;
          const isCurrent = entry.startDate === latest && status?.current.start === entry.startDate;
          const excluded = interval && !interval.valid;
          return (
            <View style={[styles.row, { backgroundColor: theme.colors.elevation.level1 }]}>
              <View style={[styles.dot, { backgroundColor: theme.colors.phase.menstrual.main }]}>
                <Icon source="water" size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="titleMedium">{capitalize(formatDate(entry.startDate, "full"))}</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {interval
                    ? t("history.cycleOf", { days: interval.length })
                    : isCurrent && status
                      ? t("history.current", { day: status.cycleDay })
                      : "—"}
                  {"  ·  "}
                  {bleeding
                    ? t("history.bleeding", { days: t("common.days", { count: bleeding }) })
                    : t("history.bleedingEstimated", {
                        days: t("common.days", { count: status?.stats.periodLength ?? data.settings.periodLength }),
                      })}
                </Text>
                {excluded ? (
                  <Text variant="bodySmall" style={{ color: theme.colors.warning }}>
                    {interval.reason === "automatic" ? t("history.excludedAuto") : t("history.excludedRange")}
                  </Text>
                ) : null}
              </View>
              <IconButton
                icon="pencil-outline"
                onPress={() => setEditing(entry)}
                accessibilityLabel={t("common.edit")}
              />
            </View>
          );
        }}
      />

      <FAB
        icon="plus"
        label={t("history.add")}
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => setAdding(true)}
      />

      <PeriodDialog
        visible={adding}
        onDismiss={() => setAdding(false)}
        onSubmit={(date, length) => {
          addPeriod(date, length);
          setAdding(false);
        }}
      />
      <PeriodDialog
        visible={!!editing}
        entry={editing}
        onDismiss={() => setEditing(null)}
        onSubmit={(date, length) => {
          if (editing) updatePeriod(editing.id, { startDate: date, length });
          setEditing(null);
        }}
        onDelete={() => {
          if (data.periods.length <= 1) {
            setSnack(t("history.cannotDeleteLast"));
            setEditing(null);
            return;
          }
          setDeleting(editing);
          setEditing(null);
        }}
      />
      <Portal>
        <Dialog visible={!!deleting} onDismiss={() => setDeleting(null)}>
          <Dialog.Title>{t("history.deleteTitle")}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {deleting ? capitalize(formatDate(deleting.startDate, "full")) : ""}. {t("history.deleteBody")}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setDeleting(null)}>{t("common.cancel")}</PaperButton>
            <PaperButton
              textColor={theme.colors.error}
              onPress={() => {
                if (deleting) removePeriod(deleting.id);
                setDeleting(null);
              }}
            >
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingRight: 16 },
  list: { paddingHorizontal: 16, gap: 10, paddingTop: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 18, paddingLeft: 14, paddingVertical: 12 },
  dot: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  fab: { position: "absolute", right: 16 },
});
