import { View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { styles } from './HomeScreen.styles';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.text}>
        Welcome to
        Cycle Tracker
      </Text>
      <Button mode="contained" onPress={() => router.push('/dashboard/cycle/Cycle')}>
        Get Started
      </Button>
    </View>
  );
}
