import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { styles } from './CycleScreen.styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CycleScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.text}>
        Cycle Screen
      </Text>
      <MaterialCommunityIcons name="sync" size={32} color="red" />
    </View>
  );
}
