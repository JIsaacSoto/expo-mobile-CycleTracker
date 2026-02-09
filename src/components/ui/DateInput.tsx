import { useState } from "react";
import { Platform, View } from "react-native";
import { TextInput } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";

interface Props {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
}

export default function DateInput({ label, value, onChange }: Props) {
  const [show, setShow] = useState(false);

  const handleChange = (_: any, selectedDate?: Date) => {
    setShow(Platform.OS === "ios");
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <View>
      <TextInput
        label={label}
        mode="outlined"
        value={value ? value.toLocaleDateString() : ""}
        editable={false}
        onPressIn={() => setShow(true)}
        right={
          <TextInput.Icon icon="calendar" onPress={() => setShow(true)} />
        }
      />

      {show && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
        />
      )}
    </View>
  );
}
