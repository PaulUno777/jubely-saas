"use client";

import {
  createRangeFormatters,
  DateRangeSelector,
  type DateRangeFormatLabels,
  type DateRangePreset,
  type DateRangeSelectorLabels,
  type DateRangeValue,
} from "@jubely/ui";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";

export type DateRangeSelectorI18nProps = {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  presets?: DateRangePreset[];
  referenceDate?: Date;
  timeZone?: string;
  className?: string;
  disabled?: boolean;
  align?: "start" | "center" | "end";
};

export function useDateRangeFormatters(timeZone?: string) {
  const locale = useLocale();
  const t = useTranslations("common.dateRange");

  const formatLabels: DateRangeFormatLabels = useMemo(
    () => ({
      singleDay: t("formats.singleDay"),
      sameMonth: t("formats.sameMonth"),
      sameYear: t("formats.sameYear"),
      crossYear: t("formats.crossYear"),
      monthYear: t("formats.monthYear"),
      quarterYear: t("formats.quarterYear"),
    }),
    [t],
  );

  return useMemo(
    () => createRangeFormatters(locale, formatLabels, timeZone),
    [locale, formatLabels, timeZone],
  );
}

export function useDateRangeSelectorLabels(): DateRangeSelectorLabels {
  const t = useTranslations("common.dateRange");
  return useMemo(
    () => ({
      sectionTitle: t("sectionTitle"),
      presets: {
        today: t("presets.today"),
        last_7_days: t("presets.last7Days"),
        last_30_days: t("presets.last30Days"),
        this_month: t("presets.thisMonth"),
        this_quarter: t("presets.thisQuarter"),
        year_to_date: t("presets.yearToDate"),
      },
      customRange: t("customRange"),
      customTitle: t("customTitle"),
      startLabel: t("startLabel"),
      endLabel: t("endLabel"),
      apply: t("apply"),
      cancel: t("cancel"),
      invalidRange: t("invalidRange"),
    }),
    [t],
  );
}

export function DateRangeSelectorI18n({
  value,
  onChange,
  presets,
  referenceDate,
  timeZone,
  className,
  disabled,
  align,
}: DateRangeSelectorI18nProps) {
  const labels = useDateRangeSelectorLabels();
  const formatters = useDateRangeFormatters(timeZone);

  const formatPresetSubtitle = useCallback(
    (preset: DateRangePreset, start: Date, end: Date) =>
      formatters.formatRangeSubtitle(start, end, preset),
    [formatters],
  );

  return (
    <DateRangeSelector
      value={value}
      onChange={onChange}
      labels={labels}
      formatPresetSubtitle={formatPresetSubtitle}
      presets={presets}
      referenceDate={referenceDate}
      timeZone={timeZone}
      className={className}
      disabled={disabled}
      align={align}
    />
  );
}

export function useDateRangeSubtitle(value: DateRangeValue, timeZone?: string): string {
  const formatters = useDateRangeFormatters(timeZone);
  return formatters.formatRangeSubtitle(value.start, value.end, value.preset);
}
