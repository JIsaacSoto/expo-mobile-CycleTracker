import { StyleSheet, View } from "react-native";
import { Chip } from "react-native-paper";
import { useAppTheme } from "@/theme";

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  icon?: string;
}

interface SingleProps<T extends string> {
  multiple?: false;
  options: ChipOption<T>[];
  value: T | null | undefined;
  onChange: (value: T | null) => void;
  selectedColor?: string;
}

interface MultiProps<T extends string> {
  multiple: true;
  options: ChipOption<T>[];
  value: T[] | undefined;
  onChange: (value: T[]) => void;
  selectedColor?: string;
}

/** Selectable chips; tapping a selected single chip clears it. */
export default function ChipGroup<T extends string>(props: SingleProps<T> | MultiProps<T>) {
  const theme = useAppTheme();
  const selectedBg = props.selectedColor ?? theme.colors.secondaryContainer;

  const isSelected = (v: T) =>
    props.multiple ? (props.value ?? []).includes(v) : props.value === v;

  const toggle = (v: T) => {
    if (props.multiple) {
      const current = props.value ?? [];
      props.onChange(current.includes(v) ? current.filter((x) => x !== v) : [...current, v]);
    } else {
      props.onChange(props.value === v ? null : v);
    }
  };

  return (
    <View style={styles.wrap} accessibilityRole={props.multiple ? undefined : "radiogroup"}>
      {props.options.map((o) => {
        const selected = isSelected(o.value);
        return (
          <Chip
            key={o.value}
            icon={selected ? "check" : o.icon}
            selected={false}
            showSelectedCheck={false}
            onPress={() => toggle(o.value)}
            mode={selected ? "flat" : "outlined"}
            style={selected ? { backgroundColor: selectedBg } : { backgroundColor: "transparent" }}
            accessibilityState={{ selected }}
            accessibilityRole={props.multiple ? "checkbox" : "radio"}
          >
            {o.label}
          </Chip>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
