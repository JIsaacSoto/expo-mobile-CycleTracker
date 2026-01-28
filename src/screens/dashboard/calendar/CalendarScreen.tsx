import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CalendarScreen() {
  return (
    <View>
      <Text variant="headlineMedium">
        Calendar Screen
      </Text>
      <MaterialCommunityIcons name="calendar" size={32} color="red" />
    </View>
  );
}
