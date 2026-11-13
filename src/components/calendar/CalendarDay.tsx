import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { DayInfo } from "@/types/cycle";
import { useAppTheme } from "@/theme";

export interface DayMarking {
  info?: DayInfo;
  logged?: boolean;
  selected?: boolean;
  isToday?: boolean;
}

interface Props {
  dateString: string;
  day: number;
  disabled: boolean;
  marking?: DayMarking;
  onPress: (dateString: string) => void;
  accessibilityLabel?: string;
}

function CalendarDayBase({ dateString, day, disabled, marking, onPress, accessibilityLabel }: Props) {
  const theme = useAppTheme();
  const { phase } = theme.colors;
  const info = marking?.info;

  let background = "transparent";
  let borderColor = "transparent";
  let borderStyle: "solid" | "dashed" = "solid";
  let textColor = theme.colors.onSurface;
  let fontWeight: "400" | "700" = "400";

  if (info?.isPeriod && !info.isPredictedPeriod) {
    background = phase.menstrual.main;
    textColor = "#FFFFFF";
    fontWeight = "700";
  } else if (info?.isPeriod) {
    background = phase.menstrual.container;
    borderColor = phase.menstrual.main;
    borderStyle = "dashed";
    textColor = theme.colors.onSurface;
  } else if (info?.isOvulation) {
    background = phase.ovulation.container;
    borderColor = phase.ovulation.main;
    fontWeight = "700";
  } else if (info?.isFertile) {
    background = phase.fertile.container;
  }

  const ring = marking?.isToday
    ? theme.colors.primary
    : marking?.selected
      ? theme.colors.onSurfaceVariant
      : "transparent";
  const selectedFill = marking?.selected ? theme.colors.surfaceVariant : "transparent";

  return (
    <Pressable
      onPress={() => onPress(dateString)}
      style={[styles.wrapper, { borderColor: ring, backgroundColor: selectedFill, opacity: disabled ? 0.35 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: !!marking?.selected }}
    >
      <View style={[styles.circle, { backgroundColor: background, borderColor, borderStyle }]}>
        <Text style={{ color: textColor, fontWeight, fontSize: 15 }}>{day}</Text>
      </View>
      <View
        style={[
          styles.dot,
          { backgroundColor: marking?.logged ? theme.colors.primary : "transparent" },
        ]}
      />
    </Pressable>
  );
}

const CalendarDay = memo(CalendarDayBase);
export default CalendarDay;

const styles = StyleSheet.create({
  wrapper: {
    width: 44,
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
});
