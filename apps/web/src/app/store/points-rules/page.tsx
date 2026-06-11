"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@jubely/ui";
import { Eye, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { ConflictDock } from "@/components/store/rules/conflict-dock";
import { RulesList } from "@/components/store/rules/rules-list";
import { RulesPlanBanner } from "@/components/store/rules/rules-plan-banner";
import { RulesSimulatorDialog } from "@/components/store/rules/rules-simulator-dialog";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { useTenantRules, useTenantTiers } from "@/hooks/tenant-admin-hooks";
import { getSubscription } from "@/lib/tenant-admin";
import { useTenantId } from "@/hooks/useTenantId";

export default function StorePointsRulesPage() {
  const t = useTranslations("store.pointsRules");
  const { headerContext } = useMerchantLocationScope();
  const tenantId = useTenantId();
  const [tab, setTab] = useState("rules");
  const [simOpen, setSimOpen] = useState(false);
  const rulesQ = useTenantRules();
  const tiersQ = useTenantTiers();

  const subQ = useQuery({
    queryKey: ["tenant-admin", "subscription", tenantId],
    enabled: Boolean(tenantId),
    queryFn: () => getSubscription(tenantId!),
  });
  const advanced = Boolean(
    (subQ.data?.plan?.features as { advanced_rules?: boolean } | undefined)?.advanced_rules,
  );

  return (
    <MerchantPageShell title={t("title")} context={headerContext} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setSimOpen(true)}>
            <Eye className="mr-1 size-4" />
            {t("simulateTab")}
          </Button>
          <Button type="button" size="sm" asChild>
            <Link href="/store/points-rules/editor">
              <Plus className="mr-1 size-4" />
              {advanced ? t("openEditor") : t("createRule")}
            </Link>
          </Button>
        </div>
      </div>

      <RulesPlanBanner />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="rules">{t("tabRules")}</TabsTrigger>
          <TabsTrigger value="tiers">{t("tabTiers")}</TabsTrigger>
          <TabsTrigger value="simulation">{t("tabSimulation")}</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <div className="flex min-h-[420px] flex-col gap-4">
              {rulesQ.isError ? (
                <p className="text-sm text-destructive">{t("loadError")}</p>
              ) : (
                <RulesList rules={rulesQ.data ?? []} loading={rulesQ.isLoading} />
              )}
              <ConflictDock refreshKey={rulesQ.dataUpdatedAt} />
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("howItWorks")}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{t("howItWorksBody")}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("impactTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">—</CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tiers" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {(tiersQ.data ?? []).map((tier) => (
              <Card key={tier.id}>
                <CardContent className="p-4">
                  <p className="font-serif text-xl">{tier.code}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("tierMinPoints")}: {tier.min_points}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="simulation" className="mt-4 space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-6">
              <div>
                <p className="font-semibold">{t("simulatorTitle")}</p>
                <p className="text-sm text-muted-foreground">{t("simulatorDescription")}</p>
              </div>
              <Button type="button" onClick={() => setSimOpen(true)}>
                {t("openSimulator")}
              </Button>
            </CardContent>
          </Card>
          <ConflictDock refreshKey={rulesQ.dataUpdatedAt} />
        </TabsContent>
      </Tabs>

      <RulesSimulatorDialog open={simOpen} onOpenChange={setSimOpen} />
    </MerchantPageShell>
  );
}
