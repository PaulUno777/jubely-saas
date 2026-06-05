"use client";

import type { ReactNode } from "react";
import { MerchantKpiCard, type MerchantKpiTone } from "@/components/store/merchant-kpi-card";

export type MerchantKpiItem = {
  key: string;
  label: string;
  value: string | number;
  hint?: string;
  tone: MerchantKpiTone;
  icon?: ReactNode;
};

type MerchantKpiStripProps = {
  items: MerchantKpiItem[];
};

export function MerchantKpiStrip({ items }: MerchantKpiStripProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <MerchantKpiCard
          key={item.key}
          label={item.label}
          value={String(item.value)}
          detail={item.hint}
          tone={item.tone}
        />
      ))}
    </div>
  );
}
