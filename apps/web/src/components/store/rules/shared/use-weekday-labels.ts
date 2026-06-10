"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { WEEKDAY_INDICES } from "@/components/store/rules/shared/constants";

export function useWeekdayLabels() {
  const t = useTranslations("store.pointsRules");
  return useMemo(
    () => WEEKDAY_INDICES.map((i) => t(`weekdaysShort.${i}` as "weekdaysShort.0")),
    [t],
  );
}
