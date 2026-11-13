import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  permissionRow: { flexDirection: "row", alignItems: "center" },
  suggestion: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingLeft: 12, paddingVertical: 4 },
  listItem: { paddingHorizontal: 0, marginVertical: -8 },
  fieldLabel: { marginTop: 8 },
});
