"use client";

import { Button } from "@jubely/ui";
import { Download, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { toast } from "sonner";
import { MerchantDashboardLocationSelect } from "@/components/store/merchant-dashboard-location-select";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { useSession } from "@/hooks/useSession";

type MerchantDashboardWelcomeProps = {
  periodLabel?: string;
};

export function MerchantDashboardWelcome({ periodLabel }: MerchantDashboardWelcomeProps) {
  const t = useTranslations("store.home");
  const { session } = useSession();
  const { tenantName } = useMerchantLocationScope();

  const raw = session?.email?.split("@")[0]?.replace(/[._]/g, " ") ?? "";
  const name = raw.length > 0 ? raw.charAt(0).toUpperCase() + raw.slice(1) : "…";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <h2 className="font-serif italic text-2xl font-medium leading-tight text-foreground sm:text-3xl">
          {t("welcome.greeting", { name })}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("welcome.subtitle", {
            tenant: tenantName,
            period: periodLabel ?? "—",
          })}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => toast.info(t("welcome.exportToast"))}
        >
          <Download className="size-4" />
          {t("welcome.export")}
        </Button>
        <MerchantDashboardLocationSelect />
        <Button asChild size="default" className="gap-1.5">
          <Link href="/store/points-rules">
            <Plus className="size-4" />
            {t("welcome.newRule")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
