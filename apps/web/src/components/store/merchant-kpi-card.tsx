"use client";

import {
  AdminKpiCard,
  type AdminKpiCardProps,
  type KpiTone,
} from "@/components/dashboard/admin-kpi-card";

export type MerchantKpiTone = Extract<KpiTone, "growth" | "reward" | "teal" | "danger">;

export type MerchantKpiCardProps = Omit<AdminKpiCardProps, "portal" | "tone" | "live" | "liveLabel"> & {
  tone: MerchantKpiTone;
};

export function MerchantKpiCard(props: MerchantKpiCardProps) {
  return <AdminKpiCard {...props} />;
}
