import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button as PaperButton, Dialog, HelperText, Portal, Switch, Text } from "react-native-paper";
import DateInput from "@/components/ui/DateInput";
import NumberStepper from "@/components/ui/NumberStepper";
import { useCycle } from "@/hooks/useCycle";
import { useI18n } from "@/i18n";
import { CYCLE_LIMITS, computeStats, validatePeriodStart } from "@/lib/cycle";
import { addDays, type ISODate } from "@/lib/dates";
import type { PeriodEntry } from "@/types/cycle";
import { useAppTheme } from "@/theme";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  /** Entry being edited; omit to add a new period. */
  entry?: PeriodEntry | null;
  initialDate?: ISODate;
  showLength?: boolean;
  onSubmit: (date: ISODate, length: number | null) => void;
  onDelete?: () => void;
}

export default function PeriodDialog({
  visible,
  onDismiss,
  entry,
  initialDate,
  showLength = true,
  onSubmit,
  onDelete,
}: Props) {
  const theme = useAppTheme();
  const { t, formatDate } = useI18n();
  const { data, today } = useCycle();
  const fallbackLength = computeStats(data).periodLength;

  const [date, setDate] = useState<ISODate>(entry?.startDate ?? initialDate ?? today);
  const [autoLength, setAutoLength] = useState(!entry?.length);
  const [length, setLength] = useState(entry?.length ?? fallbackLength);

  useEffect(() => {
    if (!visible) return;
    setDate(entry?.startDate ?? initialDate ?? today);
    setAutoLength(!entry?.length);
    setLength(entry?.length ?? fallbackLength);
  }, [visible, entry, initialDate, today, fallbackLength]);

  const { error, warning } = validatePeriodStart(date, data.periods, today, fallbackLength, entry?.id);
  const errorText = error
    ? error.code === "future"
      ? t("logPeriod.errors.future")
      : t("logPeriod.errors.overlap", { date: formatDate(error.other, "medium") })
    : null;
  const warningText =
    warning?.code === "tooClose"
      ? t("logPeriod.warnings.tooClose", { days: warning.days, date: formatDate(warning.other, "medium") })
      : null;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>
          {entry ? t("history.editTitle") : showLength ? t("history.addTitle") : t("logPeriod.title")}
        </Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <View style={styles.body}>
            {!entry ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t("logPeriod.body")}
              </Text>
            ) : null}
            <DateInput
              label={t("logPeriod.date")}
              value={date}
              onChange={setDate}
              maximumDate={today}
              minimumDate={addDays(today, -730)}
              error={errorText}
            />
            {warningText ? (
              <HelperText type="info" style={{ color: theme.colors.warning }}>
                {warningText}
              </HelperText>
            ) : null}
            {showLength ? (
              <>
                <View style={styles.switchRow}>
                  <Text variant="bodyMedium" style={{ flex: 1 }}>
                    {t("history.bleedingAuto")}
                  </Text>
                  <Switch value={autoLength} onValueChange={setAutoLength} />
                </View>
                {!autoLength ? (
                  <NumberStepper
                    dense
                    label={t("history.bleedingDays")}
                    value={length}
                    min={CYCLE_LIMITS.periodLength.min}
                    max={CYCLE_LIMITS.periodLength.max + 4}
                    format={(n) => t("common.days", { count: n })}
                    onChange={setLength}
                  />
                ) : null}
              </>
            ) : null}
          </View>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          {onDelete ? (
            <PaperButton textColor={theme.colors.error} onPress={onDelete} style={{ marginRight: "auto" }}>
              {t("common.delete")}
            </PaperButton>
          ) : null}
          <PaperButton onPress={onDismiss}>{t("common.cancel")}</PaperButton>
          <PaperButton
            mode="contained"
            disabled={!!error}
            onPress={() => onSubmit(date, showLength && !autoLength ? length : (entry?.length ?? null))}
          >
            {t("common.save")}
          </PaperButton>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: { maxWidth: 520, alignSelf: "center", width: "92%" },
  scrollArea: { paddingHorizontal: 24, borderTopWidth: 0, borderBottomWidth: 0 },
  body: { gap: 8, paddingVertical: 4 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
});
