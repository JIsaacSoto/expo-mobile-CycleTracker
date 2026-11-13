import type { CycleSettings } from "@/types/cycle";

/** Values used when the user does not know them (population averages). */
export const CYCLE_DEFAULTS: CycleSettings = {
  cycleLength: 28,
  periodLength: 5,
  lutealLength: 14,
  useHistoryAverage: true,
};

/** Values accepted by the forms. */
export const CYCLE_LIMITS = {
  cycleLength: { min: 21, max: 45 },
  periodLength: { min: 1, max: 10 },
  lutealLength: { min: 10, max: 16 },
} as const;

/**
 * Clinical reference ranges (FIGO 2018 normal-AUB system, ACOG).
 * Outside them the app shows an informative warning, never a diagnosis.
 */
export const CLINICAL = {
  normalCycleMin: 24,
  normalCycleMax: 38,
  normalPeriodMax: 8,
  /** Shortest vs longest cycle. Larger variation = irregular. */
  regularVariationMax: 7,
  /** Days without a period after which medical advice is suggested. */
  amenorrheaDays: 90,
} as const;

/** Fertile window: 5 days before ovulation + ovulation day + 1 day after (egg lifespan). */
export const FERTILE_DAYS_BEFORE = 5;
export const FERTILE_DAYS_AFTER = 1;

/** Number of recent cycles used for averages. */
export const HISTORY_WINDOW = 6;
/** Minimum valid cycles before the history replaces the declared values. */
export const MIN_CYCLES_FOR_AVERAGE = 2;
/** Minimum valid cycles to judge regularity. */
export const MIN_CYCLES_FOR_REGULARITY = 3;

/** Intervals outside this range are treated as logging gaps or errors. */
export const VALID_INTERVAL = { min: 15, max: 90 } as const;

/** Earliest cycle day accepted for a detected ovulation (filters early false LH positives). */
export const MIN_DETECTED_OVULATION_DAY = 7;

/** Days of predictions generated ahead of today. */
export const PREDICTION_HORIZON_DAYS = 400;
