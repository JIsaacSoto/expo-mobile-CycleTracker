import { Image, StyleSheet, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { images } from "@/assets";
import { useAppTheme } from "@/theme";

export default function LoadingScreen() {
  const theme = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Image source={images.icon} style={styles.logo} resizeMode="contain" />
      <ActivityIndicator color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 24 },
  logo: { width: 160, height: 160 },
});
