import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RootLayout() {
  return (
    <PaperProvider
      settings={{
        icon: props => <MaterialCommunityIcons {...props} />,
      }}
    >
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </PaperProvider>
  );
}
