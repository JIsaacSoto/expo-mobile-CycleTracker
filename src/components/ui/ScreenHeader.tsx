import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useAppTheme } from "@/theme";

interface Props {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  left?: ReactNode;
}

export default function ScreenHeader({ title, subtitle, right, left }: Props) {
  const theme = useAppTheme();
  return (
    <View style={styles.row}>
      {left}
      <View style={styles.texts}>
        {subtitle ? (
          <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            {subtitle}
          </Text>
        ) : null}
        <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  texts: { flex: 1 },
});
