/**
 * Pure state transitions for the cycle data. The context wraps them with
 * React state; keeping them pure makes them easy to test.
 */
import { addDays, type ISODate } from "@/lib/dates";
import type { CycleData, CycleSettings, PeriodEntry } from "@/types/cycle";
import { isLogEmpty, type DailyLog } from "@/types/log";
import { computeStats, sortPeriods } from "./stats";
import { getCycleStatus } from "./timeline";

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface SetupInput {
  lastPeriodDate: ISODate;
  cycleLength: number;
  periodLength: number;
  lutealLength: number;
}

/** First-time setup: starts the history from the last period (logs are kept). */
export function completeSetup(data: CycleData, input: SetupInput): CycleData {
  return {
    ...data,
    periods: [{ id: newId(), startDate: input.lastPeriodDate, length: null }],
    settings: {
      ...data.settings,
      cycleLength: input.cycleLength,
      periodLength: input.periodLength,
      lutealLength: input.lutealLength,
    },
    autoCycleStarts: [],
    lateCycleStart: null,
  };
}

export function updateSettings(data: CycleData, patch: Partial<CycleSettings>): CycleData {
  return { ...data, settings: { ...data.settings, ...patch } };
}

function nextConfirmedAfter(periods: PeriodEntry[], date: ISODate): ISODate | null {
  return sortPeriods(periods).find((p) => p.startDate > date)?.startDate ?? null;
}

/**
 * Automatic starts chain from the previous confirmed period. When a confirmed
 * start appears at `date`, the automatic starts from half a cycle before it up
 * to the next confirmed period are replaced by it.
 */
function dropAutosReplacedBy(data: CycleData, date: ISODate): ISODate[] {
  const half = Math.floor(computeStats(data).cycleLength / 2);
  const from = addDays(date, -half);
  const until = nextConfirmedAfter(data.periods, date);
  return data.autoCycleStarts.filter((a) => !(a > from && (until === null || a < until)));
}

/** Removing a confirmed start invalidates the automatic starts that chained from it. */
function dropAutosChainedFrom(data: CycleData, date: ISODate): ISODate[] {
  const until = nextConfirmedAfter(data.periods, date);
  return data.autoCycleStarts.filter((a) => !(a > date && (until === null || a < until)));
}

/** Late mode only survives while its cycle start still exists and is the latest one. */
function withValidLateMode(data: CycleData): CycleData {
  const late = data.lateCycleStart;
  if (!late) return data;
  const sorted = sortPeriods(data.periods);
  const latest = sorted.length ? sorted[sorted.length - 1].startDate : null;
  const exists = sorted.some((p) => p.startDate === late) || data.autoCycleStarts.includes(late);
  return exists && latest !== null && late >= latest ? data : { ...data, lateCycleStart: null };
}

/** Adds a confirmed period start, replacing the automatic starts it supersedes. */
export function addPeriod(
  data: CycleData,
  startDate: ISODate,
  length: number | null = null,
  id: string = newId()
): CycleData {
  if (data.periods.some((p) => p.startDate === startDate)) return data;
  const withPeriod: CycleData = {
    ...data,
    periods: sortPeriods([...data.periods, { id, startDate, length }]),
  };
  return withValidLateMode({ ...withPeriod, autoCycleStarts: dropAutosReplacedBy(withPeriod, startDate) });
}

export function updatePeriod(
  data: CycleData,
  id: string,
  patch: Partial<Omit<PeriodEntry, "id">>
): CycleData {
  const current = data.periods.find((p) => p.id === id);
  if (!current) return data;
  const updated = { ...current, ...patch };
  if (updated.startDate === current.startDate) {
    return { ...data, periods: data.periods.map((p) => (p.id === id ? updated : p)) };
  }
  if (data.periods.some((p) => p.id !== id && p.startDate === updated.startDate)) return data;
  // A new date behaves like removing the old start and adding the new one.
  const without: CycleData = { ...data, periods: data.periods.filter((p) => p.id !== id) };
  const cleaned: CycleData = { ...without, autoCycleStarts: dropAutosChainedFrom(without, current.startDate) };
  return addPeriod(cleaned, updated.startDate, updated.length ?? null, id);
}

export function removePeriod(data: CycleData, id: string): CycleData {
  const entry = data.periods.find((p) => p.id === id);
  if (!entry || data.periods.length <= 1) return data;
  const without: CycleData = { ...data, periods: data.periods.filter((p) => p.id !== id) };
  return withValidLateMode({
    ...without,
    autoCycleStarts: dropAutosChainedFrom(without, entry.startDate),
  });
}

/** "It came on time": confirms the pending expected date. */
export function confirmOnTime(data: CycleData, today: ISODate): CycleData {
  const status = getCycleStatus(data, today);
  if (!status?.pendingExpected) return data;
  return addPeriod(data, status.pendingExpected);
}

/** "It was late": confirms the pending expected date plus `days`. */
export function confirmDelayed(data: CycleData, today: ISODate, days: number): CycleData {
  const status = getCycleStatus(data, today);
  if (!status?.pendingExpected) return data;
  const start = addDays(status.pendingExpected, Math.max(1, Math.round(days)));
  if (start > today) return data;
  return addPeriod(data, start);
}

/** "Not yet": keep counting the current cycle and show the delay. */
export function markNotArrived(data: CycleData, today: ISODate): CycleData {
  const status = getCycleStatus(data, today);
  if (!status?.pendingExpected) return data;
  return { ...data, lateCycleStart: status.anchorStart };
}

/** Accept the automatic cycles: they advance the calendar but don't count for averages. */
export function keepAutomatic(data: CycleData, today: ISODate): CycleData {
  const status = getCycleStatus(data, today);
  if (!status || status.state !== "awaiting") return data;
  return {
    ...data,
    autoCycleStarts: [...new Set([...data.autoCycleStarts, ...status.pendingAutoStarts])].sort(),
    lateCycleStart: null,
  };
}

export function exitLateMode(data: CycleData): CycleData {
  return { ...data, lateCycleStart: null };
}

export function saveLog(data: CycleData, log: DailyLog): CycleData {
  const logs = { ...data.logs };
  if (isLogEmpty(log)) delete logs[log.date];
  else logs[log.date] = log;
  return { ...data, logs };
}

export function removeLog(data: CycleData, date: ISODate): CycleData {
  if (!data.logs[date]) return data;
  const logs = { ...data.logs };
  delete logs[date];
  return { ...data, logs };
}
