import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from "./ConfigScreen.styles";

export default function ConfigScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Config Screen
      </Text>
      <MaterialCommunityIcons name="cog" size={32} color="red" />
    </View>
  );
}
