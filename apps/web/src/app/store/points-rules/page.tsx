"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@jubely/ui";
import { ApiResponseError } from "@jubely/api-schemas";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { useTenantRules, useTenantTiers } from "@/hooks/tenant-admin-hooks";
import { useTenantId } from "@/hooks/useTenantId";
import { simulateRules, validateRules } from "@/lib/tenant-admin";

export default function StorePointsRulesPage() {
  const t = useTranslations("store.pointsRules");
  const { headerContext } = useMerchantLocationScope();
  const tenantId = useTenantId();
  const [amount, setAmount] = useState("5000");
  const [tier, setTier] = useState("bronze");

  const rulesQ = useTenantRules();
  const tiersQ = useTenantTiers();

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
      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">{t("tabRules")}</TabsTrigger>
          <TabsTrigger value="tiers">{t("tabTiers")}</TabsTrigger>
          <TabsTrigger value="simulation">{t("tabSimulation")}</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={validateMut.isPending}
              onClick={() => validateMut.mutate()}
            >
              {t("validateRules")}
            </Button>
          </div>
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
          <Card>
            <CardHeader>
              <CardTitle>{t("listTitle")}</CardTitle>
              <CardDescription>{t("listDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("trigger")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rulesQ.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-sm text-muted-foreground">
                        {t("loading")}
                      </TableCell>
                    </TableRow>
                  ) : rulesQ.data?.length ? (
                    rulesQ.data.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.rule.name}</TableCell>
                        <TableCell>{row.rule.trigger}</TableCell>
                        <TableCell>
                          <Badge variant={row.active && row.rule.on ? "default" : "secondary"}>
                            {row.active && row.rule.on ? t("active") : t("inactive")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-sm text-muted-foreground">
                        {t("empty")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("tiersTitle")}</CardTitle>
              <CardDescription>{t("tiersDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("tierCode")}</TableHead>
                    <TableHead>{t("tierMinPoints")}</TableHead>
                    <TableHead>{t("tierColor")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiersQ.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-sm text-muted-foreground">
                        {t("loading")}
                      </TableCell>
                    </TableRow>
                  ) : tiersQ.data?.length ? (
                    tiersQ.data.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.code}</TableCell>
                        <TableCell className="font-mono tabular-nums">{row.min_points}</TableCell>
                        <TableCell>
                          <span
                            className="inline-block size-4 rounded-full border border-border"
                            style={{ backgroundColor: row.color }}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.active ? "default" : "secondary"}>
                            {row.active ? t("active") : t("inactive")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-sm text-muted-foreground">
                        {t("tiersEmpty")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("simulatorTitle")}</CardTitle>
              <CardDescription>{t("simulatorDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 max-w-md">
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
              {simMut.data && (
                <p className="text-sm font-medium">
                  {t("simulateResult", { total: String(simMut.data.total) })}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MerchantPageShell>
  );
}
