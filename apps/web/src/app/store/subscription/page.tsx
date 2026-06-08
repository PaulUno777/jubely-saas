"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  KpiTile,
  KpiTileStrip,
} from "@jubely/ui";
import { useTranslations } from "next-intl";
import { SubscriptionBanner } from "@/components/store/subscription-banner";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { authedJson } from "@/lib/http";

type SubscriptionView = {
  plan_code: string;
  status: string;
  billing_period: string;
  trial_ends_at?: string;
  current_period_end?: string;
  plan?: {
    name: string;
    max_stores: number;
    price_monthly_fcfa: number;
    price_yearly_fcfa: number;
  };
};

export default function StoreSubscriptionPage() {
  const t = useTranslations("store.subscription");
  const { headerContext } = useMerchantLocationScope();
  const [sub, setSub] = useState<SubscriptionView | null>(null);
  const [invoice, setInvoice] = useState<{
    pay_reference?: string;
    amount_fcfa?: number;
    instructions?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"month" | "year">("month");

  useEffect(() => {
    void authedJson<SubscriptionView>("/v1/organizations/me/subscription")
      .then(setSub)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, []);

  async function requestMoMo() {
    setError(null);
    try {
      const inv = await authedJson<{
        pay_reference: string;
        amount_fcfa: number;
        instructions: string;
      }>("/v1/organizations/me/subscription/momo-invoice", { method: "POST" });
      setInvoice(inv);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("invoiceError"));
    }
  }

  const price =
    period === "year"
      ? sub?.plan?.price_yearly_fcfa
      : sub?.plan?.price_monthly_fcfa;

  return (
    <MerchantPageShell title={t("title")} context={headerContext} className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      <SubscriptionBanner />

      <div className="flex gap-1 rounded-[10px] bg-secondary p-1 w-fit">
        {(["month", "year"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={period === value ? "default" : "ghost"}
            onClick={() => setPeriod(value)}
          >
            {value === "month" ? t("monthly") : t("yearly")}
          </Button>
        ))}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {sub ? (
        <>
          <Card className="overflow-hidden border-0 bg-[#1A1610] text-[#F2EBDC]">
            <CardContent className="flex flex-wrap items-center gap-4 p-5">
              <div className="flex-1">
                <p className="text-xs tracking-[0.1em] text-[#E8E2D5]/60 uppercase">{t("currentPlan")}</p>
                <p className="font-serif text-3xl font-medium italic">{sub.plan?.name ?? sub.plan_code}</p>
              </div>
              <div className="text-right text-sm text-[#E8E2D5]/75">
                <Badge variant="outline" className="border-[#E8E2D5]/20 text-[#F2EBDC]">
                  {sub.status}
                </Badge>
                {sub.trial_ends_at ? (
                  <p className="mt-2">
                    {t("trialEnds")} {new Date(sub.trial_ends_at).toLocaleDateString()}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <KpiTileStrip>
            <KpiTile
              label={t("priceLabel")}
              value={price ? `${price.toLocaleString()} F` : "—"}
              tone="gold"
            />
            <KpiTile
              label={t("storesLimit")}
              value={sub.plan?.max_stores ?? "—"}
              tone="teal"
            />
            <KpiTile label={t("billingPeriod")} value={sub.billing_period} tone="emerald" />
          </KpiTileStrip>
        </>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("paymentTitle")}</CardTitle>
          <CardDescription>{t("paymentDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button type="button" onClick={() => void requestMoMo()}>
            {t("requestMomo")}
          </Button>
          {invoice?.pay_reference ? (
            <div className="rounded-xl border border-dashed p-4 text-sm">
              <p className="font-mono text-lg">{invoice.pay_reference}</p>
              <p>{invoice.amount_fcfa?.toLocaleString()} FCFA</p>
              <p className="mt-2 text-muted-foreground">{invoice.instructions}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </MerchantPageShell>
  );
}
