import type { ISODate } from "@/lib/dates";

export const FLOW_LEVELS = ["spotting", "light", "medium", "heavy"] as const;
export type FlowLevel = (typeof FLOW_LEVELS)[number];

export const SYMPTOMS = [
  "cramps",
  "headache",
  "bloating",
  "breastTenderness",
  "acne",
  "fatigue",
  "backPain",
  "nausea",
  "cravings",
  "insomnia",
  "digestive",
  "pelvicPain",
] as const;
export type Symptom = (typeof SYMPTOMS)[number];

export const MOODS = [
  "happy",
  "calm",
  "energetic",
  "sensitive",
  "irritable",
  "anxious",
  "sad",
  "lowEnergy",
] as const;
export type Mood = (typeof MOODS)[number];

export const MUCUS_TYPES = ["dry", "sticky", "creamy", "watery", "eggWhite"] as const;
export type MucusType = (typeof MUCUS_TYPES)[number];

export const LH_RESULTS = ["negative", "positive"] as const;
export type LhResult = (typeof LH_RESULTS)[number];

export const SEX_TYPES = ["protected", "unprotected"] as const;
export type SexType = (typeof SEX_TYPES)[number];

export const MEDICATIONS = [
  "painkiller",
  "contraceptive",
  "emergencyContraceptive",
  "antibiotic",
  "supplement",
  "other",
] as const;
export type Medication = (typeof MEDICATIONS)[number];

export interface DailyLog {
  date: ISODate;
  flow?: FlowLevel | null;
  symptoms?: Symptom[];
  moods?: Mood[];
  /** Basal body temperature, always stored in °C. */
  bbt?: number | null;
  mucus?: MucusType | null;
  lhTest?: LhResult | null;
  sex?: SexType | null;
  medications?: Medication[];
  note?: string;
}

/** Bleeding that counts as menstrual flow (spotting does not). */
export function isBleeding(flow: FlowLevel | null | undefined): boolean {
  return flow === "light" || flow === "medium" || flow === "heavy";
}

export function isLogEmpty(log: DailyLog | undefined | null): boolean {
  if (!log) return true;
  return (
    !log.flow &&
    !log.symptoms?.length &&
    !log.moods?.length &&
    (log.bbt === null || log.bbt === undefined) &&
    !log.mucus &&
    !log.lhTest &&
    !log.sex &&
    !log.medications?.length &&
    !log.note?.trim()
  );
}
