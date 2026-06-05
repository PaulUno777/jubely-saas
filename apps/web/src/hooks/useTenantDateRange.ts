"use client";

import { defaultDateRangeValue, type DateRangeValue } from "@jubely/ui";
import { useMemo, useState } from "react";
import { toIsoRange } from "@/lib/dateRangeQuery";

export function useTenantDateRange(initialPreset: DateRangeValue["preset"] = "last_7_days") {
  const [dateRange, setDateRange] = useState(() => defaultDateRangeValue(initialPreset));
  const isoRange = useMemo(() => toIsoRange(dateRange), [dateRange]);
  return { dateRange, setDateRange, isoRange };
}
