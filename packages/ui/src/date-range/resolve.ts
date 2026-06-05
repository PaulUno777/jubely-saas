import type { DateRangePreset, DateRangeValue, ResolveDateRangeOptions } from "./types";

export function ymdInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return { year, month, day };
}

function zonedWallToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ms: number,
  timeZone: string,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  const guess = new Date(utcGuess);
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(guess);

  const asNumber = (type: Intl.DateTimeFormatPartTypes) =>
    Number(formatted.find((p) => p.type === type)?.value ?? 0);

  const tzYear = asNumber("year");
  const tzMonth = asNumber("month");
  const tzDay = asNumber("day");
  const tzHour = asNumber("hour");
  const tzMinute = asNumber("minute");
  const tzSecond = asNumber("second");

  const desiredMs = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  const actualMs = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, tzSecond, 0);
  return new Date(utcGuess + (desiredMs - actualMs));
}

export function startOfDay(date: Date, timeZone?: string): Date {
  if (!timeZone) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const { year, month, day } = ymdInTimeZone(date, timeZone);
  return zonedWallToUtc(year, month, day, 0, 0, 0, 0, timeZone);
}

export function endOfDay(date: Date, timeZone?: string): Date {
  if (!timeZone) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  const { year, month, day } = ymdInTimeZone(date, timeZone);
  return zonedWallToUtc(year, month, day, 23, 59, 59, 999, timeZone);
}

function startOfMonth(date: Date, timeZone?: string): Date {
  if (!timeZone) {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  }
  const { year, month } = ymdInTimeZone(date, timeZone);
  return zonedWallToUtc(year, month, 1, 0, 0, 0, 0, timeZone);
}

function startOfQuarter(date: Date, timeZone?: string): Date {
  if (!timeZone) {
    const q = Math.floor(date.getMonth() / 3);
    return new Date(date.getFullYear(), q * 3, 1, 0, 0, 0, 0);
  }
  const { year, month } = ymdInTimeZone(date, timeZone);
  const qMonth = Math.floor((month - 1) / 3) * 3 + 1;
  return zonedWallToUtc(year, qMonth, 1, 0, 0, 0, 0, timeZone);
}

function startOfYear(date: Date, timeZone?: string): Date {
  if (!timeZone) {
    return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
  }
  const { year } = ymdInTimeZone(date, timeZone);
  return zonedWallToUtc(year, 1, 1, 0, 0, 0, 0, timeZone);
}

export function resolveDateRange(
  preset: DateRangePreset,
  options: ResolveDateRangeOptions = {},
): DateRangeValue {
  const referenceDate = options.referenceDate ?? new Date();
  const tz = options.timeZone;
  const refEnd = endOfDay(referenceDate, tz);

  switch (preset) {
    case "today": {
      const start = startOfDay(referenceDate, tz);
      return { preset, start, end: refEnd };
    }
    case "last_7_days": {
      const start = startOfDay(addDays(referenceDate, -6, tz), tz);
      return { preset, start, end: refEnd };
    }
    case "last_30_days": {
      const start = startOfDay(addDays(referenceDate, -29, tz), tz);
      return { preset, start, end: refEnd };
    }
    case "this_month": {
      const start = startOfMonth(referenceDate, tz);
      return { preset, start, end: refEnd };
    }
    case "this_quarter": {
      const start = startOfQuarter(referenceDate, tz);
      return { preset, start, end: refEnd };
    }
    case "year_to_date": {
      const start = startOfYear(referenceDate, tz);
      return { preset, start, end: refEnd };
    }
    case "custom": {
      const customStart = options.customStart ?? referenceDate;
      const customEnd = options.customEnd ?? referenceDate;
      const start = startOfDay(customStart, tz);
      const end = endOfDay(customEnd, tz);
      return { preset, start, end };
    }
    default: {
      const _exhaustive: never = preset;
      return _exhaustive;
    }
  }
}

export function defaultDateRangeValue(
  preset: DateRangePreset = "last_7_days",
  options?: ResolveDateRangeOptions,
): DateRangeValue {
  return resolveDateRange(preset, options);
}

export function addDays(date: Date, days: number, timeZone?: string): Date {
  if (!timeZone) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }
  const { year, month, day } = ymdInTimeZone(date, timeZone);
  const noon = zonedWallToUtc(year, month, day, 12, 0, 0, 0, timeZone);
  noon.setUTCDate(noon.getUTCDate() + days);
  return noon;
}

export function parseDateInputValue(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null;
  }
  return date;
}

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
