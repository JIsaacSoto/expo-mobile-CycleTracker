import { addDays, diffDays, type ISODate } from "@/lib/dates";
import type { CycleData, CycleStats, PeriodEntry } from "@/types/cycle";
import { isBleeding, type DailyLog } from "@/types/log";
import {
  CLINICAL,
  HISTORY_WINDOW,
  MIN_CYCLES_FOR_AVERAGE,
  MIN_CYCLES_FOR_REGULARITY,
  VALID_INTERVAL,
} from "./constants";
import { detectOvulation } from "./signs";

export function sortPeriods(periods: PeriodEntry[]): PeriodEntry[] {
  return [...periods].sort((a, b) =>
    a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0
  );
}

interface BleedingRun {
  length: number;
  lastDay: ISODate;
}

/** Consecutive light/medium/heavy flow days logged from the period start. */
function bleedingRun(entry: PeriodEntry, logs: Record<ISODate, DailyLog>): BleedingRun | null {
  let count = 0;
  let day = entry.startDate;
  let lastDay: ISODate | null = null;
  while (isBleeding(logs[day]?.flow) && count < 15) {
    count++;
    lastDay = day;
    day = addDays(day, 1);
  }
  return lastDay ? { length: count, lastDay } : null;
}

/**
 * Bleeding days of a recorded period: the explicit length if the user set one,
 * otherwise the consecutive days with light/medium/heavy flow logged from the start.
 * Null when unknown.
 */
export function recordedPeriodLength(
  entry: PeriodEntry,
  logs: Record<ISODate, DailyLog>
): number | null {
  if (entry.length && entry.length > 0) return entry.length;
  return bleedingRun(entry, logs)?.length ?? null;
}

/**
 * A period may still be in progress when its logged bleeding reaches today or
 * yesterday (today may not be logged yet) and no explicit length was set.
 */
export function isPeriodInProgress(
  entry: PeriodEntry,
  logs: Record<ISODate, DailyLog>,
  today: ISODate
): boolean {
  if (entry.length && entry.length > 0) return false;
  const run = bleedingRun(entry, logs);
  if (!run) return entry.startDate >= addDays(today, -1);
  return run.lastDay >= addDays(today, -1);
}

/** Bleeding days to use for a period: an ongoing period is never shorter than the average. */
export function effectivePeriodLength(
  entry: PeriodEntry,
  logs: Record<ISODate, DailyLog>,
  today: ISODate,
  fallback: number
): number {
  const recorded = recordedPeriodLength(entry, logs);
  if (recorded === null) return fallback;
  return isPeriodInProgress(entry, logs, today) ? Math.max(recorded, fallback) : recorded;
}

export interface CycleInterval {
  start: ISODate;
  nextStart: ISODate;
  length: number;
  valid: boolean;
  reason?: "automatic" | "outOfRange";
}

/** Intervals between consecutive confirmed period starts. */
export function getIntervals(data: Pick<CycleData, "periods" | "autoCycleStarts">): CycleInterval[] {
  const sorted = sortPeriods(data.periods);
  const out: CycleInterval[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const start = sorted[i - 1].startDate;
    const nextStart = sorted[i].startDate;
    const length = diffDays(nextStart, start);
    const containsAuto = data.autoCycleStarts.some(
      (a) => a > start && a < nextStart
    );
    const inRange = length >= VALID_INTERVAL.min && length <= VALID_INTERVAL.max;
    out.push({
      start,
      nextStart,
      length,
      valid: !containsAuto && inRange,
      reason: containsAuto ? "automatic" : inRange ? undefined : "outOfRange",
    });
  }
  return out;
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Averages and regularity. With `today`, a period still in progress is left
 * out of the period-length average.
 */
export function computeStats(data: CycleData, today?: ISODate): CycleStats {
  const { settings, logs } = data;
  const intervals = getIntervals(data);
  const valid = intervals.filter((i) => i.valid);
  const recent = valid.slice(-HISTORY_WINDOW).map((i) => i.length);

  const useCycleHistory =
    settings.useHistoryAverage && recent.length >= MIN_CYCLES_FOR_AVERAGE;

  const sorted = sortPeriods(data.periods);
  const periodLengths = sorted
    .filter((p) => !today || !isPeriodInProgress(p, logs, today))
    .map((p) => recordedPeriodLength(p, logs))
    .filter((n): n is number => n !== null)
    .slice(-HISTORY_WINDOW);
  const usePeriodHistory =
    settings.useHistoryAverage && periodLengths.length >= MIN_CYCLES_FOR_AVERAGE;

  const shortest = recent.length ? Math.min(...recent) : null;
  const longest = recent.length ? Math.max(...recent) : null;
  const variation =
    shortest !== null && longest !== null && recent.length >= 2
      ? longest - shortest
      : null;

  // Luteal phase measured from cycles where ovulation was detected (LH/BBT).
  const luteals: number[] = [];
  for (const interval of valid) {
    const detected = detectOvulation(logs, interval.start, addDays(interval.nextStart, -1));
    if (!detected) continue;
    const luteal = diffDays(interval.nextStart, detected.date) - 1;
    if (luteal >= 7 && luteal <= 20) luteals.push(luteal);
  }

  return {
    cycleLength: useCycleHistory ? Math.round(mean(recent)) : settings.cycleLength,
    periodLength: usePeriodHistory
      ? Math.round(mean(periodLengths))
      : settings.periodLength,
    lutealLength: settings.lutealLength,
    cycleLengthSource: useCycleHistory ? "history" : "settings",
    periodLengthSource: usePeriodHistory ? "history" : "settings",
    cycleLengths: recent,
    recordedCycles: intervals.length,
    shortestCycle: shortest,
    longestCycle: longest,
    variation,
    isRegular:
      recent.length >= MIN_CYCLES_FOR_REGULARITY && variation !== null
        ? variation <= CLINICAL.regularVariationMax
        : null,
    measuredLutealLength: luteals.length
      ? Math.round(mean(luteals.slice(-HISTORY_WINDOW)))
      : null,
  };
}
