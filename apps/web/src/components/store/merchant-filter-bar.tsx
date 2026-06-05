"use client";

import type { DateRangeValue } from "@jubely/ui";
import { Badge } from "@jubely/ui";
import { DateRangeSelectorI18n } from "@/components/shared/date-range-selector-i18n";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";

type MerchantFilterBarProps = {
  dateRange?: DateRangeValue;
  onDateRangeChange?: (value: DateRangeValue) => void;
  showLocation?: boolean;
  children?: React.ReactNode;
};

export function MerchantFilterBar({
  dateRange,
  onDateRangeChange,
  showLocation = true,
  children,
}: MerchantFilterBarProps) {
  const { activeLocation, sidebarLocationLabel } = useMerchantLocationScope();

  return (
    <div className="flex flex-wrap items-center gap-3">
      {dateRange && onDateRangeChange ? (
        <DateRangeSelectorI18n value={dateRange} onChange={onDateRangeChange} />
      ) : null}
      {showLocation && activeLocation ? (
        <Badge variant="outline" className="font-normal">
          {sidebarLocationLabel}
        </Badge>
      ) : null}
      {children}
    </div>
  );
}
