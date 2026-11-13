import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Chip, IconButton, Snackbar, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Calendar, type DateData } from "react-native-calendars";
import ScreenHeader from "@/components/ui/ScreenHeader";
import SectionCard from "@/components/ui/SectionCard";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Button from "@/components/ui/Button";
import CalendarDay, { type DayMarking } from "@/components/calendar/CalendarDay";
import CalendarLegend from "@/components/calendar/CalendarLegend";
import { setCalendarLocale } from "@/components/calendar/calendarLocale";
import LogSummary from "@/components/log/LogSummary";
import { useCycle } from "@/hooks/useCycle";
import { capitalize, useI18n } from "@/i18n";
import { computeStats, getDayInfo, getDayInfoRange, validatePeriodStart } from "@/lib/cycle";
import { addDays, addMonthsISO, startOfMonthISO, type ISODate } from "@/lib/dates";
import { useAppTheme } from "@/theme";

export default function CalendarScreen() {
  const theme = useAppTheme();
  const { t, language, formatDate } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, today, timeline, addPeriod, removePeriod } = useCycle();

  const [month, setMonth] = useState<ISODate>(startOfMonthISO(today));
  const [selected, setSelected] = useState<ISODate>(today);
  const [calendarKey, setCalendarKey] = useState(0);
  const [snack, setSnack] = useState<string | null>(null);

  setCalendarLocale(language);

  const dayInfo = useMemo(
    () => getDayInfoRange(timeline, addDays(month, -7), addDays(addMonthsISO(month, 1), 14)),
    [timeline, month]
  );

  const markedDates = useMemo(() => {
    const marks: Record<string, DayMarking> = {};
    for (const [date, info] of Object.entries(dayInfo)) {
      marks[date] = {
        info,
        logged: !!data.logs[date],
        selected: date === selected,
        isToday: date === today,
      };
    }
    return marks;
  }, [dayInfo, data.logs, selected, today]);

  const onDayPress = useCallback(
    (date: string) => {
      setSelected(date);
      const target = startOfMonthISO(date);
      if (target !== month) {
        setMonth(target);
        setCalendarKey((k) => k + 1);
      }
    },
    [month]
  );

  const goToToday = () => {
    setMonth(startOfMonthISO(today));
    setSelected(today);
    setCalendarKey((k) => k + 1);
  };

  const info = useMemo(() => dayInfo[selected] ?? getDayInfo(timeline, selected), [dayInfo, timeline, selected]);
  const selectedLog = data.logs[selected];
  const periodEntry = data.periods.find((p) => p.startDate === selected);
  const isFuture = selected > today;
  const predicted = info?.cycle && (info.cycle.kind === "future" || !info.cycle.confirmed);

  const togglePeriodStart = () => {
    if (periodEntry) {
      if (data.periods.length <= 1) {
        setSnack(t("history.cannotDeleteLast"));
        return;
      }
      removePeriod(periodEntry.id);
      return;
    }
    const { error } = validatePeriodStart(selected, data.periods, today, computeStats(data).periodLength);
    if (error) {
      setSnack(
        error.code === "future"
          ? t("logPeriod.errors.future")
          : t("logPeriod.errors.overlap", { date: formatDate(error.other, "medium") })
      );
      return;
    }
    addPeriod(selected);
  };

  const calendarTheme = useMemo(
    () => ({
      calendarBackground: "transparent",
      backgroundColor: "transparent",
      monthTextColor: theme.colors.onSurface,
      textMonthFontWeight: "700" as const,
      textMonthFontSize: 18,
      textSectionTitleColor: theme.colors.onSurfaceVariant,
      arrowColor: theme.colors.primary,
      textDayHeaderFontWeight: "600" as const,
    }),
    [theme]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}>
        <ScreenHeader
          title={t("calendar.title")}
          right={
            <View style={styles.headerActions}>
              <IconButton
                icon="calendar-today"
                mode="contained-tonal"
                onPress={goToToday}
                accessibilityLabel={t("calendar.goToToday")}
              />
              <ThemeToggle />
            </View>
          }
        />

        <SectionCard style={styles.calendarCard}>
          <Calendar
            key={`${calendarKey}-${language}-${theme.dark ? "d" : "l"}`}
            current={month}
            firstDay={1}
            enableSwipeMonths
            onMonthChange={(d: DateData) => setMonth(startOfMonthISO(d.dateString))}
            theme={calendarTheme}
            markedDates={markedDates as never}
            dayComponent={({ date, state, marking }) =>
              date ? (
                <CalendarDay
                  dateString={date.dateString}
                  day={date.day}
                  disabled={state === "disabled"}
                  marking={marking as DayMarking | undefined}
                  onPress={onDayPress}
                  accessibilityLabel={capitalize(formatDate(date.dateString, "long"))}
                />
              ) : null
            }
          />
        </SectionCard>

        <SectionCard
          title={capitalize(formatDate(selected, "long"))}
          icon="calendar-blank-outline"
          iconColor={theme.colors.primary}
        >
          {info?.cycle ? (
            <View style={styles.chips}>
              <Chip compact icon="counter">
                {t("calendar.cycleDay", { day: info.cycleDay ?? 0 })}
              </Chip>
              {info.phase ? (
                <Chip compact style={{ backgroundColor: theme.colors.phase[info.phase].container }}>
                  {t(`phases.${info.phase}`)}
                </Chip>
              ) : null}
              {info.isFertile && !info.isOvulation ? (
                <Chip compact style={{ backgroundColor: theme.colors.phase.fertile.container }}>
                  {t("phases.fertile")}
                </Chip>
              ) : null}
              {info.fertility && info.isFertile ? (
                <Chip compact icon="flower-outline">
                  {t("calendar.fertility", { level: t(`fertility.${info.fertility}`) })}
                </Chip>
              ) : null}
              {predicted ? (
                <Chip compact icon="crystal-ball">
                  {info.cycle.kind === "future" ? t("calendar.prediction") : t("calendar.estimated")}
                </Chip>
              ) : null}
            </View>
          ) : (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t("calendar.noCycle")}
            </Text>
          )}

          {selectedLog ? (
            <LogSummary log={selectedLog} />
          ) : !isFuture ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t("calendar.noLog")}
            </Text>
          ) : null}

          {!isFuture ? (
            <View style={styles.actions}>
              <Button
                compact
                mode="contained-tonal"
                icon="notebook-edit-outline"
                text={selectedLog ? t("calendar.editLog") : t("calendar.addLog")}
                onPress={() => router.push({ pathname: "/log/[date]", params: { date: selected } })}
                style={styles.action}
              />
              <Button
                compact
                mode="outlined"
                icon={periodEntry ? "water-remove-outline" : "water-plus-outline"}
                text={periodEntry ? t("calendar.removePeriodStart") : t("calendar.markPeriodStart")}
                onPress={togglePeriodStart}
                style={styles.action}
              />
            </View>
          ) : null}
        </SectionCard>

        <SectionCard>
          <CalendarLegend />
        </SectionCard>
      </ScrollView>
      <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={3000}>
        {snack ?? ""}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 },
  headerActions: { flexDirection: "row", alignItems: "center" },
  calendarCard: { paddingHorizontal: 0 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  actions: { gap: 8 },
  action: {},
});
