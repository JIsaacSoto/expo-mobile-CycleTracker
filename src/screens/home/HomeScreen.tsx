import { View, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { styles } from './HomeScreen.styles';
import { useRouter } from 'expo-router';
import Button from '@/components/ui/Button';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.text}>
        Welcome to
      </Text>
      <View>
        <Image source={ require('../../../assets/icon.png') } style={styles.image} />
      </View>
      <Text variant="headlineMedium" style={styles.text}>
        {"\n"}
      </Text>
      <Button
        onPress={() => router.push('/dashboard/config')}
        text="Get Started"
      >
      </Button>
    </View>
  );
}
