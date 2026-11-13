import { CYCLE_DEFAULTS, getCycleStatus, getCycleTimeline } from "@/lib/cycle";
import { buildNotificationPlan } from "@/lib/notificationPlan";
import { formatISODate, translate } from "@/i18n";
import { DEFAULT_PREFERENCES, type NotificationPreferences } from "@/types/preferences";
import type { CycleData } from "@/types/cycle";

const base: CycleData = {
  periods: [{ id: "a", startDate: "2026-11-01" }],
  settings: { ...CYCLE_DEFAULTS },
  autoCycleStarts: [],
  lateCycleStart: null,
  logs: {},
};

function plan(
  data: CycleData,
  today: string,
  prefs: Partial<NotificationPreferences> = {},
  now = new Date(2026, 10, 12, 8, 0)
) {
  return buildNotificationPlan({
    status: getCycleStatus(data, today)!,
    timeline: getCycleTimeline(data, today),
    prefs: { ...DEFAULT_PREFERENCES.notifications, enabled: true, ...prefs },
    now,
    t: (key, params) => translate("es", key, params),
    formatDate: (iso, style) => formatISODate("es", iso, style),
  });
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

describe("buildNotificationPlan", () => {
  it("is empty when notifications are disabled", () => {
    expect(plan(base, "2026-11-12", { enabled: false })).toEqual([]);
  });

  it("schedules period, fertile and phase alerts at the chosen time", () => {
    const specs = plan(base, "2026-11-12");
    const byId = Object.fromEntries(specs.map((s) => [s.id, s]));
    // Next period 2026-11-29, 2 days before → 11-27.
    expect(iso(byId["period-soon-2026-11-27"].date)).toBe("2026-11-27");
    expect(byId["period-soon-2026-11-27"].date.getHours()).toBe(9);
    expect(byId["period-soon-2026-11-27"].body).toContain("2 días");
    expect(byId["period-today-2026-11-29"]).toBeDefined();
    // Ovulation 2026-11-14, luteal phase from 11-15.
    expect(byId["fertile-ovulation-2026-11-14"]).toBeDefined();
    expect(byId["phase-luteal-2026-11-15"].title).toBe("Comienza tu fase lútea");
    // Late check 2 days after the next expected period.
    expect(byId["late-check-2026-12-01"].body).toContain("29 de noviembre");
    // Sorted and in the future.
    const times = specs.map((s) => s.date.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(times.every((time) => time > new Date(2026, 10, 12, 8, 0).getTime())).toBe(true);
  });

  it("respects disabled alert types and lead days", () => {
    const specs = plan(base, "2026-11-12", {
      period: { enabled: false, days: 2 },
      fertile: { enabled: false, days: 1 },
      phase: { enabled: true, days: 1 },
      late: { enabled: false, days: 2 },
    });
    expect(specs.some((s) => s.type === "period" || s.type === "fertile" || s.type === "late")).toBe(false);
    // Phase alerts take over ovulation and period start, one day earlier.
    const ids = specs.map((s) => s.id);
    expect(ids).toContain("phase-ovulation-2026-11-13");
    expect(ids).toContain("phase-menstrual-2026-11-28");
    expect(specs.find((s) => s.id === "phase-luteal-2026-11-14")?.title).toBe("Fase lútea se acerca");
  });

  it("only schedules a late reminder in late mode", () => {
    const late = { ...base, periods: [{ id: "a", startDate: "2026-10-01" }], lateCycleStart: "2026-10-01" };
    const specs = plan(late, "2026-11-12");
    expect(specs.map((s) => s.type)).toEqual(["late"]);
    expect(iso(specs[0].date)).toBe("2026-11-14");
  });

  it("skips times that already passed today", () => {
    const specs = plan(base, "2026-11-14", {}, new Date(2026, 10, 14, 10, 0));
    expect(specs.some((s) => s.id === "fertile-ovulation-2026-11-14")).toBe(false);
  });
});
