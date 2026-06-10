"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@jubely/ui";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { z } from "zod";
import type { loyaltyRuleSchema } from "@jubely/api-schemas";
import { simulateRules } from "@/lib/tenant-admin";
import { useTenantId } from "@/hooks/useTenantId";
import { DAYS_FR, simDateFromDayHour } from "@/components/store/rules/advanced-editor-helpers";

type LoyaltyRule = z.infer<typeof loyaltyRuleSchema>;

export function SimulatorPanel({
  fallbackDefault = true,
  draftRules,
}: {
  fallbackDefault?: boolean;
  draftRules?: LoyaltyRule[];
}) {
  const t = useTranslations("store.pointsRules");
  const tenantId = useTenantId();
  const [amount, setAmount] = useState("5000");
  const [tier, setTier] = useState("or");
  const [day, setDay] = useState(5);
  const [hour, setHour] = useState(18);
  const [isNew, setIsNew] = useState(false);

  const simMut = useMutation({
    mutationFn: () =>
      simulateRules(tenantId!, {
        amount_fcfa: parseInt(amount, 10) || 0,
        tier,
        is_new: isNew,
        occurred_at: simDateFromDayHour(day, hour),
        fallback_default: fallbackDefault,
        draft_rules: draftRules,
      }),
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("simulatorTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label>{t("amount")}</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>{t("tier")}</Label>
            <select
              className="h-10 rounded-md border bg-background px-2 text-sm"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
            >
              <option value="bronze">Bronze</option>
              <option value="argent">Argent</option>
              <option value="or">Or</option>
              <option value="platine">Platine</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-1">
            {DAYS_FR.map((d, i) => (
              <button
                key={d}
                type="button"
                className={`rounded-md px-2 py-1 text-xs font-medium ${day === i ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                onClick={() => setDay(i)}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="grid gap-2">
            <Label>
              {hour}h00
            </Label>
            <input
              type="range"
              min={8}
              max={23}
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
            {t("newCustomer")}
          </label>
          <Button type="button" disabled={simMut.isPending} onClick={() => simMut.mutate()}>
            {t("simulate")}
          </Button>
        </CardContent>
      </Card>

      {simMut.data ? (
        <div className="space-y-4">
          <Card className="border-emerald-200 bg-linear-to-br from-emerald-50 to-background">
            <CardContent className="flex flex-wrap items-center gap-6 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  {t("pointsAwarded")}
                </p>
                <p className="font-serif text-5xl text-emerald-800">+{simMut.data.total}</p>
              </div>
              <div className="ml-auto flex gap-6 text-sm">
                <div>
                  <p className="font-mono text-lg font-medium">{simMut.data.base}</p>
                  <p className="text-muted-foreground">base</p>
                </div>
                <div>
                  <p className="font-mono text-lg font-medium text-amber-700">×{simMut.data.factor}</p>
                  <p className="text-muted-foreground">mult.</p>
                </div>
                <div>
                  <p className="font-mono text-lg font-medium text-teal-700">+{simMut.data.bonus}</p>
                  <p className="text-muted-foreground">bonus</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("traceTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {simMut.data.trace.map((row, i) => (
                <div
                  key={`${row.rule_id}-${i}`}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${row.applied ? "bg-muted/40" : "opacity-55"}`}
                >
                  <div
                    className={`flex size-6 items-center justify-center rounded-full ${row.applied ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    {row.applied ? <Check className="size-3.5" /> : <X className="size-3" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{row.rule_name}</p>
                    <p className="text-xs text-muted-foreground">{row.detail ?? row.reason}</p>
                  </div>
                  {row.pts ? (
                    <Badge variant={row.pts.startsWith("×") ? "outline" : "default"}>{row.pts}</Badge>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
