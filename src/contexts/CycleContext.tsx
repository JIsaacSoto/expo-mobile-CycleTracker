import React, { createContext, useState } from "react";
import { CycleData } from "@/types/cycle";

interface CycleContextType {
  cycle: CycleData;
  setCycle: React.Dispatch<React.SetStateAction<CycleData>>;
}

export const CycleContext = createContext<CycleContextType | null>(null);

export function CycleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cycle, setCycle] = useState<CycleData>({
    lastPeriodDate: null,
    periodLength: 5,
    cycleLength: 28,
  });

  return (
    <CycleContext.Provider
      value={{
        cycle,
        setCycle,
      }}
    >
      {children}
    </CycleContext.Provider>
  );
}
