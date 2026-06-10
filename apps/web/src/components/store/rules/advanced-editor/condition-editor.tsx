"use client";

import { Button, Input, cn } from "@jubely/ui";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { COND_ICON } from "@/components/store/rules/advanced-editor/icons";
import { useWeekdayLabels } from "@/components/store/rules/advanced-editor/hooks/use-weekday-labels";
import { useTierLabels } from "@/components/store/rules/advanced-editor/hooks/use-tier-labels";
import { TIER_CODES } from "@/components/store/rules/shared/constants";
import type { AdvancedRuleDraft } from "@/stores/rule-editor-store";

type Condition = AdvancedRuleDraft["conditions"][number];

export function ConditionEditor({
  cond,
  onUpdate,
  onRemove,
}: {
  cond: Condition;
  onUpdate: (patch: Partial<Condition>) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("store.pointsRules");
  const weekdays = useWeekdayLabels();
  const { tierLabel } = useTierLabels();

  const titleKey = `cond.${cond.type}.title` as "cond.amount.title";

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <div className="text-muted-foreground">{COND_ICON[cond.type]}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t(titleKey)}</p>
        </div>
        <Button type="button" size="icon" variant="ghost" className="size-7" onClick={onRemove}>
          <X className="size-3.5" />
        </Button>
      </div>
      <div className="space-y-2 bg-muted/30 p-3">
        {cond.type === "amount" ? (
          <div className="flex gap-2">
            <select
              className="h-9 flex-1 rounded-md border bg-background px-2 text-sm"
              value={cond.op ?? ">="}
              onChange={(e) => onUpdate({ op: e.target.value })}
            >
              <option value=">=">{t("opGte")}</option>
              <option value="<=">{t("opLte")}</option>
              <option value="=">{t("opEq")}</option>
            </select>
            <Input
              type="number"
              className="w-28"
              value={cond.value ?? 0}
              onChange={(e) => onUpdate({ value: Number(e.target.value) || 0 })}
            />
          </div>
        ) : null}
        {cond.type === "weekday" ? (
          <div className="flex flex-wrap gap-1">
            {weekdays.map((d, i) => {
              const on = (cond.days ?? []).includes(i);
              return (
                <button
                  key={d}
                  type="button"
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-medium",
                    on ? "bg-primary text-primary-foreground" : "border bg-background",
                  )}
                  onClick={() =>
                    onUpdate({
                      days: on ? (cond.days ?? []).filter((x) => x !== i) : [...(cond.days ?? []), i].sort(),
                    })
                  }
                >
                  {d}
                </button>
              );
            })}
          </div>
        ) : null}
        {cond.type === "hours" ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("hoursFrom")}</span>
            <Input
              type="number"
              className="w-20"
              value={cond.from ?? 0}
              onChange={(e) => onUpdate({ from: Number(e.target.value) })}
            />
            <span className="text-muted-foreground">{t("hoursTo")}</span>
            <Input
              type="number"
              className="w-20"
              value={cond.to ?? 0}
              onChange={(e) => onUpdate({ to: Number(e.target.value) })}
            />
            <span className="text-muted-foreground">{t("hoursUnit")}</span>
          </div>
        ) : null}
        {cond.type === "tier" ? (
          <div className="flex flex-wrap gap-1">
            {TIER_CODES.map((code) => {
              const on = (cond.tiers ?? []).includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs",
                    on ? "border-violet-300 bg-violet-50 text-violet-800" : "bg-background",
                  )}
                  onClick={() =>
                    onUpdate({
                      tiers: on
                        ? (cond.tiers ?? []).filter((x) => x !== code)
                        : [...(cond.tiers ?? []), code],
                    })
                  }
                >
                  {tierLabel(code)}
                </button>
              );
            })}
          </div>
        ) : null}
        {cond.type === "visits" ? (
          <Input
            type="number"
            value={cond.value ?? 0}
            onChange={(e) => onUpdate({ value: Number(e.target.value) || 0 })}
          />
        ) : null}
        {cond.type === "store" ? (
          <select
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            value={cond.store ?? "all"}
            onChange={(e) => onUpdate({ store: e.target.value })}
          >
            <option value="all">{t("storeAll")}</option>
            <option value="hq">{t("storeHq")}</option>
          </select>
        ) : null}
      </div>
    </div>
  );
}
