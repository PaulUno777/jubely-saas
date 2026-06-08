import type { DateRangeValue } from "@jubely/ui";

export type LegacyMetricsPeriod = "7d" | "30d";

/** ISO strings for future `from` / `to` query params. */
export function toIsoRange(value: DateRangeValue): { from: string; to: string } {
  return {
    from: value.start.toISOString(),
    to: value.end.toISOString(),
  };
}

/**
 * Maps UI presets to the legacy metrics `period` param until the API accepts from/to.
 */
export function toLegacyMetricsPeriod(value: DateRangeValue): LegacyMetricsPeriod | null {
  if (value.preset === "last_7_days") return "7d";
  if (value.preset === "last_30_days") return "30d";
  return null;
}
