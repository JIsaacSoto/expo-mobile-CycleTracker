import { MD3DarkTheme, MD3LightTheme, useTheme, type MD3Theme } from "react-native-paper";
import type { Phase } from "@/types/cycle";

/** Brand color from the CycleTracker logo. */
export const BRAND = "#AD404A";

export type PhaseColorKey = Phase | "fertile";

export interface PhaseColor {
  /** Strong color: ring arcs, dots, icons. */
  main: string;
  /** Soft background: calendar cells, chips. */
  container: string;
}

export interface AppColors {
  phase: Record<PhaseColorKey, PhaseColor>;
  success: string;
  warning: string;
  warningContainer: string;
  onWarningContainer: string;
}

export type AppTheme = MD3Theme & { colors: MD3Theme["colors"] & AppColors };

const lightColors: AppTheme["colors"] = {
  ...MD3LightTheme.colors,
  primary: BRAND,
  onPrimary: "#FFFFFF",
  primaryContainer: "#FFDADB",
  onPrimaryContainer: "#40000E",
  secondary: "#775657",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#FFDADA",
  onSecondaryContainer: "#2C1516",
  tertiary: "#7A5476",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#FFD7F5",
  onTertiaryContainer: "#2F112F",
  error: "#BA1A1A",
  onError: "#FFFFFF",
  errorContainer: "#FFDAD6",
  onErrorContainer: "#410002",
  background: "#FFF8F7",
  onBackground: "#22191A",
  surface: "#FFF8F7",
  onSurface: "#22191A",
  surfaceVariant: "#F4DDDD",
  onSurfaceVariant: "#524344",
  outline: "#857374",
  outlineVariant: "#D7C1C2",
  shadow: "#000000",
  scrim: "#000000",
  inverseSurface: "#382E2E",
  inverseOnSurface: "#FFEDEC",
  inversePrimary: "#FFB3B6",
  surfaceDisabled: "rgba(34, 25, 26, 0.12)",
  onSurfaceDisabled: "rgba(34, 25, 26, 0.38)",
  backdrop: "rgba(58, 45, 46, 0.4)",
  elevation: {
    level0: "transparent",
    level1: "#FBEFEE",
    level2: "#F8E9E9",
    level3: "#F6E4E4",
    level4: "#F5E2E2",
    level5: "#F4DEDF",
  },
  phase: {
    menstrual: { main: "#D2475A", container: "#F9D5DA" },
    follicular: { main: "#3A8E9C", container: "#CDEBEF" },
    ovulation: { main: "#23864F", container: "#C3E9D2" },
    fertile: { main: "#4FAE76", container: "#DDF3E5" },
    luteal: { main: "#8A5BA6", container: "#ECDDF4" },
  },
  success: "#23864F",
  warning: "#8A5300",
  warningContainer: "#FFDDB8",
  onWarningContainer: "#2C1600",
};

const darkColors: AppTheme["colors"] = {
  ...MD3DarkTheme.colors,
  primary: "#FFB3B6",
  onPrimary: "#680020",
  primaryContainer: "#8B2933",
  onPrimaryContainer: "#FFDADB",
  secondary: "#E6BDBD",
  onSecondary: "#44292A",
  secondaryContainer: "#5D3F40",
  onSecondaryContainer: "#FFDADA",
  tertiary: "#EBB9DF",
  onTertiary: "#472645",
  tertiaryContainer: "#603C5D",
  onTertiaryContainer: "#FFD7F5",
  error: "#FFB4AB",
  onError: "#690005",
  errorContainer: "#93000A",
  onErrorContainer: "#FFDAD6",
  background: "#1A1112",
  onBackground: "#F0DEDE",
  surface: "#1A1112",
  onSurface: "#F0DEDE",
  surfaceVariant: "#524344",
  onSurfaceVariant: "#D7C1C2",
  outline: "#A08C8D",
  outlineVariant: "#524344",
  shadow: "#000000",
  scrim: "#000000",
  inverseSurface: "#F0DEDE",
  inverseOnSurface: "#382E2E",
  inversePrimary: BRAND,
  surfaceDisabled: "rgba(240, 222, 222, 0.12)",
  onSurfaceDisabled: "rgba(240, 222, 222, 0.38)",
  backdrop: "rgba(58, 45, 46, 0.4)",
  elevation: {
    level0: "transparent",
    level1: "#25191A",
    level2: "#2C1E1F",
    level3: "#332324",
    level4: "#352426",
    level5: "#3A2829",
  },
  phase: {
    menstrual: { main: "#F2798A", container: "#5C2530" },
    follicular: { main: "#79C7D4", container: "#1F4249" },
    ovulation: { main: "#6FD39A", container: "#1D4A31" },
    fertile: { main: "#93DBAF", container: "#21402E" },
    luteal: { main: "#CBA2E2", container: "#43304F" },
  },
  success: "#6FD39A",
  warning: "#FFB95C",
  warningContainer: "#6A3E00",
  onWarningContainer: "#FFDDB8",
};

export const lightTheme: AppTheme = { ...MD3LightTheme, roundness: 4, colors: lightColors };
export const darkTheme: AppTheme = { ...MD3DarkTheme, roundness: 4, colors: darkColors };

export function useAppTheme(): AppTheme {
  return useTheme<AppTheme>();
}

/** Same color with alpha (hex #RRGGBB only). */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}
