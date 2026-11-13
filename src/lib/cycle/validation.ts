import { diffDays, type ISODate } from "@/lib/dates";
import type { CycleSettings, PeriodEntry } from "@/types/cycle";
import { CLINICAL, CYCLE_LIMITS, VALID_INTERVAL } from "./constants";

export type SettingsField = "cycleLength" | "periodLength" | "lutealLength";

export type SettingsIssue =
  | { field: SettingsField; code: "outOfRange"; min: number; max: number }
  | { field: "cycleLength"; code: "shortCycle" | "longCycle" }
  | { field: "periodLength"; code: "longPeriod" }
  | { field: "periodLength"; code: "overlapsOvulation"; ovulationDay: number };

export interface SettingsValidation {
  /** Blocking problems. */
  errors: SettingsIssue[];
  /** Informative clinical notes; saving is still allowed. */
  warnings: SettingsIssue[];
}

export function validateSettings(
  s: Pick<CycleSettings, "cycleLength" | "periodLength" | "lutealLength">
): SettingsValidation {
  const errors: SettingsIssue[] = [];
  const warnings: SettingsIssue[] = [];

  (Object.keys(CYCLE_LIMITS) as SettingsField[]).forEach((field) => {
    const { min, max } = CYCLE_LIMITS[field];
    const value = s[field];
    if (!Number.isFinite(value) || value < min || value > max) {
      errors.push({ field, code: "outOfRange", min, max });
    }
  });
  if (errors.length) return { errors, warnings };

  if (s.cycleLength < CLINICAL.normalCycleMin) {
    warnings.push({ field: "cycleLength", code: "shortCycle" });
  } else if (s.cycleLength > CLINICAL.normalCycleMax) {
    warnings.push({ field: "cycleLength", code: "longCycle" });
  }
  if (s.periodLength > CLINICAL.normalPeriodMax) {
    warnings.push({ field: "periodLength", code: "longPeriod" });
  }
  const ovulationDay = s.cycleLength - s.lutealLength;
  if (s.periodLength >= ovulationDay) {
    warnings.push({ field: "periodLength", code: "overlapsOvulation", ovulationDay });
  }
  return { errors, warnings };
}

export type PeriodDateIssue =
  | { code: "future" }
  | { code: "overlap"; other: ISODate }
  | { code: "tooClose"; other: ISODate; days: number };

export interface PeriodDateValidation {
  error: PeriodDateIssue | null;
  warning: PeriodDateIssue | null;
}

/**
 * Checks a new (or edited) period start against today and the other records.
 * - error: in the future, or inside the bleeding days of another period.
 * - warning: less than 15 days from another period (possible mid-cycle bleeding).
 */
export function validatePeriodStart(
  date: ISODate,
  periods: PeriodEntry[],
  today: ISODate,
  fallbackPeriodLength: number,
  excludeId?: string
): PeriodDateValidation {
  if (date > today) return { error: { code: "future" }, warning: null };

  let warning: PeriodDateIssue | null = null;
  for (const p of periods) {
    if (p.id === excludeId) continue;
    const distance = diffDays(date, p.startDate);
    const length = p.length ?? fallbackPeriodLength;
    const overlapsAfter = distance >= 0 && distance < Math.max(2, length);
    const overlapsBefore = distance < 0 && -distance < 2;
    if (overlapsAfter || overlapsBefore) {
      return { error: { code: "overlap", other: p.startDate }, warning: null };
    }
    if (Math.abs(distance) < VALID_INTERVAL.min && !warning) {
      warning = { code: "tooClose", other: p.startDate, days: Math.abs(distance) };
    }
  }
  return { error: null, warning };
}
