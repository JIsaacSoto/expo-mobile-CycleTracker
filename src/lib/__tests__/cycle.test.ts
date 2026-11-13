import { addDays, diffDays, type ISODate } from "@/lib/dates";
import {
  CYCLE_DEFAULTS,
  computeStats,
  detectOvulation,
  fertilityForDay,
  getCycleLayout,
  getCycleStatus,
  getCycleTimeline,
  getDayInfo,
  getIntervals,
  phaseForDay,
  validatePeriodStart,
  validateSettings,
} from "@/lib/cycle";
import type { CycleData, CycleSettings, PeriodEntry } from "@/types/cycle";
import type { DailyLog } from "@/types/log";

let idCounter = 0;
function period(startDate: ISODate, length?: number): PeriodEntry {
  idCounter += 1;
  return { id: `p${idCounter}`, startDate, length };
}

function data(partial: Partial<CycleData> & { settings?: Partial<CycleSettings> } = {}): CycleData {
  return {
    periods: partial.periods ?? [],
    settings: { ...CYCLE_DEFAULTS, ...partial.settings },
    autoCycleStarts: partial.autoCycleStarts ?? [],
    lateExpected: partial.lateExpected ?? null,
    logs: partial.logs ?? {},
  };
}

function logs(entries: DailyLog[]): Record<ISODate, DailyLog> {
  return Object.fromEntries(entries.map((l) => [l.date, l]));
}

describe("getCycleLayout", () => {
  it("builds the standard 28-day cycle (ovulation on day 14)", () => {
    const layout = getCycleLayout(28, 5, 14);
    expect(layout.ovulationDay).toBe(14);
    expect(layout.fertileStartDay).toBe(9);
    expect(layout.fertileEndDay).toBe(15);
    expect(layout.phases).toEqual([
      { phase: "menstrual", startDay: 1, endDay: 5 },
      { phase: "follicular", startDay: 6, endDay: 13 },
      { phase: "ovulation", startDay: 14, endDay: 14 },
      { phase: "luteal", startDay: 15, endDay: 28 },
    ]);
  });

  it.each([
    [21, 10, 14],
    [21, 1, 10],
    [45, 10, 10],
    [35, 7, 16],
    [24, 8, 14],
  ])("never produces negative phases and always sums to the cycle (%i/%i/%i)", (c, p, l) => {
    const layout = getCycleLayout(c, p, l);
    const total = layout.phases.reduce((sum, s) => sum + (s.endDay - s.startDay + 1), 0);
    expect(total).toBe(c);
    layout.phases.forEach((s) => expect(s.endDay).toBeGreaterThanOrEqual(s.startDay));
    for (let i = 1; i < layout.phases.length; i++) {
      expect(layout.phases[i].startDay).toBe(layout.phases[i - 1].endDay + 1);
    }
  });

  it("keeps the luteal phase constant and moves ovulation with cycle length", () => {
    expect(getCycleLayout(35, 5, 14).ovulationDay).toBe(21);
    expect(getCycleLayout(24, 5, 14).ovulationDay).toBe(10);
    expect(getCycleLayout(28, 5, 12).ovulationDay).toBe(16);
  });

  it("uses a detected ovulation day when given", () => {
    const layout = getCycleLayout(31, 5, 14, 17);
    expect(layout.ovulationDay).toBe(17);
    expect(layout.lutealLength).toBe(14);
  });

  it("classifies fertility around ovulation", () => {
    const layout = getCycleLayout(28, 5, 14);
    expect([12, 13, 14].map((d) => fertilityForDay(layout, d))).toEqual(["high", "high", "high"]);
    expect([9, 10, 11, 15].map((d) => fertilityForDay(layout, d))).toEqual([
      "medium",
      "medium",
      "medium",
      "medium",
    ]);
    expect([1, 8, 16, 28].map((d) => fertilityForDay(layout, d))).toEqual(["low", "low", "low", "low"]);
  });

  it("returns luteal for days past the expected length", () => {
    const layout = getCycleLayout(28, 5, 14);
    expect(phaseForDay(layout, 3)).toBe("menstrual");
    expect(phaseForDay(layout, 14)).toBe("ovulation");
    expect(phaseForDay(layout, 31)).toBe("luteal");
  });
});

