import { addDays, diffDays, eachDay, minISO, type ISODate } from "@/lib/dates";
import type {
  CycleData,
  CycleInstance,
  CycleKind,
  CycleState,
  CycleStats,
  CycleStatus,
  DayInfo,
  UpcomingEvent,
} from "@/types/cycle";
import { PREDICTION_HORIZON_DAYS, VALID_INTERVAL } from "./constants";
import { fertilityForDay, getCycleLayout, phaseForDay } from "./layout";
import { detectOvulation, type DetectedOvulation } from "./signs";
import { computeStats, effectivePeriodLength, recordedPeriodLength, sortPeriods } from "./stats";

interface BuildOptions {
  start: ISODate;
  length: number;
  periodLength: number;
  lutealLength: number;
  kind: CycleKind;
  confirmed: boolean;
  detected?: DetectedOvulation | null;
}

function buildCycle(o: BuildOptions): CycleInstance {
  const override = o.detected ? diffDays(o.detected.date, o.start) + 1 : null;
  const layout = getCycleLayout(o.length, o.periodLength, o.lutealLength, override);
  const length = layout.cycleLength;
  const periodLength = Math.max(1, Math.min(Math.round(o.periodLength), length));
  const ovulation = addDays(o.start, layout.ovulationDay - 1);
  return {
    start: o.start,
    length,
    end: addDays(o.start, length - 1),
    periodLength,
    periodEnd: addDays(o.start, periodLength - 1),
    ovulation,
    fertileStart: addDays(o.start, layout.fertileStartDay - 1),
    fertileEnd: addDays(o.start, layout.fertileEndDay - 1),
    kind: o.kind,
    confirmed: o.confirmed,
    ovulationSource:
      o.detected && o.detected.date === ovulation ? o.detected.source : "estimated",
    layout,
  };
}

function uniqueSorted(dates: ISODate[]): ISODate[] {
  return [...new Set(dates)].sort();
}

/** Length of a cycle whose ovulation was detected: ovulation day + luteal phase. */
function lengthFromDetection(
  start: ISODate,
  detected: DetectedOvulation | null,
  fallback: number,
  lutealLength: number
): number {
  if (!detected) return fallback;
  return diffDays(detected.date, start) + 1 + lutealLength;
}

interface Resolution {
  stats: CycleStats;
  state: CycleState;
  /** Last confirmed or auto-accepted start on or before today. */
  anchor: ISODate;
  anchorCycle: CycleInstance;
  /** Automatic starts between the first pending expected date and today. */
  pendingAutoStarts: ISODate[];
  pendingExpected: ISODate | null;
  current: CycleInstance;
}

function resolve(data: CycleData, today: ISODate): Resolution | null {
  const sorted = sortPeriods(data.periods);
  if (!sorted.length) return null;

  const stats = computeStats(data, today);
  const { cycleLength: L, periodLength: P, lutealLength: luteal } = stats;
  const last = sorted[sorted.length - 1];

  const autos = uniqueSorted(data.autoCycleStarts).filter(
    (a) => a > last.startDate && a <= today
  );
  const anchor = autos.length ? autos[autos.length - 1] : last.startDate;
  const anchorConfirmed = autos.length === 0;
  const anchorPeriod = anchorConfirmed ? effectivePeriodLength(last, data.logs, today, P) : P;
  // Late mode belongs to the cycle the user marked as "not arrived yet".
  const lateMode = data.lateCycleStart === anchor;

  // Fertility signs after the expected end belong to the next (automatic) cycle,
  // unless the user said the period has not arrived yet.
  const detectUntil = lateMode ? today : minISO(today, addDays(anchor, L - 1));
  const anchorDetected = detectOvulation(data.logs, anchor, detectUntil);
  const anchorLength = lengthFromDetection(anchor, anchorDetected, L, luteal);
  const expected = addDays(anchor, anchorLength);

  const anchorCycle = buildCycle({
    start: anchor,
    length: anchorLength,
    periodLength: anchorPeriod,
    lutealLength: luteal,
    kind: "current",
    confirmed: anchorConfirmed,
    detected: anchorDetected,
  });

  if (today < expected) {
    return {
      stats,
      state: "normal",
      anchor,
      anchorCycle,
      pendingAutoStarts: [],
      pendingExpected: null,
      current: anchorCycle,
    };
  }

  if (lateMode) {
    // The cycle keeps growing until the user confirms the period.
    const extended = diffDays(today, anchor) + 1;
    const current: CycleInstance = {
      ...anchorCycle,
      length: extended,
      end: today,
    };
    return {
      stats,
      state: "late",
      anchor,
      anchorCycle: current,
      pendingAutoStarts: [],
      pendingExpected: expected,
      current,
    };
  }

  // Auto-advance: assume the period came as expected (unconfirmed).
  const pending: ISODate[] = [expected];
  let start = expected;
  while (addDays(start, L) <= today) {
    start = addDays(start, L);
    pending.push(start);
  }
  const detected = detectOvulation(data.logs, start, today);
  const length = Math.max(
    lengthFromDetection(start, detected, L, luteal),
    diffDays(today, start) + 1
  );
  const current = buildCycle({
    start,
    length,
    periodLength: P,
    lutealLength: luteal,
    kind: "current",
    confirmed: false,
    detected,
  });

  return {
    stats,
    state: "awaiting",
    anchor,
    anchorCycle: { ...anchorCycle, kind: "past" },
    pendingAutoStarts: pending,
    pendingExpected: expected,
    current,
  };
}

