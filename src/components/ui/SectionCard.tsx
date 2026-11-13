import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Card, Icon, Text } from "react-native-paper";
import { useAppTheme } from "@/theme";

interface Props {
  title?: string;
  icon?: string;
  iconColor?: string;
  right?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: "default" | "primary" | "warning";
}

export default function SectionCard({ title, icon, iconColor, right, children, style, tone = "default" }: Props) {
  const theme = useAppTheme();
  const background =
    tone === "primary"
      ? theme.colors.primaryContainer
      : tone === "warning"
        ? theme.colors.warningContainer
        : theme.colors.elevation.level1;
  const foreground =
    tone === "primary"
      ? theme.colors.onPrimaryContainer
      : tone === "warning"
        ? theme.colors.onWarningContainer
        : theme.colors.onSurface;

  return (
    <Card mode="contained" style={[styles.card, { backgroundColor: background }, style]}>
      <Card.Content style={styles.content}>
        {title ? (
          <View style={styles.header}>
            {icon ? <Icon source={icon} size={22} color={iconColor ?? foreground} /> : null}
            <Text variant="titleMedium" style={[styles.title, { color: foreground }]} accessibilityRole="header">
              {title}
            </Text>
            {right}
          </View>
        ) : null}
        {children}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20 },
  content: { gap: 10, paddingVertical: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { flex: 1, fontWeight: "600" },
});
