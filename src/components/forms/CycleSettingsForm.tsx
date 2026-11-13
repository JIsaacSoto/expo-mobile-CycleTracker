import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { List } from "react-native-paper";
import NumberStepper from "@/components/ui/NumberStepper";
import { useI18n, type TranslationKey } from "@/i18n";
import { CYCLE_LIMITS, validateSettings, type SettingsIssue } from "@/lib/cycle";
import { useAppTheme } from "@/theme";

export interface CycleFormValues {
  cycleLength: number;
  periodLength: number;
  lutealLength: number;
}

interface Props {
  values: CycleFormValues;
  onChange: (values: CycleFormValues) => void;
  /** Open the advanced section initially (e.g. when the luteal phase was changed). */
  advancedOpen?: boolean;
}

export function issueMessage(
  issue: SettingsIssue,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
): string {
  switch (issue.code) {
    case "outOfRange":
      return t("setup.errors.outOfRange", { min: issue.min, max: issue.max });
    case "overlapsOvulation":
      return t("setup.warnings.overlapsOvulation", { day: issue.ovulationDay });
    default:
      return t(`setup.warnings.${issue.code}`);
  }
}

/** Cycle length, period length and (advanced) luteal phase, with clinical warnings. */
export default function CycleSettingsForm({ values, onChange, advancedOpen }: Props) {
  const { t } = useI18n();
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState(advancedOpen ?? values.lutealLength !== 14);
  const { errors, warnings } = validateSettings(values);

  const messageFor = (field: keyof CycleFormValues, list: SettingsIssue[]) => {
    const issue = list.find((i) => i.field === field);
    return issue ? issueMessage(issue, t) : null;
  };
  const days = (n: number) => t("common.days", { count: n });

  return (
    <View style={styles.container}>
      <NumberStepper
        label={t("setup.periodLength")}
        value={values.periodLength}
        min={CYCLE_LIMITS.periodLength.min}
        max={CYCLE_LIMITS.periodLength.max}
        format={days}
        onChange={(periodLength) => onChange({ ...values, periodLength })}
        helper={t("setup.periodLengthHelp")}
        warning={messageFor("periodLength", warnings)}
        error={messageFor("periodLength", errors)}
      />
      <NumberStepper
        label={t("setup.cycleLength")}
        value={values.cycleLength}
        min={CYCLE_LIMITS.cycleLength.min}
        max={CYCLE_LIMITS.cycleLength.max}
        format={days}
        onChange={(cycleLength) => onChange({ ...values, cycleLength })}
        helper={t("setup.cycleLengthHelp")}
        warning={messageFor("cycleLength", warnings)}
        error={messageFor("cycleLength", errors)}
      />
      <List.Accordion
        title={t("setup.advanced")}
        expanded={expanded}
        onPress={() => setExpanded((v) => !v)}
        left={(props) => <List.Icon {...props} icon="tune-variant" />}
        style={[styles.accordion, { backgroundColor: theme.colors.elevation.level1 }]}
        titleStyle={{ color: theme.colors.onSurface }}
      >
        <View style={styles.advanced}>
          <NumberStepper
            label={t("setup.lutealLength")}
            value={values.lutealLength}
            min={CYCLE_LIMITS.lutealLength.min}
            max={CYCLE_LIMITS.lutealLength.max}
            format={days}
            onChange={(lutealLength) => onChange({ ...values, lutealLength })}
            helper={t("setup.lutealLengthHelp")}
            error={messageFor("lutealLength", errors)}
          />
        </View>
      </List.Accordion>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  accordion: { borderRadius: 12, marginTop: 4 },
  advanced: { paddingTop: 12 },
});