/** All cycles: recorded past cycles, the current one and predictions up to the horizon. */
function timelineFrom(
  data: CycleData,
  today: ISODate,
  r: Resolution,
  horizonDays: number
): CycleInstance[] {
  const { cycleLength: L, periodLength: P, lutealLength: luteal } = r.stats;
  const sorted = sortPeriods(data.periods);
  const confirmed = new Map(sorted.map((p) => [p.startDate, p]));
  const first = sorted[0].startDate;

  // Automatic starts too close to a confirmed one would create overlapping cycles.
  const autos = data.autoCycleStarts.filter(
    (a) => a > first && sorted.every((p) => Math.abs(diffDays(a, p.startDate)) >= VALID_INTERVAL.min)
  );
  const starts = uniqueSorted([...sorted.map((p) => p.startDate), ...autos]).filter(
    (s) => s < r.anchor
  );
  starts.push(r.anchor);

  const cycles: CycleInstance[] = [];
  for (let i = 0; i < starts.length - 1; i++) {
    const start = starts[i];
    const next = starts[i + 1];
    const entry = confirmed.get(start);
    cycles.push(
      buildCycle({
        start,
        length: diffDays(next, start),
        periodLength: entry ? recordedPeriodLength(entry, data.logs) ?? P : P,
        lutealLength: luteal,
        kind: "past",
        confirmed: !!entry,
        detected: detectOvulation(data.logs, start, addDays(next, -1)),
      })
    );
  }

  if (r.state === "awaiting") {
    cycles.push(r.anchorCycle);
    for (let i = 0; i < r.pendingAutoStarts.length - 1; i++) {
      cycles.push(
        buildCycle({
          start: r.pendingAutoStarts[i],
          length: diffDays(r.pendingAutoStarts[i + 1], r.pendingAutoStarts[i]),
          periodLength: P,
          lutealLength: luteal,
          kind: "past",
          confirmed: false,
        })
      );
    }
  }
  cycles.push(r.current);

  const horizon = addDays(today, horizonDays);
  let next =
    r.state === "late" ? addDays(today, 1) : addDays(r.current.start, r.current.length);
  while (next <= horizon) {
    cycles.push(
      buildCycle({
        start: next,
        length: L,
        periodLength: P,
        lutealLength: luteal,
        kind: "future",
        confirmed: false,
      })
    );
    next = addDays(next, L);
  }
  return cycles;
}

export function getCycleTimeline(
  data: CycleData,
  today: ISODate,
  horizonDays: number = PREDICTION_HORIZON_DAYS
): CycleInstance[] {
  const r = resolve(data, today);
  return r ? timelineFrom(data, today, r, horizonDays) : [];
}

