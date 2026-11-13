import { addDays, diffDays, type ISODate } from "@/lib/dates";
import type { DailyLog } from "@/types/log";
import type { OvulationSource } from "@/types/cycle";
import { MIN_DETECTED_OVULATION_DAY } from "./constants";

export interface DetectedOvulation {
  date: ISODate;
  source: Exclude<OvulationSource, "estimated">;
}

/** Minimum rise of the third high temperature over the coverline (°C). */
const BBT_MIN_RISE = 0.2;

function logsBetween(
  logs: Record<ISODate, DailyLog>,
  from: ISODate,
  to: ISODate
): DailyLog[] {
  return Object.values(logs)
    .filter((l) => l.date >= from && l.date <= to)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/**
 * First positive LH test → ovulation is expected about 24–36 h after the surge,
 * so the following day is used.
 */
function detectFromLh(logs: DailyLog[], cycleStart: ISODate): ISODate | null {
  for (const log of logs) {
    if (log.lhTest !== "positive") continue;
    const ovulation = addDays(log.date, 1);
    if (diffDays(ovulation, cycleStart) + 1 >= MIN_DETECTED_OVULATION_DAY) {
      return ovulation;
    }
  }
  return null;
}

/**
 * "3 over 6" rule: three consecutive daily temperatures above the highest of the
 * previous six readings (coverline), the third at least 0.2 °C above it.
 * Ovulation is placed on the day before the first high temperature.
 */
function detectFromBbt(logs: DailyLog[], cycleStart: ISODate): ISODate | null {
  const readings = logs.filter(
    (l): l is DailyLog & { bbt: number } => typeof l.bbt === "number"
  );
  for (let i = 6; i + 2 < readings.length; i++) {
    const highs = readings.slice(i, i + 3);
    const consecutive =
      diffDays(highs[1].date, highs[0].date) === 1 &&
      diffDays(highs[2].date, highs[1].date) === 1;
    if (!consecutive) continue;
    const coverline = Math.max(...readings.slice(i - 6, i).map((r) => r.bbt));
    const allAbove = highs.every((h) => h.bbt > coverline);
    const thirdRise = highs[2].bbt - coverline >= BBT_MIN_RISE - 1e-9;
    if (allAbove && thirdRise) {
      const ovulation = addDays(highs[0].date, -1);
      if (diffDays(ovulation, cycleStart) + 1 >= MIN_DETECTED_OVULATION_DAY) {
        return ovulation;
      }
    }
  }
  return null;
}

/**
 * Ovulation detected from fertility signs logged between `from` (cycle start)
 * and `to`. LH tests take priority over temperature because they anticipate
 * ovulation instead of confirming it afterwards.
 */
export function detectOvulation(
  logs: Record<ISODate, DailyLog>,
  from: ISODate,
  to: ISODate
): DetectedOvulation | null {
  if (to < from) return null;
  const inRange = logsBetween(logs, from, to);
  const lh = detectFromLh(inRange, from);
  if (lh) return { date: lh, source: "lh" };
  const bbt = detectFromBbt(inRange, from);
  if (bbt) return { date: bbt, source: "bbt" };
  return null;
}
