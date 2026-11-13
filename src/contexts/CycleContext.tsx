import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cycleActions, getCycleStatus, getCycleTimeline } from "@/lib/cycle";
import type { SetupInput } from "@/lib/cycle/actions";
import type { ISODate } from "@/lib/dates";
import { useToday } from "@/hooks/useToday";
import { clearAllData, loadCycleData, saveCycleData } from "@/services/storage";
import { createEmptyCycleData } from "@/services/schema";
import type {
  CycleData,
  CycleInstance,
  CycleSettings,
  CycleStatus,
  PeriodEntry,
} from "@/types/cycle";
import type { DailyLog } from "@/types/log";

export interface CycleContextValue {
  data: CycleData;
  hydrated: boolean;
  today: ISODate;
  /** Null until the first period is recorded. */
  status: CycleStatus | null;
  /** Past, current and predicted cycles (about 13 months ahead). */
  timeline: CycleInstance[];
  completeSetup: (input: SetupInput) => void;
  updateSettings: (patch: Partial<CycleSettings>) => void;
  addPeriod: (startDate: ISODate, length?: number | null) => void;
  updatePeriod: (id: string, patch: Partial<Omit<PeriodEntry, "id">>) => void;
  removePeriod: (id: string) => void;
  confirmOnTime: () => void;
  confirmDelayed: (days: number) => void;
  markNotArrived: () => void;
  keepAutomatic: () => void;
  exitLateMode: () => void;
  saveLog: (log: DailyLog) => void;
  removeLog: (date: ISODate) => void;
  resetAll: () => Promise<void>;
}

export const CycleContext = createContext<CycleContextValue | null>(null);

export function CycleProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<CycleData>(createEmptyCycleData);
  const [hydrated, setHydrated] = useState(false);
  const skipNextSave = useRef(true);
  const today = useToday();

  useEffect(() => {
    let mounted = true;
    loadCycleData().then((loaded) => {
      if (!mounted) return;
      setData(loaded);
      setHydrated(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    saveCycleData(data);
  }, [data, hydrated]);

  const status = useMemo(() => getCycleStatus(data, today), [data, today]);
  const timeline = useMemo(() => getCycleTimeline(data, today), [data, today]);

  const todayRef = useRef(today);
  todayRef.current = today;

  const actions = useMemo(
    () => ({
      completeSetup: (input: SetupInput) => setData((d) => cycleActions.completeSetup(d, input)),
      updateSettings: (patch: Partial<CycleSettings>) =>
        setData((d) => cycleActions.updateSettings(d, patch)),
      addPeriod: (startDate: ISODate, length: number | null = null) =>
        setData((d) => cycleActions.addPeriod(d, startDate, length)),
      updatePeriod: (id: string, patch: Partial<Omit<PeriodEntry, "id">>) =>
        setData((d) => cycleActions.updatePeriod(d, id, patch)),
      removePeriod: (id: string) => setData((d) => cycleActions.removePeriod(d, id)),
      confirmOnTime: () => setData((d) => cycleActions.confirmOnTime(d, todayRef.current)),
      confirmDelayed: (days: number) =>
        setData((d) => cycleActions.confirmDelayed(d, todayRef.current, days)),
      markNotArrived: () => setData((d) => cycleActions.markNotArrived(d, todayRef.current)),
      keepAutomatic: () => setData((d) => cycleActions.keepAutomatic(d, todayRef.current)),
      exitLateMode: () => setData((d) => cycleActions.exitLateMode(d)),
      saveLog: (log: DailyLog) => setData((d) => cycleActions.saveLog(d, log)),
      removeLog: (date: ISODate) => setData((d) => cycleActions.removeLog(d, date)),
    }),
    []
  );

  const resetAll = useCallback(async () => {
    await clearAllData();
    skipNextSave.current = true;
    setData(createEmptyCycleData());
  }, []);

  const value = useMemo<CycleContextValue>(
    () => ({ data, hydrated, today, status, timeline, ...actions, resetAll }),
    [data, hydrated, today, status, timeline, actions, resetAll]
  );

  return <CycleContext.Provider value={value}>{children}</CycleContext.Provider>;
}
