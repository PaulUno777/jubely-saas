import type {
  DateRangeFormatLabels,
  DateRangeFormatters,
  DateRangePreset,
} from "./types";
import { ymdInTimeZone } from "./resolve";

export function calendarYmd(date: Date, timeZone?: string) {
  if (!timeZone) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
  }
  return ymdInTimeZone(date, timeZone);
}

function applyPattern(
  pattern: string,
  values: Record<string, string | number>,
): string {
  return pattern.replace(/__(\w+)__/g, (_, key: string) =>
    String(values[key] ?? ""),
  );
}

export function createRangeFormatters(
  locale: string,
  labels: DateRangeFormatLabels,
  timeZone?: string,
): DateRangeFormatters {
  const dayFormatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    day: "numeric",
    month: "short",
  });
  const dayYearFormatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const monthFormatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    month: "long",
    year: "numeric",
  });
  const monthShortFormatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    month: "short",
  });

  const formatDay = (date: Date) => dayFormatter.format(date);
  const formatDayYear = (date: Date) => dayYearFormatter.format(date);
  const formatMonthYear = (date: Date) => monthFormatter.format(date);

  const formatRangeSubtitle = (
    start: Date,
    end: Date,
    preset?: DateRangePreset,
  ) => {
    if (preset === "this_month") {
      return formatMonthYear(end);
    }
    if (preset === "this_quarter" || preset === "year_to_date") {
      return formatQuarterYear(
        start,
        end,
        locale,
        labels.quarterYear,
        timeZone,
      );
    }

    const s = calendarYmd(start, timeZone);
    const e = calendarYmd(end, timeZone);

    if (s.year === e.year && s.month === e.month && s.day === e.day) {
      return applyPattern(labels.singleDay, { date: formatDayYear(start) });
    }
    if (s.year === e.year && s.month === e.month) {
      return applyPattern(labels.sameMonth, {
        start: formatDay(start),
        end: formatDay(end),
      });
    }
    if (s.year === e.year) {
      return applyPattern(labels.sameYear, {
        start: formatDay(start),
        end: formatDay(end),
      });
    }
    return applyPattern(labels.crossYear, {
      start: formatDayYear(start),
      end: formatDayYear(end),
    });
  };

  const formatMonthYearFn = (date: Date) => formatMonthYear(date);

  const formatQuarterYearFn = (start: Date, end: Date) =>
    formatQuarterYear(start, end, locale, labels.quarterYear, timeZone);

  return {
    formatRangeSubtitle,
    formatMonthYear: formatMonthYearFn,
    formatQuarterYear: formatQuarterYearFn,
  };
}

export function formatQuarterYear(
  start: Date,
  end: Date,
  locale: string,
  pattern: string,
  timeZone?: string,
): string {
  const monthShort = new Intl.DateTimeFormat(locale, {
    timeZone,
    month: "short",
  });
  const monthYear = new Intl.DateTimeFormat(locale, {
    timeZone,
    month: "short",
    year: "numeric",
  });
  const s = calendarYmd(start, timeZone);
  const e = calendarYmd(end, timeZone);
  if (s.year === e.year) {
    return applyPattern(pattern, {
      start: monthShort.format(start),
      end: monthShort.format(end),
      year: s.year,
    });
  }
  return `${monthYear.format(start)} – ${monthYear.format(end)}`;
}

export function formatTriggerSubtitle(
  formatters: DateRangeFormatters,
  value: { preset: DateRangePreset; start: Date; end: Date },
): string {
  return formatters.formatRangeSubtitle(value.start, value.end, value.preset);
}
