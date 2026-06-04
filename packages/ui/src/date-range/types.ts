export const DATE_RANGE_PRESETS = [
  "today",
  "last_7_days",
  "last_30_days",
  "this_month",
  "this_quarter",
  "year_to_date",
  "custom",
] as const;

export type DateRangePreset = (typeof DATE_RANGE_PRESETS)[number];

export type DateRangeValue = {
  preset: DateRangePreset;
  /** Inclusive range start (start of day in local or provided IANA timezone). */
  start: Date;
  /** Inclusive range end (end of reference day for presets; end of day for custom). */
  end: Date;
};

export type ResolveDateRangeOptions = {
  referenceDate?: Date;
  timeZone?: string;
  customStart?: Date;
  customEnd?: Date;
};

export type DateRangeFormatLabels = {
  singleDay: string;
  sameMonth: string;
  sameYear: string;
  crossYear: string;
  monthYear: string;
  quarterYear: string;
};

export type DateRangeFormatters = {
  formatRangeSubtitle: (start: Date, end: Date, preset?: DateRangePreset) => string;
  formatMonthYear: (date: Date) => string;
  formatQuarterYear: (start: Date, end: Date) => string;
};
