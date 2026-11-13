import type { TemperatureUnit } from "@/types/preferences";

/** Accepted basal temperature range, in °C. */
export const BBT_RANGE_C = { min: 34, max: 40 } as const;

export function celsiusToUnit(celsius: number, unit: TemperatureUnit): number {
  return unit === "F" ? celsius * 1.8 + 32 : celsius;
}

export function unitToCelsius(value: number, unit: TemperatureUnit): number {
  return unit === "F" ? (value - 32) / 1.8 : value;
}

export function formatTemperature(celsius: number, unit: TemperatureUnit): string {
  return `${celsiusToUnit(celsius, unit).toFixed(2)} °${unit}`;
}

/** Parses user input ("36,5" or "36.5"); returns °C or null when invalid/out of range. */
export function parseTemperature(text: string, unit: TemperatureUnit): number | null {
  const value = Number(text.replace(",", ".").trim());
  if (!text.trim() || !Number.isFinite(value)) return null;
  const celsius = unitToCelsius(value, unit);
  if (celsius < BBT_RANGE_C.min || celsius > BBT_RANGE_C.max) return null;
  return Math.round(celsius * 100) / 100;
}
