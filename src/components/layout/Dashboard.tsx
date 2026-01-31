import { View } from 'react-native';
import { BottomNavigation } from 'react-native-paper';
import { useRouter, useSegments, Stack } from 'expo-router';

const routes = [
  { key: 'cycle', title: 'Cycle', focusedIcon: 'sync' },
  { key: 'calendar', title: 'Calendar', focusedIcon: 'calendar', unfocusedIcon: 'calendar-outline' },
];

export default function Dashboard() {
  const router = useRouter();
  const segments = useSegments();

  const current = segments[segments.length - 1];
  const index = Math.max(
    routes.findIndex(r => r.key === current),
    0
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Stack 
          screenOptions={{
            headerShown: false,
          }} />
      </View>

      <BottomNavigation.Bar
        navigationState={{ index, routes }}
        onTabPress={({ route }) => {
          router.replace(`/dashboard/${route.key}`);
        }}
      />
    </View>
  );
}
