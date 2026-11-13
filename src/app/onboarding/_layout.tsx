import { Stack } from "expo-router";
import { useAppTheme } from "@/theme";

export default function OnboardingLayout() {
  const theme = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
