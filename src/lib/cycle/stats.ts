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
  let count = 0;
  let day = entry.startDate;
  while (isBleeding(logs[day]?.flow) && count < 15) {
    count++;
    day = addDays(day, 1);
  }
  return count > 0 ? count : null;
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

export function computeStats(data: CycleData): CycleStats {
  const { settings, logs } = data;
  const intervals = getIntervals(data);
  const valid = intervals.filter((i) => i.valid);
  const recent = valid.slice(-HISTORY_WINDOW).map((i) => i.length);

  const useCycleHistory =
    settings.useHistoryAverage && recent.length >= MIN_CYCLES_FOR_AVERAGE;

  const sorted = sortPeriods(data.periods);
  const periodLengths = sorted
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