describe("computeStats", () => {
  const history = [
    period("2026-01-01"),
    period("2026-01-30"), // 29
    period("2026-02-27"), // 28
    period("2026-03-28"), // 29
  ];

  it("averages recorded cycles and judges regularity", () => {
    const stats = computeStats(data({ periods: history }));
    expect(stats.cycleLengths).toEqual([29, 28, 29]);
    expect(stats.cycleLength).toBe(29);
    expect(stats.cycleLengthSource).toBe("history");
    expect(stats.variation).toBe(1);
    expect(stats.isRegular).toBe(true);
  });

  it("uses declared values until there are two valid cycles", () => {
    const stats = computeStats(data({ periods: history.slice(0, 2), settings: { cycleLength: 30 } }));
    expect(stats.cycleLength).toBe(30);
    expect(stats.cycleLengthSource).toBe("settings");
    expect(stats.isRegular).toBeNull();
  });

  it("respects the user's choice to ignore history", () => {
    const stats = computeStats(data({ periods: history, settings: { useHistoryAverage: false } }));
    expect(stats.cycleLength).toBe(28);
    expect(stats.cycleLengthSource).toBe("settings");
  });

  it("excludes intervals that contain automatic cycles or are out of range", () => {
    const d = data({
      periods: [period("2026-01-01"), period("2026-02-26"), period("2026-03-27"), period("2026-04-05")],
      autoCycleStarts: ["2026-01-29"],
    });
    const intervals = getIntervals(d);
    expect(intervals.map((i) => [i.length, i.valid, i.reason])).toEqual([
      [56, false, "automatic"],
      [29, true, undefined],
      [9, false, "outOfRange"],
    ]);
  });

  it("flags irregular cycles (variation over 7 days)", () => {
    const stats = computeStats(
      data({
        periods: [period("2026-01-01"), period("2026-01-25"), period("2026-03-01"), period("2026-03-29")],
      })
    );
    expect(stats.cycleLengths).toEqual([24, 35, 28]);
    expect(stats.variation).toBe(11);
    expect(stats.isRegular).toBe(false);
  });

  it("derives period length from logged flow", () => {
    const flow = logs([
      { date: "2026-01-01", flow: "heavy" },
      { date: "2026-01-02", flow: "medium" },
      { date: "2026-01-03", flow: "light" },
      { date: "2026-01-04", flow: "spotting" },
      { date: "2026-01-29", flow: "medium" },
      { date: "2026-01-30", flow: "medium" },
      { date: "2026-01-31", flow: "light" },
      { date: "2026-02-01", flow: "light" },
    ]);
    const stats = computeStats(
      data({ periods: [period("2026-01-01"), period("2026-01-29")], logs: flow })
    );
    expect(stats.periodLength).toBe(4); // mean(3, 4) = 3.5 → 4
    expect(stats.periodLengthSource).toBe("history");
  });
});

describe("detectOvulation", () => {
  it("places ovulation the day after the first positive LH test", () => {
    const l = logs([
      { date: "2026-01-14", lhTest: "negative" },
      { date: "2026-01-15", lhTest: "positive" },
      { date: "2026-01-16", lhTest: "positive" },
    ]);
    expect(detectOvulation(l, "2026-01-01", "2026-01-31")).toEqual({
      date: "2026-01-16",
      source: "lh",
    });
  });

  it("ignores implausibly early LH positives", () => {
    const l = logs([{ date: "2026-01-03", lhTest: "positive" }]);
    expect(detectOvulation(l, "2026-01-01", "2026-01-31")).toBeNull();
  });

  it("detects a temperature shift with the 3-over-6 rule", () => {
    const temps = [36.4, 36.5, 36.4, 36.3, 36.5, 36.4, 36.45, 36.6, 36.65, 36.75, 36.8];
    const l = logs(
      temps.map((bbt, i) => ({ date: addDays("2026-01-08", i), bbt }))
    );
    // Lows Jan 8–14 (max 36.5), first high Jan 15 → ovulation Jan 14.
    expect(detectOvulation(l, "2026-01-01", "2026-01-31")).toEqual({
      date: "2026-01-14",
      source: "bbt",
    });
  });

  it("does not detect a shift without a 0.2 °C rise", () => {
    const temps = [36.4, 36.5, 36.4, 36.3, 36.5, 36.4, 36.55, 36.6, 36.6];
    const l = logs(temps.map((bbt, i) => ({ date: addDays("2026-01-08", i), bbt })));
    expect(detectOvulation(l, "2026-01-01", "2026-01-31")).toBeNull();
  });
});

