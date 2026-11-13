import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Card, Icon, IconButton, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Button from "@/components/ui/Button";
import DateInput from "@/components/ui/DateInput";
import CycleSettingsForm, { type CycleFormValues } from "@/components/forms/CycleSettingsForm";
import { useCycle } from "@/hooks/useCycle";
import { capitalize, useI18n } from "@/i18n";
import { CLINICAL, cycleActions, getCycleTimeline, validateSettings } from "@/lib/cycle";
import { addDays, diffDays, type ISODate } from "@/lib/dates";
import { createEmptyCycleData } from "@/services/schema";
import { useAppTheme } from "@/theme";

export default function SetupScreen() {
  const theme = useAppTheme();
  const { t, formatDate } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, today, completeSetup } = useCycle();

  const [lastPeriod, setLastPeriod] = useState<ISODate | null>(
    data.periods.length ? data.periods[data.periods.length - 1].startDate : null
  );
  const [values, setValues] = useState<CycleFormValues>({
    cycleLength: data.settings.cycleLength,
    periodLength: data.settings.periodLength,
    lutealLength: data.settings.lutealLength,
  });
  const [submitted, setSubmitted] = useState(false);

  const dateError =
    submitted && !lastPeriod
      ? t("setup.errors.lastPeriodRequired")
      : lastPeriod && lastPeriod > today
        ? t("setup.errors.future")
        : null;
  const dateWarning =
    lastPeriod && diffDays(today, lastPeriod) > CLINICAL.amenorrheaDays ? t("setup.warnings.oldDate") : null;
  const { errors } = validateSettings(values);

  const preview = useMemo(() => {
    if (!lastPeriod || lastPeriod > today) return null;
    const draft = cycleActions.completeSetup(createEmptyCycleData(), {
      lastPeriodDate: lastPeriod,
      ...values,
    });
    const timeline = getCycleTimeline(draft, today, 120);
    const upcoming = timeline.filter((c) => c.kind !== "past");
    const nextPeriod = timeline.find((c) => c.kind === "future");
    const fertile = upcoming.find((c) => c.fertileEnd >= today);
    const ovulation = upcoming.find((c) => c.ovulation >= today);
    if (!nextPeriod || !fertile || !ovulation) return null;
    return {
      nextPeriod: nextPeriod.start,
      ovulation: ovulation.ovulation,
      fertileStart: fertile.fertileStart,
      fertileEnd: fertile.fertileEnd,
    };
  }, [lastPeriod, values, today]);

  const submit = () => {
    setSubmitted(true);
    if (!lastPeriod || lastPeriod > today || errors.length) return;
    completeSetup({ lastPeriodDate: lastPeriod, ...values });
    router.push("/onboarding/notifications");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} accessibilityLabel={t("common.back")} />
        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {t("onboarding.stepOf", { step: 1, total: 2 })}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          {t("setup.title")}
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 24 }}>
          {t("setup.subtitle")}
        </Text>

        <DateInput
          label={t("setup.lastPeriod")}
          value={lastPeriod}
          onChange={setLastPeriod}
          maximumDate={today}
          minimumDate={addDays(today, -365)}
          error={dateError}
          helper={dateWarning ?? t("setup.lastPeriodHelp")}
        />
        <View style={{ height: 8 }} />
        <CycleSettingsForm values={values} onChange={setValues} />

        {preview ? (
          <Card mode="contained" style={[styles.preview, { backgroundColor: theme.colors.elevation.level2 }]}>
            <Card.Content style={{ gap: 12 }}>
              <Text variant="titleMedium">{t("setup.preview")}</Text>
              <PreviewRow
                icon="water"
                color={theme.colors.phase.menstrual.main}
                label={t("setup.previewNextPeriod")}
                value={capitalize(formatDate(preview.nextPeriod, "long"))}
              />
              <PreviewRow
                icon="flower-outline"
                color={theme.colors.phase.fertile.main}
                label={t("setup.previewFertile")}
                value={t("common.dateRange", {
                  start: formatDate(preview.fertileStart, "short"),
                  end: formatDate(preview.fertileEnd, "short"),
                })}
              />
              <PreviewRow
                icon="egg-outline"
                color={theme.colors.phase.ovulation.main}
                label={t("setup.previewOvulation")}
                value={capitalize(formatDate(preview.ovulation, "long"))}
              />
            </Card.Content>
          </Card>
        ) : null}

        <Button text={t("common.continue")} onPress={submit} style={{ marginTop: 24 }} />
      </ScrollView>
    </View>
  );
}

function PreviewRow({ icon, color, label, value }: { icon: string; color: string; label: string; value: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.previewRow}>
      <Icon source={icon} size={22} color={color} />
      <View style={{ flex: 1 }}>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
        <Text variant="bodyLarge">{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingRight: 16, justifyContent: "space-between" },
  content: { paddingHorizontal: 20 },
  title: { fontWeight: "700", marginBottom: 8 },
  preview: { marginTop: 20, borderRadius: 16 },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 14 },
});