export function findCycle(
  timeline: CycleInstance[],
  date: ISODate
): CycleInstance | null {
  for (const cycle of timeline) {
    if (date >= cycle.start && date <= cycle.end) return cycle;
  }
  return null;
}

export function getDayInfo(timeline: CycleInstance[], date: ISODate): DayInfo {
  const cycle = findCycle(timeline, date);
  if (!cycle) {
    return {
      date,
      cycle: null,
      cycleDay: null,
      phase: null,
      isPeriod: false,
      isPredictedPeriod: false,
      isFertile: false,
      isOvulation: false,
      fertility: null,
      isPeriodStart: false,
    };
  }
  const day = diffDays(date, cycle.start) + 1;
  const beyondExpected = day > cycle.layout.cycleLength;
  const isPeriod = day <= cycle.periodLength;
  const isFertile =
    !beyondExpected &&
    day >= cycle.layout.fertileStartDay &&
    day <= cycle.layout.fertileEndDay;
  return {
    date,
    cycle,
    cycleDay: day,
    phase: phaseForDay(cycle.layout, day),
    isPeriod,
    isPredictedPeriod: isPeriod && (cycle.kind === "future" || !cycle.confirmed),
    isFertile,
    isOvulation: !beyondExpected && day === cycle.layout.ovulationDay,
    fertility: beyondExpected ? null : fertilityForDay(cycle.layout, day),
    isPeriodStart: day === 1,
  };
}

export function getDayInfoRange(
  timeline: CycleInstance[],
  from: ISODate,
  to: ISODate
): Record<ISODate, DayInfo> {
  const out: Record<ISODate, DayInfo> = {};
  for (const date of eachDay(from, to)) out[date] = getDayInfo(timeline, date);
  return out;
}

export function getUpcomingEvents(
  timeline: CycleInstance[],
  today: ISODate,
  untilDays = 120
): UpcomingEvent[] {
  const limit = addDays(today, untilDays);
  const events: UpcomingEvent[] = [];
  const push = (type: UpcomingEvent["type"], date: ISODate) => {
    if (date >= today && date <= limit) {
      events.push({ type, date, daysAway: diffDays(date, today) });
    }
  };
  for (const cycle of timeline) {
    if (cycle.kind === "past") continue;
    if (cycle.kind === "future") push("periodStart", cycle.start);
    push("periodEnd", cycle.periodEnd);
    const follicular = cycle.layout.phases.find((p) => p.phase === "follicular");
    if (follicular) push("follicularStart", addDays(cycle.start, follicular.startDay - 1));
    push("fertileStart", cycle.fertileStart);
    push("ovulation", cycle.ovulation);
    if (cycle.layout.ovulationDay < cycle.layout.cycleLength) {
      push("lutealStart", addDays(cycle.ovulation, 1));
    }
  }
  return events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export function getCycleStatus(data: CycleData, today: ISODate): CycleStatus | null {
  const r = resolve(data, today);
  if (!r) return null;
  const timeline = timelineFrom(data, today, r, 120);
  const cur = r.current;
  const cycleDay = diffDays(today, cur.start) + 1;
  const late = r.state === "late";
  const layout = cur.layout;

  const nextPeriod = late
    ? (r.pendingExpected as ISODate)
    : addDays(cur.start, cur.length);

  return {
    today,
    state: r.state,
    current: cur,
    cycleDay,
    phase: phaseForDay(layout, cycleDay),
    isPeriodDay: !late && cycleDay <= cur.periodLength,
    isFertileDay:
      !late && cycleDay >= layout.fertileStartDay && cycleDay <= layout.fertileEndDay,
    isOvulationDay: !late && cycleDay === layout.ovulationDay,
    fertility: late ? null : fertilityForDay(layout, cycleDay),
    nextPeriod,
    daysUntilNextPeriod: diffDays(nextPeriod, today),
    anchorStart: r.anchor,
    pendingExpected: r.pendingExpected,
    pendingAutoStarts: r.pendingAutoStarts,
    lateDays: r.pendingExpected ? Math.max(0, diffDays(today, r.pendingExpected)) : 0,
    upcoming: getUpcomingEvents(timeline, today).filter(
      (e) => !(late && e.type === "periodStart")
    ),
    stats: r.stats,
  };
}
