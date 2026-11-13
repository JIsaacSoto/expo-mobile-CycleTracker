/** Regression tests for issues found in code review. */
import { CYCLE_DEFAULTS, computeStats, cycleActions, getCycleStatus, getCycleTimeline, getDayInfo } from "@/lib/cycle";
import type { CycleData } from "@/types/cycle";
import type { DailyLog } from "@/types/log";

function make(partial: Partial<CycleData>): CycleData {
  return {
    periods: [],
    settings: { ...CYCLE_DEFAULTS },
    autoCycleStarts: [],
    lateCycleStart: null,
    logs: {},
    ...partial,
  };
}
const logs = (entries: DailyLog[]) => Object.fromEntries(entries.map((l) => [l.date, l]));

describe("fertility signs logged in an automatic cycle", () => {
  it("apply to the automatic cycle, not to the previous confirmed one", () => {
    const data = make({
      periods: [{ id: "a", startDate: "2026-01-01" }],
      logs: logs([{ date: "2026-02-12", lhTest: "positive" }]),
    });
    const status = getCycleStatus(data, "2026-02-12")!;
    expect(status.state).toBe("awaiting");
    expect(status.current.start).toBe("2026-01-29");
    expect(status.current.ovulation).toBe("2026-02-13");
    expect(status.current.ovulationSource).toBe("lh");
  });

  it("still extend the cycle in late mode", () => {
    const data = make({
      periods: [{ id: "a", startDate: "2026-01-01" }],
      lateCycleStart: "2026-01-01",
      logs: logs([{ date: "2026-02-03", lhTest: "positive" }]),
    });
    const status = getCycleStatus(data, "2026-02-05")!;
    // Ovulation 02-04 (day 35) + 14 → next period expected 02-19.
    expect(status.state).toBe("normal");
    expect(status.nextPeriod).toBe("2026-02-19");
  });
});

describe("automatic starts when periods change", () => {
  it("logging a real period drops the automatic chain after it", () => {
    const auto = make({
      periods: [{ id: "a", startDate: "2026-01-01" }],
      autoCycleStarts: ["2026-01-29", "2026-02-26"],
    });
    // 01-29 is less than half a cycle before the real start (replaced); 02-26 chained from it.
    const fixed = cycleActions.addPeriod(auto, "2026-02-10");
    expect(fixed.autoCycleStarts).toEqual([]);
    expect(computeStats(fixed).cycleLengths).toEqual([40]);
    const status = getCycleStatus(fixed, "2026-03-01")!;
    expect(status.current.start).toBe("2026-02-10");
    expect(status.cycleDay).toBe(20);
    expect(status.current.confirmed).toBe(true);
  });

  it("editing a period date cleans automatic starts and never overlaps cycles", () => {
    const data = make({
      periods: [
        { id: "a", startDate: "2026-01-01" },
        { id: "b", startDate: "2026-03-01" },
      ],
      autoCycleStarts: ["2026-01-29"],
    });
    const edited = cycleActions.updatePeriod(data, "b", { startDate: "2026-01-30" });
    expect(edited.autoCycleStarts).toEqual([]);
    const timeline = getCycleTimeline(edited, "2026-02-10", 60);
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i].start > timeline[i - 1].end).toBe(true);
    }
    expect(getDayInfo(timeline, "2026-01-30").isPeriodStart).toBe(true);
  });

  it("removing a period drops the automatic starts chained from it", () => {
    const data = make({
      periods: [
        { id: "a", startDate: "2026-01-01" },
        { id: "b", startDate: "2026-01-29" },
      ],
      autoCycleStarts: ["2026-02-26"],
    });
    expect(cycleActions.removePeriod(data, "b").autoCycleStarts).toEqual([]);
  });
});

describe("period in progress", () => {
  const history = make({
    periods: [
      { id: "a", startDate: "2026-01-01", length: 5 },
      { id: "b", startDate: "2026-01-29", length: 5 },
      { id: "c", startDate: "2026-02-26" },
    ],
    logs: logs([{ date: "2026-02-26", flow: "heavy" }]),
  });

  it("is not shorter than the average while it lasts", () => {
    const status = getCycleStatus(history, "2026-02-26")!;
    expect(status.current.periodLength).toBe(5);
    expect(status.stats.periodLength).toBe(5);
    expect(getCycleStatus(history, "2026-02-27")!.isPeriodDay).toBe(true);
  });

  it("counts its real length once it has finished", () => {
    expect(computeStats(history, "2026-03-10").periodLength).toBe(4); // mean(5, 5, 1)
  });
});

describe("late mode", () => {
  const late = cycleActions.markNotArrived(
    make({ periods: [{ id: "a", startDate: "2026-01-01" }] }),
    "2026-02-03"
  );

  it("survives a change of cycle length", () => {
    const changed = cycleActions.updateSettings(late, { cycleLength: 30 });
    const status = getCycleStatus(changed, "2026-02-03")!;
    expect(status.state).toBe("late");
    expect(status.pendingExpected).toBe("2026-01-31");
    expect(status.lateDays).toBe(3);
  });

  it("is cleared when a newer period is logged", () => {
    const logged = cycleActions.addPeriod(late, "2026-02-03");
    expect(logged.lateCycleStart).toBeNull();
  });
});
