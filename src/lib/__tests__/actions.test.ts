import { cycleActions, getCycleStatus, computeStats } from "@/lib/cycle";
import { createEmptyCycleData, sanitizeCycleData, sanitizePreferences, unwrap } from "@/services/schema";
import { DEFAULT_PREFERENCES } from "@/types/preferences";
import { translate } from "@/i18n";

const setup = (date = "2026-10-01") =>
  cycleActions.completeSetup(createEmptyCycleData(), {
    lastPeriodDate: date,
    cycleLength: 28,
    periodLength: 5,
    lutealLength: 14,
  });

describe("cycle actions", () => {
  it("completes the setup with one confirmed period", () => {
    const data = setup();
    expect(data.periods).toHaveLength(1);
    expect(data.settings.cycleLength).toBe(28);
    expect(getCycleStatus(data, "2026-10-10")?.cycleDay).toBe(10);
  });

  it("confirms an on-time period from the pending banner", () => {
    const data = cycleActions.confirmOnTime(setup(), "2026-11-02");
    expect(data.periods.map((p) => p.startDate)).toEqual(["2026-10-01", "2026-10-29"]);
    const status = getCycleStatus(data, "2026-11-02")!;
    expect(status.state).toBe("normal");
    expect(status.current.confirmed).toBe(true);
    expect(computeStats(data).cycleLengths).toEqual([28]);
  });

  it("confirms a delayed period with the chosen days", () => {
    const data = cycleActions.confirmDelayed(setup(), "2026-11-02", 3);
    expect(data.periods[1].startDate).toBe("2026-11-01");
    expect(cycleActions.confirmDelayed(setup(), "2026-11-02", 10).periods).toHaveLength(1);
  });

  it("enters late mode and leaves it when the period is logged", () => {
    const late = cycleActions.markNotArrived(setup(), "2026-11-02");
    expect(late.lateExpected).toBe("2026-10-29");
    expect(getCycleStatus(late, "2026-11-02")?.state).toBe("late");
    const logged = cycleActions.addPeriod(late, "2026-11-02");
    expect(logged.lateExpected).toBeNull();
    expect(getCycleStatus(logged, "2026-11-02")?.state).toBe("normal");
    expect(computeStats(logged).cycleLengths).toEqual([32]);
  });

  it("keeps automatic cycles without counting them", () => {
    const auto = cycleActions.keepAutomatic(setup("2026-08-01"), "2026-11-12");
    expect(auto.autoCycleStarts).toEqual(["2026-08-29", "2026-09-26", "2026-10-24"]);
    const status = getCycleStatus(auto, "2026-11-12")!;
    expect(status.state).toBe("normal");
    expect(status.current.start).toBe("2026-10-24");
    const next = cycleActions.addPeriod(auto, "2026-11-20");
    expect(computeStats(next).cycleLengths).toEqual([]);
  });

  it("replaces a close automatic start when the real date is logged", () => {
    const auto = cycleActions.keepAutomatic(setup(), "2026-11-02");
    const fixed = cycleActions.addPeriod(auto, "2026-10-31");
    expect(fixed.autoCycleStarts).toEqual([]);
    expect(computeStats(fixed).cycleLengths).toEqual([30]);
  });

  it("never removes the last period and ignores duplicates", () => {
    const data = setup();
    expect(cycleActions.removePeriod(data, data.periods[0].id).periods).toHaveLength(1);
    expect(cycleActions.addPeriod(data, "2026-10-01").periods).toHaveLength(1);
  });

  it("drops empty logs", () => {
    const withLog = cycleActions.saveLog(setup(), { date: "2026-10-02", flow: "heavy" });
    expect(withLog.logs["2026-10-02"]?.flow).toBe("heavy");
    const cleared = cycleActions.saveLog(withLog, { date: "2026-10-02", flow: null, symptoms: [] });
    expect(cleared.logs["2026-10-02"]).toBeUndefined();
  });
});

describe("persistence schema", () => {
  it("recovers from corrupted data", () => {
    const data = sanitizeCycleData({
      periods: [{ startDate: "2026-10-01" }, { startDate: "bad" }, { startDate: "2026-10-01" }],
      settings: { cycleLength: 300, periodLength: 4, lutealLength: "x" },
      autoCycleStarts: ["2026-10-29", 4],
      lateExpected: "nope",
      logs: {
        "2026-10-02": { flow: "heavy", symptoms: ["cramps", "invented"], bbt: 99 },
        "not-a-date": { flow: "heavy" },
        "2026-10-03": { flow: "nothing" },
      },
    });
    expect(data.periods.map((p) => p.startDate)).toEqual(["2026-10-01"]);
    expect(data.settings).toEqual({ cycleLength: 28, periodLength: 4, lutealLength: 14, useHistoryAverage: true });
    expect(data.autoCycleStarts).toEqual(["2026-10-29"]);
    expect(data.lateExpected).toBeNull();
    expect(Object.keys(data.logs)).toEqual(["2026-10-02"]);
    expect(data.logs["2026-10-02"].symptoms).toEqual(["cramps"]);
    expect(data.logs["2026-10-02"].bbt).toBeNull();
  });

  it("fills preference defaults and unwraps versioned payloads", () => {
    expect(sanitizePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    const prefs = sanitizePreferences(
      unwrap({ version: 1, data: { theme: "dark", notifications: { period: { enabled: false, days: 99 } } } })
    );
    expect(prefs.theme).toBe("dark");
    expect(prefs.notifications.period).toEqual({ enabled: false, days: 2 });
  });
});

describe("i18n", () => {
  it("interpolates and pluralizes", () => {
    expect(translate("es", "cycle.periodIn", { count: 1 })).toBe("Periodo mañana");
    expect(translate("es", "cycle.periodIn", { count: 5 })).toBe("Periodo en 5 días");
    expect(translate("en", "cycle.late", { count: 2 })).toBe("2 days late");
    expect(translate("en", "cycle.day", { day: 3 })).toBe("Day 3");
  });
});
