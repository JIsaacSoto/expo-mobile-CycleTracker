import { Tabs } from "expo-router";
import { CommonActions } from "@react-navigation/native";
import { BottomNavigation, Icon } from "react-native-paper";
import { useI18n } from "@/i18n";
import { useAppTheme } from "@/theme";

const ICONS: Record<string, { focused: string; unfocused: string }> = {
  cycle: { focused: "circle-slice-6", unfocused: "circle-slice-6" },
  calendar: { focused: "calendar-month", unfocused: "calendar-month-outline" },
  config: { focused: "cog", unfocused: "cog-outline" },
};

export default function DashboardLayout() {
  const { t } = useI18n();
  const theme = useAppTheme();

  return (
    <Tabs
      initialRouteName="cycle"
      backBehavior="initialRoute"
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
      tabBar={({ navigation, state, descriptors, insets }) => (
        <BottomNavigation.Bar
          navigationState={state}
          safeAreaInsets={insets}
          style={{ backgroundColor: theme.colors.elevation.level2 }}
          activeIndicatorStyle={{ backgroundColor: theme.colors.primaryContainer }}
          onTabPress={({ route, preventDefault }) => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (event.defaultPrevented) {
              preventDefault();
            } else {
              navigation.dispatch({
                ...CommonActions.navigate(route.name, route.params),
                target: state.key,
              });
            }
          }}
          renderIcon={({ route, focused, color }) => {
            const icon = ICONS[route.name];
            return icon ? (
              <Icon source={focused ? icon.focused : icon.unfocused} size={24} color={color} />
            ) : null;
          }}
          getLabelText={({ route }) => descriptors[route.key].options.title ?? route.name}
        />
      )}
    >
      <Tabs.Screen name="cycle" options={{ title: t("tabs.cycle") }} />
      <Tabs.Screen name="calendar" options={{ title: t("tabs.calendar") }} />
      <Tabs.Screen name="config" options={{ title: t("tabs.settings") }} />
    </Tabs>
  );
}
