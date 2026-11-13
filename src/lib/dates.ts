/**
 * Calendar-date helpers.
 *
 * Every date in the app is stored as an ISO calendar date string ("YYYY-MM-DD")
 * interpreted in the user's local time zone. Arithmetic is done in UTC on the
 * year/month/day parts so daylight-saving changes never shift a day.
 */
export type ISODate = string;

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function isISODate(value: unknown): value is ISODate {
  if (typeof value !== "string") return false;
  const m = ISO_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === mo - 1 &&
    date.getUTCDate() === d
  );
}

function parts(iso: ISODate): [number, number, number] {
  const m = ISO_RE.exec(iso);
  if (!m) throw new Error(`Invalid ISO date: ${iso}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function utcMs(iso: ISODate): number {
  const [y, m, d] = parts(iso);
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): ISODate {
  const date = new Date(ms);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}`;
}

/** Local calendar date of a JS Date. */
export function toISODate(date: Date): ISODate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

/** JS Date at local midnight for an ISO date. */
export function fromISODate(iso: ISODate): Date {
  const [y, m, d] = parts(iso);
  return new Date(y, m - 1, d);
}

/** JS Date at a given local time on an ISO date. */
export function atLocalTime(iso: ISODate, hour: number, minute = 0): Date {
  const [y, m, d] = parts(iso);
  return new Date(y, m - 1, d, hour, minute, 0, 0);
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now);
}

export function addDays(iso: ISODate, days: number): ISODate {
  return fromUtcMs(utcMs(iso) + days * MS_PER_DAY);
}

/** Whole calendar days from `b` to `a` (a - b). */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((utcMs(a) - utcMs(b)) / MS_PER_DAY);
}

export function compareISO(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function minISO(a: ISODate, b: ISODate): ISODate {
  return a <= b ? a : b;
}

export function maxISO(a: ISODate, b: ISODate): ISODate {
  return a >= b ? a : b;
}

/** True when `date` is within [start, end] (inclusive). */
export function isWithin(date: ISODate, start: ISODate, end: ISODate): boolean {
  return date >= start && date <= end;
}

/** Inclusive list of dates from start to end. */
export function eachDay(start: ISODate, end: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

export function startOfMonthISO(iso: ISODate): ISODate {
  const [y, m] = parts(iso);
  return `${y}-${pad(m)}-01`;
}

export function addMonthsISO(iso: ISODate, months: number): ISODate {
  const [y, m, d] = parts(iso);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return fromUtcMs(target.getTime());
}