describe("getCycleStatus", () => {
  it("returns null without any period", () => {
    expect(getCycleStatus(data(), "2026-11-12")).toBeNull();
  });

  it("computes the current day, phase and next period", () => {
    const status = getCycleStatus(data({ periods: [period("2026-11-01")] }), "2026-11-12")!;
    expect(status.state).toBe("normal");
    expect(status.cycleDay).toBe(12);
    expect(status.phase).toBe("follicular");
    expect(status.fertility).toBe("high");
    expect(status.isFertileDay).toBe(true);
    expect(status.nextPeriod).toBe("2026-11-29");
    expect(status.daysUntilNextPeriod).toBe(17);
    expect(status.current.ovulation).toBe("2026-11-14");
    expect(status.current.fertileStart).toBe("2026-11-09");
    expect(status.current.fertileEnd).toBe("2026-11-15");
  });

  it("marks period days of a confirmed start", () => {
    const status = getCycleStatus(data({ periods: [period("2026-11-10")] }), "2026-11-12")!;
    expect(status.isPeriodDay).toBe(true);
    expect(status.phase).toBe("menstrual");
    expect(status.current.confirmed).toBe(true);
  });

  it("auto-advances and asks for confirmation when the expected date passes", () => {
    const status = getCycleStatus(data({ periods: [period("2026-10-01")] }), "2026-11-02")!;
    expect(status.state).toBe("awaiting");
    expect(status.pendingExpected).toBe("2026-10-29");
    expect(status.pendingAutoStarts).toEqual(["2026-10-29"]);
    expect(status.current.start).toBe("2026-10-29");
    expect(status.current.confirmed).toBe(false);
    expect(status.cycleDay).toBe(5);
    expect(status.lateDays).toBe(4);
  });

  it("auto-advances several cycles after a long absence", () => {
    const status = getCycleStatus(data({ periods: [period("2026-08-01")] }), "2026-11-12")!;
    expect(status.pendingAutoStarts).toEqual(["2026-08-29", "2026-09-26", "2026-10-24"]);
    expect(status.current.start).toBe("2026-10-24");
    expect(status.cycleDay).toBe(20);
  });

  it("keeps counting in late mode until the period is confirmed", () => {
    const status = getCycleStatus(
      data({ periods: [period("2026-10-01")], lateExpected: "2026-10-29" }),
      "2026-11-02"
    )!;
    expect(status.state).toBe("late");
    expect(status.cycleDay).toBe(33);
    expect(status.lateDays).toBe(4);
    expect(status.phase).toBe("luteal");
    expect(status.fertility).toBeNull();
    expect(status.isPeriodDay).toBe(false);
    expect(status.daysUntilNextPeriod).toBe(-4);
  });

  it("uses accepted automatic starts as the current cycle", () => {
    const status = getCycleStatus(
      data({ periods: [period("2026-10-01")], autoCycleStarts: ["2026-10-29"] }),
      "2026-11-12"
    )!;
    expect(status.state).toBe("normal");
    expect(status.current.start).toBe("2026-10-29");
    expect(status.current.confirmed).toBe(false);
    expect(status.cycleDay).toBe(15);
  });

  it("moves the next period when ovulation is detected late", () => {
    const l = logs([{ date: "2026-11-16", lhTest: "positive" }]);
    const status = getCycleStatus(
      data({ periods: [period("2026-11-01")], logs: l }),
      "2026-11-18"
    )!;
    expect(status.current.ovulation).toBe("2026-11-17");
    expect(status.current.ovulationSource).toBe("lh");
    expect(status.current.length).toBe(31);
    expect(status.nextPeriod).toBe("2026-12-02");
  });

  it("lists upcoming events in chronological order", () => {
    const status = getCycleStatus(data({ periods: [period("2026-11-01")] }), "2026-11-12")!;
    const dates = status.upcoming.map((e) => e.date);
    expect([...dates].sort()).toEqual(dates);
    expect(status.upcoming.every((e) => e.date >= "2026-11-12")).toBe(true);
    expect(status.upcoming.find((e) => e.type === "periodStart")?.date).toBe("2026-11-29");
    expect(status.upcoming.find((e) => e.type === "ovulation")?.date).toBe("2026-11-14");
  });
});

