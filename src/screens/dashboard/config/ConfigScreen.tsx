import { View } from "react-native";
import React from "react";
import { Text, TextInput, Divider } from "react-native-paper";
import Button from "@/components/ui/Button";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { styles } from "./ConfigScreen.styles";
import { router } from "expo-router";

export default function ConfigScreen() {
  const [lastPeriodDate, setLastPeriodDate] = React.useState("");
  const [periodLength, setPeriodLength] = React.useState("");
  const [cycleLength, setCycleLength] = React.useState("");

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Config Screen
        {"\n"}
      </Text>
      <View style={{ width: "80%", gap: 16 }}>
        <TextInput
          label="Last Period Date"
          mode="outlined"
          value={lastPeriodDate}
          onChangeText={(text) => setLastPeriodDate(text)}
        />
        <TextInput
          label="Period Length (days)"
          mode="outlined"
          value={periodLength}
          onChangeText={(text) => setPeriodLength(text)}
        />
        <TextInput
          label="Cycle Length (days)"
          mode="outlined"
          value={cycleLength}
          onChangeText={(text) => setCycleLength(text)}
        />
        <Button
          onPress={() => router.push("/dashboard/config")}
          text="Get Started"
        ></Button>
      </View>
    </View>
  );
}
