import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { CycleProvider } from "@/contexts/CycleContext";
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RootLayout() {
  return (
    <CycleProvider>
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
    </CycleProvider>
  );
}