describe("getCycleTimeline", () => {
  const d = data({
    periods: [period("2026-08-01"), period("2026-08-30"), period("2026-09-27")],
  });
  const timeline = getCycleTimeline(d, "2026-10-10", 120);

  it("contains contiguous past, current and future cycles", () => {
    expect(timeline.map((c) => c.kind).slice(0, 3)).toEqual(["past", "past", "current"]);
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i].start).toBe(addDays(timeline[i - 1].end, 1));
    }
    const last = timeline[timeline.length - 1];
    expect(diffDays(last.start, "2026-10-10")).toBeLessThanOrEqual(120);
  });

  it("uses real lengths for past cycles and the average for predictions", () => {
    expect(timeline[0].length).toBe(29);
    expect(timeline[1].length).toBe(28);
    const future = timeline.filter((c) => c.kind === "future");
    expect(future[0].start).toBe(addDays("2026-09-27", 29)); // round(28.5)
  });

  it("flags predicted period days", () => {
    const future = timeline.find((c) => c.kind === "future")!;
    const info = getDayInfo(timeline, future.start);
    expect(info.isPeriod).toBe(true);
    expect(info.isPredictedPeriod).toBe(true);
    expect(info.isPeriodStart).toBe(true);
    const past = getDayInfo(timeline, "2026-08-02");
    expect(past.isPeriod).toBe(true);
    expect(past.isPredictedPeriod).toBe(false);
  });

  it("starts predictions the day after today in late mode", () => {
    const late = getCycleTimeline(
      data({ periods: [period("2026-10-01")], lateExpected: "2026-10-29" }),
      "2026-11-02",
      60
    );
    const current = late.find((c) => c.kind === "current")!;
    expect(current.end).toBe("2026-11-02");
    expect(late.find((c) => c.kind === "future")!.start).toBe("2026-11-03");
  });

  it("includes unconfirmed automatic cycles while awaiting confirmation", () => {
    const awaiting = getCycleTimeline(data({ periods: [period("2026-08-01")] }), "2026-11-12", 30);
    const auto = awaiting.filter((c) => !c.confirmed && c.kind !== "future").map((c) => c.start);
    expect(auto).toEqual(["2026-08-29", "2026-09-26", "2026-10-24"]);
    expect(getDayInfo(awaiting, "2026-10-24").isPredictedPeriod).toBe(true);
  });
});

describe("validation", () => {
  it("rejects values out of range and warns about clinical ranges", () => {
    expect(validateSettings({ cycleLength: 50, periodLength: 5, lutealLength: 14 }).errors).toHaveLength(1);
    const short = validateSettings({ cycleLength: 22, periodLength: 9, lutealLength: 14 });
    expect(short.errors).toHaveLength(0);
    expect(short.warnings.map((w) => w.code)).toEqual(["shortCycle", "longPeriod", "overlapsOvulation"]);
    expect(validateSettings({ cycleLength: 28, periodLength: 5, lutealLength: 14 }).warnings).toHaveLength(0);
  });

  it("checks new period dates against today and other records", () => {
    const periods = [period("2026-10-01", 5)];
    expect(validatePeriodStart("2026-11-20", periods, "2026-11-12", 5).error?.code).toBe("future");
    expect(validatePeriodStart("2026-10-03", periods, "2026-11-12", 5).error?.code).toBe("overlap");
    expect(validatePeriodStart("2026-10-10", periods, "2026-11-12", 5).warning?.code).toBe("tooClose");
    expect(validatePeriodStart("2026-10-29", periods, "2026-11-12", 5)).toEqual({ error: null, warning: null });
    expect(
      validatePeriodStart("2026-10-02", periods, "2026-11-12", 5, periods[0].id).error
    ).toBeNull();
  });
});
