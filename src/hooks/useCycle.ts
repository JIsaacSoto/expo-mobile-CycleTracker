// Copyright (c) 2026 José Isaac Soto López. All rights reserved.
// SPDX-License-Identifier: LicenseRef-CycleTracker-Proprietary — see LICENSE.
import { useContext } from "react";
import { CycleContext } from "@/contexts/CycleContext";

export function useCycle() {
  const context = useContext(CycleContext);
  if (!context) {
    throw new Error("useCycle must be used within a CycleProvider");
  }
  return context;
}
