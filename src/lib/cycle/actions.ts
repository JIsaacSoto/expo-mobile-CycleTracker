/**
 * Pure state transitions for the cycle data. The context wraps them with
 * React state; keeping them pure makes them easy to test.
 */
import { addDays, diffDays, type ISODate } from "@/lib/dates";
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
    lateExpected: null,
  };
}

export function updateSettings(data: CycleData, patch: Partial<CycleSettings>): CycleData {
  return { ...data, settings: { ...data.settings, ...patch } };
}

/**
 * Adds a confirmed period start. Automatic starts close to it are replaced,
 * and late mode ends when the new start belongs to the current cycle.
 */
export function addPeriod(
  data: CycleData,
  startDate: ISODate,
  length: number | null = null,
  id: string = newId()
): CycleData {
  if (data.periods.some((p) => p.startDate === startDate)) return data;
  const half = Math.floor(computeStats(data).cycleLength / 2);
  const sorted = sortPeriods(data.periods);
  const latest = sorted.length ? sorted[sorted.length - 1].startDate : null;
  return {
    ...data,
    periods: sortPeriods([...data.periods, { id, startDate, length }]),
    autoCycleStarts: data.autoCycleStarts.filter(
      (a) => Math.abs(diffDays(a, startDate)) >= half
    ),
    lateExpected: !latest || startDate > latest ? null : data.lateExpected,
  };
}

export function updatePeriod(
  data: CycleData,
  id: string,
  patch: Partial<Omit<PeriodEntry, "id">>
): CycleData {
  return {
    ...data,
    periods: sortPeriods(data.periods.map((p) => (p.id === id ? { ...p, ...patch } : p))),
  };
}

export function removePeriod(data: CycleData, id: string): CycleData {
  if (data.periods.length <= 1) return data;
  return { ...data, periods: data.periods.filter((p) => p.id !== id) };
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
  return { ...data, lateExpected: status.pendingExpected };
}

/** Accept the automatic cycles: they advance the calendar but don't count for averages. */
export function keepAutomatic(data: CycleData, today: ISODate): CycleData {
  const status = getCycleStatus(data, today);
  if (!status || status.state !== "awaiting") return data;
  return {
    ...data,
    autoCycleStarts: [...new Set([...data.autoCycleStarts, ...status.pendingAutoStarts])].sort(),
    lateExpected: null,
  };
}

export function exitLateMode(data: CycleData): CycleData {
  return { ...data, lateExpected: null };
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
