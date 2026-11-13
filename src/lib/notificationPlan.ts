/**
 * Builds the list of local notifications to schedule from the cycle status
 * and the user's alert preferences. Pure: no Expo APIs, fully testable.
 */
import { addDays, atLocalTime, type ISODate } from "@/lib/dates";
import type { DateStyle, TranslationKey, TranslationParams } from "@/i18n";
import type { CycleInstance, CycleStatus } from "@/types/cycle";
import type { AlertType, NotificationPreferences } from "@/types/preferences";

export interface NotificationSpec {
  id: string;
  type: AlertType;
  date: Date;
  title: string;
  body: string;
}

export interface PlanInput {
  status: CycleStatus;
  timeline: CycleInstance[];
  prefs: NotificationPreferences;
  now: Date;
  t: (key: TranslationKey, params?: TranslationParams) => string;
  formatDate: (iso: ISODate, style?: DateStyle) => string;
  /** Days ahead to schedule. */
  horizonDays?: number;
  /** Android limits pending alarms; keep the list short. */
  maxNotifications?: number;
}

export function buildNotificationPlan({
  status,
  timeline,
  prefs,
  now,
  t,
  formatDate,
  horizonDays = 100,
  maxNotifications = 40,
}: PlanInput): NotificationSpec[] {
  if (!prefs.enabled) return [];

  const today = status.today;
  const horizon = addDays(today, horizonDays);
  const specs = new Map<string, NotificationSpec>();
  const fmt = (iso: ISODate) => formatDate(iso, "medium");

  const add = (type: AlertType, key: string, date: ISODate, title: string, body: string) => {
    if (date > horizon) return;
    const when = atLocalTime(date, prefs.hour, prefs.minute);
    if (when.getTime() <= now.getTime()) return;
    const id = `${type}-${key}-${date}`;
    if (!specs.has(id)) specs.set(id, { id, type, date: when, title, body });
  };

  const late = status.state === "late";
  const upcomingCycles = timeline.filter(
    (c) => c.kind !== "past" && c.end >= today && c.start <= horizon
  );
  const futureCycles = upcomingCycles.filter((c) => c.kind === "future");

  // Upcoming period.
  if (prefs.period.enabled && !late) {
    for (const cycle of futureCycles) {
      const days = prefs.period.days;
      add(
        "period",
        "soon",
        addDays(cycle.start, -days),
        t("notifications.content.periodSoonTitle"),
        t("notifications.content.periodSoonBody", { count: days, date: fmt(cycle.start) })
      );
      add(
        "period",
        "today",
        cycle.start,
        t("notifications.content.periodTodayTitle"),
        t("notifications.content.periodTodayBody")
      );
    }
  }

  // Fertile window and ovulation.
  if (prefs.fertile.enabled && !late) {
    for (const cycle of upcomingCycles) {
      const days = prefs.fertile.days;
      if (days > 0) {
        add(
          "fertile",
          "soon",
          addDays(cycle.fertileStart, -days),
          t("notifications.content.fertileSoonTitle"),
          t("notifications.content.fertileSoonBody", { count: days, date: fmt(cycle.fertileStart) })
        );
      }
      add(
        "fertile",
        "start",
        cycle.fertileStart,
        t("notifications.content.fertileStartTitle"),
        t("notifications.content.fertileStartBody", {
          start: fmt(cycle.fertileStart),
          end: fmt(cycle.fertileEnd),
          ovulation: fmt(cycle.ovulation),
        })
      );
      add(
        "fertile",
        "ovulation",
        cycle.ovulation,
        t("notifications.content.ovulationTitle"),
        t("notifications.content.ovulationBody")
      );
    }
  }

  // Phase changes (period start / ovulation only when their own alert is off).
  if (prefs.phase.enabled && !late) {
    const days = prefs.phase.days;
    for (const cycle of upcomingCycles) {
      const phases: { key: string; date: ISODate; name: string; title: string; body: string }[] = [];
      const follicular = cycle.layout.phases.find((p) => p.phase === "follicular");
      if (follicular) {
        phases.push({
          key: "follicular",
          date: addDays(cycle.start, follicular.startDay - 1),
          name: t("phases.follicular"),
          title: t("notifications.content.follicularTitle"),
          body: t("notifications.content.follicularBody"),
        });
      }
      if (cycle.layout.ovulationDay < cycle.layout.cycleLength) {
        phases.push({
          key: "luteal",
          date: addDays(cycle.ovulation, 1),
          name: t("phases.luteal"),
          title: t("notifications.content.lutealTitle"),
          body: t("notifications.content.lutealBody"),
        });
      }
      if (!prefs.fertile.enabled) {
        phases.push({
          key: "ovulation",
          date: cycle.ovulation,
          name: t("phases.ovulation"),
          title: t("notifications.content.ovulationTitle"),
          body: t("notifications.content.ovulationBody"),
        });
      }
      if (!prefs.period.enabled && cycle.kind === "future") {
        phases.push({
          key: "menstrual",
          date: cycle.start,
          name: t("phases.menstrual"),
          title: t("notifications.content.periodTodayTitle"),
          body: t("notifications.content.periodTodayBody"),
        });
      }
      for (const phase of phases) {
        if (days > 0) {
          add(
            "phase",
            phase.key,
            addDays(phase.date, -days),
            t("notifications.content.phaseSoonTitle", { phase: phase.name }),
            t("notifications.content.phaseSoonBody", { count: days, date: fmt(phase.date) })
          );
        } else {
          add("phase", phase.key, phase.date, phase.title, phase.body);
        }
      }
    }
  }

  // Late period: fires only if the period has not been confirmed by then
  // (logging it reschedules everything).
  if (prefs.late.enabled) {
    const expected =
      status.state === "normal" ? futureCycles[0]?.start : status.pendingExpected;
    if (expected) {
      const fireOn = late
        ? addDays(today, prefs.late.days)
        : addDays(expected, prefs.late.days);
      add(
        "late",
        "check",
        fireOn,
        t("notifications.content.lateTitle"),
        t("notifications.content.lateBody", { date: fmt(expected) })
      );
    }
  }

  return [...specs.values()]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, maxNotifications);
}
