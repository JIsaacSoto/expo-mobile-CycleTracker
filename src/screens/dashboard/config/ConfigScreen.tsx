import { View } from "react-native";
import React from "react";
import { Text, TextInput } from "react-native-paper";
import Button from "@/components/ui/Button";
import DateInput from "@/components/ui/DateInput";
import { styles } from "./ConfigScreen.styles";
import { router } from "expo-router";

export default function ConfigScreen() {
  const [lastPeriodDate, setLastPeriodDate] = React.useState<Date | null>(null);
  const [periodLength, setPeriodLength] = React.useState("");
  const [cycleLength, setCycleLength] = React.useState("");

  const validate = () => {
    if (!lastPeriodDate) return "Please select the last period date.";

    const period = Number(periodLength);
    const cycle = Number(cycleLength);

    if (!period || !cycle) {
      return "Period and cycle length are required.";
    }

    if (period < 1 || period > 10) {
      return "Period length must be between 1 and 10 days.";
    }

    if (cycle < 21 || cycle > 44) {
      return "Cycle length must be between 21 and 44 days.";
    }

    if (lastPeriodDate > new Date()) {
      return "Last period date cannot be in the future.";
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Settings
        {"\n"}
      </Text>
      <View style={{ width: "80%", gap: 24 }}>
        <DateInput
          label="Last Period"
          value={lastPeriodDate}
          onChange={setLastPeriodDate}
        />

        <TextInput
          label="Period Length (days)"
          mode="outlined"
          keyboardType="numeric"
          placeholder="5"
          placeholderTextColor="rgba(0,0,0,0.3)"
          value={periodLength}
          onChangeText={(text) => {
            if (/^\d{0,2}$/.test(text)) {
              setPeriodLength(text);
            }
          }}
        />
        <TextInput
          label="Cycle Length (days)"
          mode="outlined"
          keyboardType="numeric"
          placeholder="28"
          placeholderTextColor="rgba(0,0,0,0.3)"
          value={cycleLength}
          onChangeText={(text) => {
            if (/^\d{0,2}$/.test(text)) {
              setCycleLength(text);
            }
          }}
        />
        <Button
          onPress={() => {
            const error = validate();
            if (error) {
              alert(error);
              return;
            }
            router.push("/dashboard/cycle");
          }}
          text="Save & Continue"
        ></Button>
      </View>
    </View>
  );
}
