// Copyright (c) 2026 José Isaac Soto López. All rights reserved.
// SPDX-License-Identifier: LicenseRef-CycleTracker-Proprietary — see LICENSE.
import { useContext } from "react";
import { PreferencesContext } from "@/contexts/PreferencesContext";

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
