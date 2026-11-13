import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import {
  Button as PaperButton,
  Dialog,
  Divider,
  HelperText,
  IconButton,
  Portal,
  Switch,
  Text,
  TextInput,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Button from "@/components/ui/Button";
import ChipGroup from "@/components/log/ChipGroup";
import { BBT_RANGE_C, celsiusToUnit, parseTemperature } from "@/components/log/temperature";
import { useCycle } from "@/hooks/useCycle";
import { usePreferences } from "@/hooks/usePreferences";
import { capitalize, useI18n } from "@/i18n";
import { computeStats, getDayInfo, validatePeriodStart } from "@/lib/cycle";
import { isISODate, type ISODate } from "@/lib/dates";
import {
  FLOW_LEVELS,
  LH_RESULTS,
  MEDICATIONS,
  MOODS,
  MUCUS_TYPES,
  SEX_TYPES,
  SYMPTOMS,
  isBleeding,
  type DailyLog,
} from "@/types/log";
import { useAppTheme } from "@/theme";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useAppTheme();
  return (
    <View style={styles.section}>
      <Text variant="titleSmall" style={{ color: theme.colors.primary }} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function DailyLogScreen() {
  const theme = useAppTheme();
  const { t, formatDate } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ date: string }>();
  const { data, today, timeline, saveLog, removeLog, addPeriod, removePeriod } = useCycle();
  const { preferences } = usePreferences();
  const unit = preferences.temperatureUnit;

  const date: ISODate = isISODate(params.date) ? params.date : today;
  const existing = data.logs[date];
  const entry = data.periods.find((p) => p.startDate === date);
  const info = useMemo(() => getDayInfo(timeline, date), [timeline, date]);

  const [draft, setDraft] = useState<DailyLog>(() => existing ?? { date });
  const [periodStart, setPeriodStart] = useState(!!entry);
  const [bbtText, setBbtText] = useState(
    typeof existing?.bbt === "number" ? celsiusToUnit(existing.bbt, unit).toFixed(2) : ""
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isFuture = date > today;
  const bbtValue = parseTemperature(bbtText, unit);
  const bbtInvalid = bbtText.trim() !== "" && bbtValue === null;
  const range =
    unit === "F"
      ? { min: celsiusToUnit(BBT_RANGE_C.min, "F").toFixed(1), max: celsiusToUnit(BBT_RANGE_C.max, "F").toFixed(1) }
      : { min: String(BBT_RANGE_C.min), max: String(BBT_RANGE_C.max) };

  const periodValidation =
    periodStart && !entry
      ? validatePeriodStart(date, data.periods, today, computeStats(data).periodLength)
      : { error: null, warning: null };
  const periodError = periodValidation.error
    ? periodValidation.error.code === "future"
      ? t("logPeriod.errors.future")
      : t("logPeriod.errors.overlap", { date: formatDate(periodValidation.error.other, "medium") })
    : null;

  const cannotRemoveLast = !periodStart && !!entry && data.periods.length <= 1;
  const showFlowHint = isBleeding(draft.flow) && !periodStart && !info.isPeriod;

  const update = (patch: Partial<DailyLog>) => setDraft((d) => ({ ...d, ...patch }));

  const save = () => {
    if (isFuture || bbtInvalid || periodError) return;
    saveLog({ ...draft, date, bbt: bbtValue });
    if (periodStart && !entry) addPeriod(date);
    if (!periodStart && entry && !cannotRemoveLast) removePeriod(entry.id);
    router.back();
  };

  const remove = () => {
    removeLog(date);
    setConfirmDelete(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 4, borderBottomColor: theme.colors.outlineVariant }]}>
        <IconButton icon="close" onPress={() => router.back()} accessibilityLabel={t("common.close")} />
        <View style={{ flex: 1 }}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("log.title")}
          </Text>
          <Text variant="titleMedium" numberOfLines={1}>
            {capitalize(formatDate(date, "long"))}
          </Text>
        </View>
        {!isFuture ? (
          <PaperButton mode="contained" onPress={save} disabled={bbtInvalid || !!periodError} style={styles.saveTop}>
            {t("common.save")}
          </PaperButton>
        ) : null}
      </View>

      {isFuture ? (
        <View style={styles.future}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}>
            {t("log.futureNotAllowed")}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.periodCard, { backgroundColor: theme.colors.phase.menstrual.container }]}>
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall">{t("log.periodStart")}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {info.isPeriod && !info.isPeriodStart && info.cycleDay && !info.isPredictedPeriod
                  ? t("log.periodDay", { day: info.cycleDay })
                  : t("log.periodStartHelp")}
              </Text>
            </View>
            <Switch
              value={periodStart}
              onValueChange={setPeriodStart}
              color={theme.colors.phase.menstrual.main}
              accessibilityLabel={t("log.periodStart")}
            />
          </View>
          {periodError ? <HelperText type="error">{periodError}</HelperText> : null}
          {cannotRemoveLast ? <HelperText type="error">{t("history.cannotDeleteLast")}</HelperText> : null}

          <Section title={t("log.flow")}>
            <ChipGroup
              options={FLOW_LEVELS.map((v) => ({ value: v, label: t(`log.flowLevels.${v}`), icon: "water-outline" }))}
              value={draft.flow}
              onChange={(flow) => update({ flow })}
              selectedColor={theme.colors.phase.menstrual.container}
            />
            {showFlowHint ? <HelperText type="info">{t("log.flowHint")}</HelperText> : null}
          </Section>
          <Divider />

          <Section title={t("log.symptoms")}>
            <ChipGroup
              multiple
              options={SYMPTOMS.map((v) => ({ value: v, label: t(`log.symptomList.${v}`) }))}
              value={draft.symptoms}
              onChange={(symptoms) => update({ symptoms })}
            />
          </Section>
          <Divider />

          <Section title={t("log.moods")}>
            <ChipGroup
              multiple
              options={MOODS.map((v) => ({ value: v, label: t(`log.moodList.${v}`) }))}
              value={draft.moods}
              onChange={(moods) => update({ moods })}
              selectedColor={theme.colors.tertiaryContainer}
            />
          </Section>
          <Divider />

          <Section title={t("log.fertilitySigns")}>
            <TextInput
              mode="outlined"
              label={t("log.bbt", { unit: `°${unit}` })}
              value={bbtText}
              onChangeText={(text) => setBbtText(text.replace(/[^0-9.,]/g, "").slice(0, 6))}
              keyboardType="decimal-pad"
              placeholder={unit === "F" ? "97.70" : "36.50"}
              error={bbtInvalid}
              right={<TextInput.Affix text={`°${unit}`} />}
            />
            <HelperText type={bbtInvalid ? "error" : "info"}>
              {bbtInvalid ? t("log.bbtInvalid", range) : t("log.bbtHelp")}
            </HelperText>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {t("log.mucus")}
            </Text>
            <ChipGroup
              options={MUCUS_TYPES.map((v) => ({ value: v, label: t(`log.mucusTypes.${v}`) }))}
              value={draft.mucus}
              onChange={(mucus) => update({ mucus })}
              selectedColor={theme.colors.phase.fertile.container}
            />
            <Text variant="labelLarge" style={[styles.subLabel, { color: theme.colors.onSurfaceVariant }]}>
              {t("log.lhTest")}
            </Text>
            <ChipGroup
              options={LH_RESULTS.map((v) => ({
                value: v,
                label: t(`log.lhResults.${v}`),
                icon: v === "positive" ? "plus-circle-outline" : "minus-circle-outline",
              }))}
              value={draft.lhTest}
              onChange={(lhTest) => update({ lhTest })}
              selectedColor={theme.colors.phase.ovulation.container}
            />
          </Section>
          <Divider />

          <Section title={t("log.sex")}>
            <ChipGroup
              options={SEX_TYPES.map((v) => ({
                value: v,
                label: t(`log.sexTypes.${v}`),
                icon: v === "protected" ? "shield-check-outline" : "heart-outline",
              }))}
              value={draft.sex}
              onChange={(sex) => update({ sex })}
            />
          </Section>
          <Divider />

          <Section title={t("log.medications")}>
            <ChipGroup
              multiple
              options={MEDICATIONS.map((v) => ({ value: v, label: t(`log.medicationList.${v}`), icon: "pill" }))}
              value={draft.medications}
              onChange={(medications) => update({ medications })}
            />
          </Section>
          <Divider />

          <Section title={t("log.note")}>
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={4}
              value={draft.note ?? ""}
              onChangeText={(note) => update({ note: note.slice(0, 1000) })}
              placeholder={t("log.notePlaceholder")}
              style={styles.note}
            />
          </Section>

          <Button text={t("common.save")} onPress={save} disabled={bbtInvalid || !!periodError} />
          {existing ? (
            <Button
              mode="text"
              icon="delete-outline"
              text={t("log.deleteLog")}
              textColor={theme.colors.error}
              onPress={() => setConfirmDelete(true)}
            />
          ) : null}
        </ScrollView>
      )}

      <Portal>
        <Dialog visible={confirmDelete} onDismiss={() => setConfirmDelete(false)}>
          <Dialog.Title>{t("log.deleteLog")}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t("log.deleteConfirm")}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setConfirmDelete(false)}>{t("common.cancel")}</PaperButton>
            <PaperButton textColor={theme.colors.error} onPress={remove}>
              {t("common.delete")}
            </PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  saveTop: { borderRadius: 20 },
  future: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  content: { padding: 16, gap: 14 },
  periodCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 14 },
  section: { gap: 10 },
  subLabel: { marginTop: 6 },
  note: { minHeight: 96 },
});
