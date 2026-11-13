/**
 * Validation of persisted data. Anything unexpected (old versions, manual
 * edits, corruption) falls back to safe defaults instead of crashing the app.
 */
import { isISODate, type ISODate } from "@/lib/dates";
import { CYCLE_DEFAULTS, CYCLE_LIMITS } from "@/lib/cycle/constants";
import type { CycleData, CycleSettings, PeriodEntry } from "@/types/cycle";
import {
  FLOW_LEVELS,
  LH_RESULTS,
  MEDICATIONS,
  MOODS,
  MUCUS_TYPES,
  SEX_TYPES,
  SYMPTOMS,
  isLogEmpty,
  type DailyLog,
} from "@/types/log";
import {
  ALERT_DAY_LIMITS,
  DEFAULT_PREFERENCES,
  type AlertSetting,
  type AlertType,
  type Preferences,
} from "@/types/preferences";

export const STORAGE_VERSION = 1;

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function intInRange(v: unknown, min: number, max: number, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max
    ? Math.round(v)
    : fallback;
}

function oneOf<T extends string>(v: unknown, options: readonly T[]): T | null {
  return typeof v === "string" && (options as readonly string[]).includes(v) ? (v as T) : null;
}

function manyOf<T extends string>(v: unknown, options: readonly T[]): T[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter((x): x is T => oneOf(x, options) !== null))];
}

export function createEmptyCycleData(): CycleData {
  return {
    periods: [],
    settings: { ...CYCLE_DEFAULTS },
    autoCycleStarts: [],
    lateCycleStart: null,
    logs: {},
  };
}

function sanitizeSettings(raw: unknown): CycleSettings {
  const s = isObj(raw) ? raw : {};
  return {
    cycleLength: intInRange(
      s.cycleLength,
      CYCLE_LIMITS.cycleLength.min,
      CYCLE_LIMITS.cycleLength.max,
      CYCLE_DEFAULTS.cycleLength
    ),
    periodLength: intInRange(
      s.periodLength,
      CYCLE_LIMITS.periodLength.min,
      CYCLE_LIMITS.periodLength.max,
      CYCLE_DEFAULTS.periodLength
    ),
    lutealLength: intInRange(
      s.lutealLength,
      CYCLE_LIMITS.lutealLength.min,
      CYCLE_LIMITS.lutealLength.max,
      CYCLE_DEFAULTS.lutealLength
    ),
    useHistoryAverage:
      typeof s.useHistoryAverage === "boolean"
        ? s.useHistoryAverage
        : CYCLE_DEFAULTS.useHistoryAverage,
  };
}

function sanitizePeriods(raw: unknown): PeriodEntry[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: PeriodEntry[] = [];
  for (const item of raw) {
    if (!isObj(item) || !isISODate(item.startDate) || seen.has(item.startDate)) continue;
    seen.add(item.startDate);
    out.push({
      id: typeof item.id === "string" && item.id ? item.id : `p-${item.startDate}`,
      startDate: item.startDate,
      length:
        typeof item.length === "number"
          ? intInRange(item.length, 1, CYCLE_LIMITS.periodLength.max + 5, 0) || null
          : null,
    });
  }
  return out.sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
}

export function sanitizeLog(raw: unknown, date: ISODate): DailyLog | null {
  if (!isObj(raw)) return null;
  const bbt =
    typeof raw.bbt === "number" && raw.bbt >= 34 && raw.bbt <= 40
      ? Math.round(raw.bbt * 100) / 100
      : null;
  const log: DailyLog = {
    date,
    flow: oneOf(raw.flow, FLOW_LEVELS),
    symptoms: manyOf(raw.symptoms, SYMPTOMS),
    moods: manyOf(raw.moods, MOODS),
    bbt,
    mucus: oneOf(raw.mucus, MUCUS_TYPES),
    lhTest: oneOf(raw.lhTest, LH_RESULTS),
    sex: oneOf(raw.sex, SEX_TYPES),
    medications: manyOf(raw.medications, MEDICATIONS),
    note: typeof raw.note === "string" ? raw.note.slice(0, 1000) : "",
  };
  return isLogEmpty(log) ? null : log;
}

function sanitizeLogs(raw: unknown): Record<ISODate, DailyLog> {
  if (!isObj(raw)) return {};
  const out: Record<ISODate, DailyLog> = {};
  for (const [date, value] of Object.entries(raw)) {
    if (!isISODate(date)) continue;
    const log = sanitizeLog(value, date);
    if (log) out[date] = log;
  }
  return out;
}

export function sanitizeCycleData(raw: unknown): CycleData {
  const d = isObj(raw) ? raw : {};
  return {
    periods: sanitizePeriods(d.periods),
    settings: sanitizeSettings(d.settings),
    autoCycleStarts: Array.isArray(d.autoCycleStarts)
      ? [...new Set(d.autoCycleStarts.filter(isISODate))].sort()
      : [],
    lateCycleStart: isISODate(d.lateCycleStart) ? d.lateCycleStart : null,
    logs: sanitizeLogs(d.logs),
  };
}

function sanitizeAlert(raw: unknown, type: AlertType): AlertSetting {
  const fallback = DEFAULT_PREFERENCES.notifications[type];
  const a = isObj(raw) ? raw : {};
  const { min, max } = ALERT_DAY_LIMITS[type];
  return {
    enabled: typeof a.enabled === "boolean" ? a.enabled : fallback.enabled,
    days: intInRange(a.days, min, max, fallback.days),
  };
}

export function sanitizePreferences(raw: unknown): Preferences {
  const p = isObj(raw) ? raw : {};
  const n = isObj(p.notifications) ? p.notifications : {};
  const d = DEFAULT_PREFERENCES;
  return {
    onboardingCompleted: p.onboardingCompleted === true,
    disclaimerAccepted: p.disclaimerAccepted === true,
    theme: oneOf(p.theme, ["light", "dark", "system"] as const) ?? d.theme,
    systemThemePromptDismissed: p.systemThemePromptDismissed === true,
    language: oneOf(p.language, ["system", "es", "en"] as const) ?? d.language,
    temperatureUnit: oneOf(p.temperatureUnit, ["C", "F"] as const) ?? d.temperatureUnit,
    notifications: {
      enabled: n.enabled === true,
      hour: intInRange(n.hour, 0, 23, d.notifications.hour),
      minute: intInRange(n.minute, 0, 59, d.notifications.minute),
      period: sanitizeAlert(n.period, "period"),
      fertile: sanitizeAlert(n.fertile, "fertile"),
      phase: sanitizeAlert(n.phase, "phase"),
      late: sanitizeAlert(n.late, "late"),
    },
  };
}

/** Unwraps `{ version, data }`; future migrations go here. */
export function unwrap(raw: unknown): unknown {
  if (isObj(raw) && typeof raw.version === "number" && "data" in raw) return raw.data;
  return raw;
}
