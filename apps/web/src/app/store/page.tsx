"use client";

import { defaultDateRangeValue } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useDateRangeSubtitle } from "@/components/shared/date-range-selector-i18n";
import { Main } from "@/components/layout/main";
import { MfaEnrollBanner } from "@/components/root/mfa-enroll-banner";
import { MerchantCard } from "@/components/store/merchant-card";
import {
  MerchantDashboardChartSection,
  MerchantDashboardKpiSection,
  MerchantDashboardSidebar,
  MerchantDashboardTeamSection,
  MerchantDashboardWelcomeRow,
} from "@/components/store/merchant-dashboard-sections";
import { StorePageHeader } from "@/components/store/store-page-header";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { useSession } from "@/hooks/useSession";
import {
  useTenantLoyaltyActivity,
  useTenantMetrics,
} from "@/hooks/useTenantMetrics";
import { toLegacyMetricsPeriod } from "@/lib/dateRangeQuery";

export default function StoreHome() {
  const t = useTranslations("store.home");
  const { session } = useSession();
  const { headerContext, activeStoreId } = useMerchantLocationScope();
  const [dateRange, setDateRange] = useState(() => defaultDateRangeValue("last_7_days"));
  const periodLabel = useDateRangeSubtitle(dateRange);
  const legacyPeriod = toLegacyMetricsPeriod(dateRange) ?? "7d";
  const metricsQuery = useTenantMetrics({
    period: legacyPeriod,
    locationId: activeStoreId,
  });
  const activityQuery = useTenantLoyaltyActivity({
    period: legacyPeriod,
    locationId: activeStoreId,
  });

  const dashboardData = {
    metrics: metricsQuery.data,
    activity: activityQuery.data,
    metricsLoading: metricsQuery.isLoading,
    activityLoading: activityQuery.isLoading,
  };

  return (
    <>
      <StorePageHeader title={t("title")} context={headerContext} />
      <Main className="merchant-portal-main space-y-6">
        {session ? <MfaEnrollBanner /> : null}
        <div className="flex flex-col gap-5">
          <MerchantDashboardWelcomeRow
            metrics={dashboardData.metrics}
            periodLabel={periodLabel}
          />
          <MerchantDashboardKpiSection {...dashboardData} periodLabel={periodLabel} />
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="flex min-w-0 flex-col gap-5">
              <MerchantCard>
                <MerchantDashboardChartSection
                  {...dashboardData}
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              </MerchantCard>
              <MerchantCard>
                <MerchantDashboardTeamSection />
              </MerchantCard>
            </div>
            <MerchantDashboardSidebar />
          </div>
        </div>
      </Main>
    </>
  );
}
