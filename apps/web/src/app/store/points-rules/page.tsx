"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  Input,
  Label,
  ListCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@jubely/ui";
import { ApiResponseError } from "@jubely/api-schemas";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { useTenantRules, useTenantTiers } from "@/hooks/tenant-admin-hooks";
import { useTenantId } from "@/hooks/useTenantId";
import { createRule, patchRule, simulateRules, upsertTier, validateRules } from "@/lib/tenant-admin";

export default function StorePointsRulesPage() {
  const t = useTranslations("store.pointsRules");
  const { headerContext } = useMerchantLocationScope();
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("5000");
  const [tier, setTier] = useState("bronze");
  const [newRuleName, setNewRuleName] = useState("Standard purchase");
  const [tierCode, setTierCode] = useState("gold");
  const [tierMinPoints, setTierMinPoints] = useState("5000");

  const rulesQ = useTenantRules();
  const tiersQ = useTenantTiers();

  const createRuleMut = useMutation({
    mutationFn: () =>
      createRule(tenantId!, {
        rule: {
          id: crypto.randomUUID(),
          name: newRuleName,
          trigger: "purchase",
          on: true,
          cond: { days: [0, 1, 2, 3, 4, 5, 6], tier: "all" },
          action: { type: "rate", per: 100, pts: 1 },
        },
        priority: (rulesQ.data?.length ?? 0) + 1,
        active: true,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tenant-admin", "rules"] });
      toast.success(t("ruleCreated"));
    },
    onError: (e) => toast.error(e instanceof ApiResponseError ? e.message : t("ruleCreateError")),
  });

  const patchRuleMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      patchRule(tenantId!, id, { active }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tenant-admin", "rules"] }),
  });

  const upsertTierMut = useMutation({
    mutationFn: () =>
      upsertTier(tenantId!, {
        code: tierCode,
        min_points: parseInt(tierMinPoints, 10) || 0,
        color: "#C89B3C",
        active: true,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tenant-admin", "tiers"] });
      toast.success(t("tierSaved"));
    },
    onError: (e) => toast.error(e instanceof ApiResponseError ? e.message : t("tierSaveError")),
  });

  const simMut = useMutation({
    mutationFn: () =>
      simulateRules(tenantId!, {
        amount_fcfa: parseInt(amount, 10) || 0,
        tier,
        is_new: false,
      }),
    onError: (e) => toast.error(e instanceof ApiResponseError ? e.message : t("simulateError")),
  });

  const validateMut = useMutation({
    mutationFn: () => validateRules(tenantId!),
    onError: (e) => toast.error(e instanceof ApiResponseError ? e.message : t("validateError")),
  });

  return (
    <MerchantPageShell title={t("title")} context={headerContext} className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("subtitle")}</p>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">{t("tabRules")}</TabsTrigger>
          <TabsTrigger value="tiers">{t("tabTiers")}</TabsTrigger>
          <TabsTrigger value="simulation">{t("tabSimulation")}</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-4 space-y-4">
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={validateMut.isPending}
              onClick={() => validateMut.mutate()}
            >
              {t("validateRules")}
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={createRuleMut.isPending}
              onClick={() => createRuleMut.mutate()}
            >
              <Plus size={14} />
              {t("createRule")}
            </Button>
          </div>
          <Input
            value={newRuleName}
            onChange={(e) => setNewRuleName(e.target.value)}
            placeholder={t("newRuleName")}
            className="max-w-md"
          />
          {validateMut.data?.conflicts?.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("conflictsTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {validateMut.data.conflicts.map((c, i) => (
                  <div key={i} className="rounded-md border border-border p-2 text-sm">
                    <Badge variant={c.level === "error" ? "destructive" : "outline"}>
                      {c.level}
                    </Badge>
                    <span className="ml-2">{c.msg}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
          <ListCard title={t("listTitle")} description={t("listDescription")}>
            <DataTable
              columns={[
                {
                  key: "name",
                  header: t("name"),
                  cell: (row) => <span className="font-medium">{row.rule.name}</span>,
                },
                {
                  key: "trigger",
                  header: t("trigger"),
                  cell: (row) => row.rule.trigger,
                },
                {
                  key: "status",
                  header: t("status"),
                  cell: (row) => (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={row.active && row.rule.on}
                        disabled={patchRuleMut.isPending}
                        onChange={(e) =>
                          patchRuleMut.mutate({ id: row.id, active: e.target.checked })
                        }
                      />
                      {row.active && row.rule.on ? t("active") : t("inactive")}
                    </label>
                  ),
                },
              ]}
              rows={rulesQ.data ?? []}
              rowKey={(row) => row.id}
              loading={rulesQ.isLoading}
              error={rulesQ.error}
              loadingLabel={t("loading")}
              errorLabel={t("loadError")}
              emptyLabel={t("empty")}
            />
          </ListCard>
        </TabsContent>

        <TabsContent value="tiers" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("upsertTierTitle")}</CardTitle>
              <CardDescription>{t("tiersDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="grid max-w-md gap-3">
              <div className="grid gap-2">
                <Label>{t("tierCode")}</Label>
                <Input value={tierCode} onChange={(e) => setTierCode(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t("tierMinPoints")}</Label>
                <Input
                  type="number"
                  value={tierMinPoints}
                  onChange={(e) => setTierMinPoints(e.target.value)}
                />
              </div>
              <Button
                type="button"
                disabled={upsertTierMut.isPending}
                onClick={() => upsertTierMut.mutate()}
              >
                {t("saveTier")}
              </Button>
            </CardContent>
          </Card>
          <ListCard title={t("tiersTitle")} description={t("tiersDescription")}>
            <DataTable
              columns={[
                { key: "code", header: t("tierCode"), cell: (row) => row.code },
                {
                  key: "min",
                  header: t("tierMinPoints"),
                  cell: (row) => <span className="font-mono tabular-nums">{row.min_points}</span>,
                },
                {
                  key: "color",
                  header: t("tierColor"),
                  cell: (row) => (
                    <span
                      className="inline-block size-4 rounded-full border border-border"
                      style={{ backgroundColor: row.color }}
                    />
                  ),
                },
                {
                  key: "status",
                  header: t("status"),
                  cell: (row) => (
                    <Badge variant={row.active ? "default" : "secondary"}>
                      {row.active ? t("active") : t("inactive")}
                    </Badge>
                  ),
                },
              ]}
              rows={tiersQ.data ?? []}
              rowKey={(row) => row.id}
              loading={tiersQ.isLoading}
              error={tiersQ.error}
              loadingLabel={t("loading")}
              errorLabel={t("loadError")}
              emptyLabel={t("tiersEmpty")}
            />
          </ListCard>
        </TabsContent>

        <TabsContent value="simulation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("simulatorTitle")}</CardTitle>
              <CardDescription>{t("simulatorDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="grid max-w-md gap-4">
              <div className="grid gap-2">
                <Label>{t("amount")}</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t("tier")}</Label>
                <Input value={tier} onChange={(e) => setTier(e.target.value)} />
              </div>
              <Button type="button" disabled={simMut.isPending} onClick={() => simMut.mutate()}>
                {t("simulate")}
              </Button>
              {simMut.data ? (
                <p className="text-sm font-medium">
                  {t("simulateResult", { total: String(simMut.data.total) })}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MerchantPageShell>
  );
}
