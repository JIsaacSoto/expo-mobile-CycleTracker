import type { ISODate } from "@/lib/dates";
import type { DailyLog } from "./log";

export type { ISODate };

/** A period start confirmed by the user. */
export interface PeriodEntry {
  id: string;
  startDate: ISODate;
  /** Bleeding days, when the user set it explicitly. Otherwise derived from flow logs or settings. */
  length?: number | null;
}

export interface CycleSettings {
  /** Cycle length declared by the user (used until there is enough history). */
  cycleLength: number;
  /** Period length declared by the user. */
  periodLength: number;
  /** Days from ovulation to the next period. Clinical default: 14. */
  lutealLength: number;
  /** Use the average of recorded cycles instead of the declared values. */
  useHistoryAverage: boolean;
}

/** Everything persisted about the cycle. */
export interface CycleData {
  periods: PeriodEntry[];
  settings: CycleSettings;
  /**
   * Expected period starts that the user chose to keep as automatic
   * (not confirmed). They advance the cycle but never count for averages.
   */
  autoCycleStarts: ISODate[];
  /** Start of the cycle whose period the user marked as "not arrived yet" (late mode). */
  lateCycleStart: ISODate | null;
  logs: Record<ISODate, DailyLog>;
}

export type Phase = "menstrual" | "follicular" | "ovulation" | "luteal";

export type FertilityLevel = "low" | "medium" | "high";

export type OvulationSource = "estimated" | "lh" | "bbt";

export interface PhaseSegment {
  phase: Phase;
  /** 1-based cycle day (inclusive). */
  startDay: number;
  endDay: number;
}

export interface CycleLayout {
  cycleLength: number;
  periodLength: number;
  lutealLength: number;
  ovulationDay: number;
  fertileStartDay: number;
  fertileEndDay: number;
  phases: PhaseSegment[];
}

export type CycleKind = "past" | "current" | "future";

export interface CycleInstance {
  start: ISODate;
  /** Days from this start to the next start. */
  length: number;
  /** Last day of the cycle. */
  end: ISODate;
  periodLength: number;
  periodEnd: ISODate;
  ovulation: ISODate;
  fertileStart: ISODate;
  fertileEnd: ISODate;
  kind: CycleKind;
  /** The start date was confirmed by the user. */
  confirmed: boolean;
  ovulationSource: OvulationSource;
  layout: CycleLayout;
}

export type CycleState = "normal" | "awaiting" | "late";

export type UpcomingEventType =
  | "periodStart"
  | "periodEnd"
  | "fertileStart"
  | "ovulation"
  | "follicularStart"
  | "lutealStart";

export interface UpcomingEvent {
  type: UpcomingEventType;
  date: ISODate;
  daysAway: number;
}

export interface CycleStats {
  cycleLength: number;
  periodLength: number;
  lutealLength: number;
  cycleLengthSource: "history" | "settings";
  periodLengthSource: "history" | "settings";
  /** Valid cycle lengths used for the average (most recent last). */
  cycleLengths: number[];
  /** Number of recorded intervals (valid or not). */
  recordedCycles: number;
  shortestCycle: number | null;
  longestCycle: number | null;
  /** Longest minus shortest of the valid cycles. */
  variation: number | null;
  /** FIGO: variation of 7 days or less. Null when not enough data. */
  isRegular: boolean | null;
  /** Average luteal phase measured from LH/BBT-detected ovulations. */
  measuredLutealLength: number | null;
}

export interface CycleStatus {
  today: ISODate;
  state: CycleState;
  current: CycleInstance;
  cycleDay: number;
  /** Phase for today; in late mode, the cycle is past its expected length. */
  phase: Phase;
  isPeriodDay: boolean;
  isFertileDay: boolean;
  isOvulationDay: boolean;
  /** Null when it cannot be estimated (late period: ovulation may have been delayed). */
  fertility: FertilityLevel | null;
  nextPeriod: ISODate;
  daysUntilNextPeriod: number;
  /** Last confirmed or accepted-automatic start (the cycle being counted). */
  anchorStart: ISODate;
  /** Expected start waiting for confirmation (awaiting/late). */
  pendingExpected: ISODate | null;
  /** Automatic cycle starts between the pending date and today (awaiting). */
  pendingAutoStarts: ISODate[];
  lateDays: number;
  upcoming: UpcomingEvent[];
  stats: CycleStats;
}

export interface DayInfo {
  date: ISODate;
  cycle: CycleInstance | null;
  cycleDay: number | null;
  phase: Phase | null;
  isPeriod: boolean;
  /** Period day that comes from a prediction or an unconfirmed cycle. */
  isPredictedPeriod: boolean;
  isFertile: boolean;
  isOvulation: boolean;
  fertility: FertilityLevel | null;
  isPeriodStart: boolean;
}
