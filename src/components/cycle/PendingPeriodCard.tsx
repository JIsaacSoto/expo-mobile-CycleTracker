import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button as PaperButton, Dialog, IconButton, Portal, Text } from "react-native-paper";
import NumberStepper from "@/components/ui/NumberStepper";
import SectionCard from "@/components/ui/SectionCard";
import { useCycle } from "@/hooks/useCycle";
import { useI18n } from "@/i18n";
import { addDays } from "@/lib/dates";
import type { CycleStatus } from "@/types/cycle";
import { useAppTheme } from "@/theme";

interface Props {
  status: CycleStatus;
  /** Opens the "log period" dialog (late mode → "It started"). */
  onLogPeriod: () => void;
}

/**
 * Hybrid late-period flow:
 * - awaiting: the cycle advanced automatically; ask whether the period came
 *   on time, late (pick the days) or not yet. Closing keeps the automatic cycle.
 * - late: the user said "not yet"; show the delay counter and guidance.
 */
export default function PendingPeriodCard({ status, onLogPeriod }: Props) {
  const theme = useAppTheme();
  const { t, formatDate } = useI18n();
  const { confirmOnTime, confirmDelayed, markNotArrived, keepAutomatic, exitLateMode } = useCycle();
  const [delayOpen, setDelayOpen] = useState(false);
  const [delay, setDelay] = useState(1);

  const expected = status.pendingExpected;
  if (!expected || status.state === "normal") return null;
  const lateDays = status.lateDays;

  if (status.state === "late") {
    return (
      <SectionCard
        tone="warning"
        icon="calendar-clock"
        title={
          lateDays === 0 ? t("late.titleToday") : t("late.title", { count: lateDays })
        }
      >
        <Text variant="bodyMedium" style={{ color: theme.colors.onWarningContainer }}>
          {t("late.body", { date: formatDate(expected, "medium") })}
        </Text>
        {lateDays >= 3 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onWarningContainer }}>
            {t("late.pregnancyHint")}
          </Text>
        ) : null}
        {lateDays >= 30 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onWarningContainer, fontWeight: "600" }}>
            {t("late.doctorHint")}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <PaperButton mode="contained" icon="water-plus-outline" onPress={onLogPeriod}>
            {t("late.arrived")}
          </PaperButton>
          <PaperButton mode="text" textColor={theme.colors.onWarningContainer} onPress={exitLateMode}>
            {t("late.backToAuto")}
          </PaperButton>
        </View>
      </SectionCard>
    );
  }

  const body =
    status.pendingAutoStarts.length > 1
      ? t("pending.multiple", {
          count: status.pendingAutoStarts.length,
          date: formatDate(expected, "medium"),
        })
      : lateDays === 0
        ? t("pending.expectedToday")
        : t("pending.expectedOn", { date: formatDate(expected, "medium") });

  return (
    <>
      <SectionCard
        tone="primary"
        icon="help-circle-outline"
        title={t("pending.title")}
        right={
          <IconButton
            icon="close"
            size={20}
            onPress={keepAutomatic}
            accessibilityLabel={t("pending.keepAuto")}
            iconColor={theme.colors.onPrimaryContainer}
            style={styles.close}
          />
        }
      >
        <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
          {body}
        </Text>
        <View style={styles.actions}>
          <PaperButton mode="contained" onPress={confirmOnTime}>
            {lateDays === 0 ? t("pending.startedToday") : t("pending.onTime")}
          </PaperButton>
          {lateDays > 0 ? (
            <PaperButton
              mode="outlined"
              textColor={theme.colors.onPrimaryContainer}
              onPress={() => {
                setDelay(Math.min(1, lateDays));
                setDelayOpen(true);
              }}
            >
              {t("pending.delayed")}
            </PaperButton>
          ) : null}
          <PaperButton mode="outlined" onPress={markNotArrived} textColor={theme.colors.onPrimaryContainer}>
            {t("pending.notYet")}
          </PaperButton>
        </View>
        <PaperButton
          mode="text"
          compact
          onPress={keepAutomatic}
          textColor={theme.colors.onPrimaryContainer}
          style={styles.keep}
        >
          {t("pending.keepAuto")}
        </PaperButton>
      </SectionCard>

      <Portal>
        <Dialog visible={delayOpen} onDismiss={() => setDelayOpen(false)}>
          <Dialog.Title>{t("pending.delayTitle")}</Dialog.Title>
          <Dialog.Content style={{ gap: 12 }}>
            <NumberStepper
              label={t("pending.delayDays")}
              value={delay}
              min={1}
              max={Math.max(1, lateDays)}
              format={(n) => t("common.days", { count: n })}
              onChange={setDelay}
            />
            <Text variant="bodyLarge" style={{ textAlign: "center" }}>
              {t("pending.delayStarted", {
                date: formatDate(addDays(expected, delay), "long"),
              })}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setDelayOpen(false)}>{t("common.cancel")}</PaperButton>
            <PaperButton
              mode="contained"
              onPress={() => {
                confirmDelayed(delay);
                setDelayOpen(false);
              }}
            >
              {t("common.confirm")}
            </PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  close: { margin: -8 },
  keep: { alignSelf: "flex-start", marginLeft: -8 },
});
