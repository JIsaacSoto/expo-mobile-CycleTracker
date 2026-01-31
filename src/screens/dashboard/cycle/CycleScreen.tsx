import { View } from "react-native";
import { Text } from "react-native-paper";
import { styles } from "./CycleScreen.styles";
import CycleChart from "@/components/ui/CycleChart";

export default function CycleScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Cycle Screen
        {"\n"}
        {"\n"}
      </Text>
      <Text variant="headlineMedium" style={styles.text}>
        Luteal Phase | Follicular Phase
      </Text>
      <CycleChart text="Cycle Chart" />
    </View>
  );
}
