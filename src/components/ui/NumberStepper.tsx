import { StyleSheet, View } from "react-native";
import { HelperText, IconButton, Text } from "react-native-paper";
import { useAppTheme } from "@/theme";

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Text shown after the number, e.g. "días". */
  format?: (value: number) => string;
  helper?: string | null;
  warning?: string | null;
  error?: string | null;
  dense?: boolean;
}

/** Bounded numeric input with − / + buttons (no keyboard, no invalid states). */
export default function NumberStepper({
  label,
  value,
  min,
  max,
  onChange,
  format,
  helper,
  warning,
  error,
  dense,
}: Props) {
  const theme = useAppTheme();
  const set = (next: number) => onChange(Math.min(max, Math.max(min, next)));

  return (
    <View>
      <View
        style={[
          styles.row,
          dense && styles.dense,
          {
            borderColor: error ? theme.colors.error : theme.colors.outlineVariant,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <Text variant="bodyLarge" style={[styles.label, { color: theme.colors.onSurface }]}>
          {label}
        </Text>
        <IconButton
          icon="minus"
          mode="contained-tonal"
          size={18}
          disabled={value <= min}
          onPress={() => set(value - 1)}
          accessibilityLabel={`${label} −`}
        />
        <Text
          variant="titleMedium"
          style={[styles.value, { color: theme.colors.onSurface }]}
          accessibilityLiveRegion="polite"
        >
          {format ? format(value) : value}
        </Text>
        <IconButton
          icon="plus"
          mode="contained-tonal"
          size={18}
          disabled={value >= max}
          onPress={() => set(value + 1)}
          accessibilityLabel={`${label} +`}
        />
      </View>
      {error ? (
        <HelperText type="error">{error}</HelperText>
      ) : warning ? (
        <HelperText type="info" style={{ color: theme.colors.warning }}>
          {warning}
        </HelperText>
      ) : helper ? (
        <HelperText type="info">{helper}</HelperText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 4,
    minHeight: 60,
  },
  dense: { minHeight: 52 },
  label: { flex: 1 },
  value: { minWidth: 64, textAlign: "center" },
});
