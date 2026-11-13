import { LogBox } from "react-native";

/**
 * expo-notifications logs these development messages in Expo Go as soon as it is
 * imported. They refer to *remote* push notifications, which this app does not use
 * (it only schedules local notifications, which work in Expo Go), so they are
 * hidden from the LogBox overlay. They still appear in the Metro console.
 */
LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications (remote notifications)",
  "`expo-notifications` functionality is not fully supported in Expo Go",
]);
