import type {
  CycleLayout,
  FertilityLevel,
  Phase,
  PhaseSegment,
} from "@/types/cycle";
import { FERTILE_DAYS_AFTER, FERTILE_DAYS_BEFORE } from "./constants";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Splits a cycle into its phases. Cycle day 1 is the first day of bleeding.
 *
 * - Ovulation day = cycle length − luteal length (28 − 14 → day 14),
 *   unless an ovulation detected from LH/BBT logs is provided.
 * - Menstrual: days 1..period length.
 * - Follicular (post-menstrual): until the day before ovulation.
 * - Ovulation: the estimated ovulation day.
 * - Luteal: from the day after ovulation to the end of the cycle.
 * - Fertile window: 5 days before ovulation to 1 day after (Wilcox et al., NEJM 1995).
 *
 * Segments are contiguous, never negative and always add up to the cycle length.
 */
export function getCycleLayout(
  cycleLength: number,
  periodLength: number,
  lutealLength: number,
  ovulationDayOverride?: number | null
): CycleLayout {
  const length = Math.max(3, Math.round(cycleLength));
  const ovulationDay = clamp(
    Math.round(ovulationDayOverride ?? length - lutealLength),
    2,
    length - 1
  );
  const menstrualEnd = clamp(Math.round(periodLength), 1, ovulationDay - 1);

  const phases: PhaseSegment[] = [
    { phase: "menstrual", startDay: 1, endDay: menstrualEnd },
  ];
  if (ovulationDay - 1 > menstrualEnd) {
    phases.push({
      phase: "follicular",
      startDay: menstrualEnd + 1,
      endDay: ovulationDay - 1,
    });
  }
  phases.push({ phase: "ovulation", startDay: ovulationDay, endDay: ovulationDay });
  phases.push({ phase: "luteal", startDay: ovulationDay + 1, endDay: length });

  return {
    cycleLength: length,
    periodLength: menstrualEnd,
    lutealLength: length - ovulationDay,
    ovulationDay,
    fertileStartDay: Math.max(1, ovulationDay - FERTILE_DAYS_BEFORE),
    fertileEndDay: Math.min(length, ovulationDay + FERTILE_DAYS_AFTER),
    phases,
  };
}

/** Phase of a 1-based cycle day. Days past the expected length stay luteal (late period). */
export function phaseForDay(layout: CycleLayout, day: number): Phase {
  if (day > layout.cycleLength) return "luteal";
  const segment = layout.phases.find(
    (s) => day >= s.startDay && day <= s.endDay
  );
  return segment?.phase ?? "menstrual";
}

/**
 * Qualitative chance of conception for a cycle day, relative to the
 * estimated ovulation (Wilcox 1995; Dunson 2002):
 * - high: the 2 days before ovulation and ovulation day (~25–33 % per cycle).
 * - medium: 3–5 days before, and the day after (sperm/egg survival, estimate error).
 * - low: the rest of the cycle (never zero).
 */
export function fertilityForDay(layout: CycleLayout, day: number): FertilityLevel {
  const rel = day - layout.ovulationDay;
  if (rel >= -2 && rel <= 0) return "high";
  if (rel >= -FERTILE_DAYS_BEFORE && rel <= FERTILE_DAYS_AFTER) return "medium";
  return "low";
}
