import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CycleData } from "@/types/cycle";
import type { Preferences } from "@/types/preferences";
import {
  STORAGE_VERSION,
  createEmptyCycleData,
  sanitizeCycleData,
  sanitizePreferences,
  unwrap,
} from "./schema";

const KEYS = {
  cycle: "cycletracker/cycle",
  preferences: "cycletracker/preferences",
} as const;

async function read(key: string): Promise<unknown> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? unwrap(JSON.parse(raw)) : null;
  } catch (error) {
    console.warn(`[storage] Could not read ${key}`, error);
    return null;
  }
}

async function write(key: string, data: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, data }));
  } catch (error) {
    console.warn(`[storage] Could not write ${key}`, error);
  }
}

export async function loadCycleData(): Promise<CycleData> {
  const raw = await read(KEYS.cycle);
  return raw ? sanitizeCycleData(raw) : createEmptyCycleData();
}

export function saveCycleData(data: CycleData): Promise<void> {
  return write(KEYS.cycle, data);
}

export async function loadPreferences(): Promise<Preferences> {
  return sanitizePreferences(await read(KEYS.preferences));
}

export function savePreferences(preferences: Preferences): Promise<void> {
  return write(KEYS.preferences, preferences);
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch (error) {
    console.warn("[storage] Could not clear data", error);
  }
}
