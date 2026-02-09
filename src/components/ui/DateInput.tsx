import React from "react";
import { View, Pressable } from "react-native";
import { TextInput } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";

interface Props {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
}

export default function DateInput({ label, value, onChange }: Props) {
  const [open, setOpen] = React.useState(false);

  const formattedDate = value
    ? value.toLocaleDateString()
    : "";

  return (
    <View>
      <Pressable onPress={() => setOpen(true)}>
        <View pointerEvents="none">
          <TextInput
            label={label}
            mode="outlined"
            value={formattedDate}
            editable={false}
            right={
              <TextInput.Icon icon="calendar" />
            }
          />
        </View>
      </Pressable>

      {open && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display="calendar"
          onChange={(_, selectedDate) => {
            setOpen(false);
            if (selectedDate) onChange(selectedDate);
          }}
        />
      )}
    </View>
  );
}
