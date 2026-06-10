"use client";

import { Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from "@jubely/ui";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRuleEditorStore, type BasicRuleDraft } from "@/stores/rule-editor-store";
import { useWeekdayLabels } from "@/components/store/rules/shared/use-weekday-labels";

export function BasicEditor() {
  const t = useTranslations("store.pointsRules");
  const weekdays = useWeekdayLabels();
  const draft = useRuleEditorStore((s) => s.draft) as BasicRuleDraft;
  const patchDraft = useRuleEditorStore((s) => s.patchDraft);

  const previewPts =
    draft.ruleType === "base"
      ? Math.floor(5000 / Math.max(draft.per, 1)) * draft.pts
      : draft.ruleType === "mult"
        ? `×${draft.factor}`
        : `+${draft.bonusPts}`;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardContent className="space-y-5 p-6">
          <div>
            <Label className="mb-2 block">{t("ruleTypeLabel")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["base", t("ruleTypeBase"), "1 pt / 100 FCFA"],
                  ["mult", t("ruleTypeMult"), "×2, ×3…"],
                  ["bonus", t("ruleTypeBonus"), "+ points fixes"],
                ] as const
              ).map(([type, title, desc]) => (
                <button
                  key={type}
                  type="button"
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors",
                    draft.ruleType === type ? "border-primary bg-primary/5" : "hover:bg-muted/40",
                  )}
                  onClick={() => patchDraft({ ruleType: type })}
                >
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>{t("name")}</Label>
            <Input value={draft.name} onChange={(e) => patchDraft({ name: e.target.value })} />
          </div>

          {draft.ruleType === "base" ? (
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-4">
              <div className="grid gap-2">
                <Label>{t("pointsPer")}</Label>
                <Input
                  type="number"
                  value={draft.pts}
                  onChange={(e) => patchDraft({ pts: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("perAmount")}</Label>
                <Input
                  type="number"
                  value={draft.per}
                  onChange={(e) => patchDraft({ per: Number(e.target.value) || 1 })}
                />
              </div>
              <p className="col-span-2 text-xs text-emerald-700">
                {t("previewExample", { pts: String(previewPts) })}
              </p>
            </div>
          ) : null}

          {draft.ruleType === "mult" ? (
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-amber-50/60 p-4">
              <div className="grid gap-2">
                <Label>×</Label>
                <Input
                  type="number"
                  value={draft.factor}
                  onChange={(e) => patchDraft({ factor: Number(e.target.value) || 1 })}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("hourFrom")}</Label>
                <Input
                  type="number"
                  value={draft.hourFrom}
                  onChange={(e) => patchDraft({ hourFrom: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("hourTo")}</Label>
                <Input
                  type="number"
                  value={draft.hourTo}
                  onChange={(e) => patchDraft({ hourTo: Number(e.target.value) })}
                />
              </div>
            </div>
          ) : null}

          {draft.ruleType === "bonus" ? (
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-teal-50/60 p-4">
              <div className="grid gap-2">
                <Label>{t("bonusPoints")}</Label>
                <Input
                  type="number"
                  value={draft.bonusPts}
                  onChange={(e) => patchDraft({ bonusPts: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("trigger")}</Label>
                <select
                  className="h-10 rounded-md border bg-background px-2 text-sm"
                  value={draft.bonusTrigger}
                  onChange={(e) => patchDraft({ bonusTrigger: e.target.value })}
                >
                  <option value="enroll">{t("bonusTriggerEnroll")}</option>
                  <option value="birthday">{t("bonusTriggerBirthday")}</option>
                </select>
              </div>
            </div>
          ) : null}

          <div>
            <Label className="mb-2 block">{t("activeDays")}</Label>
            <div className="flex flex-wrap gap-1">
              {weekdays.map((d, i) => {
                const on = draft.days.includes(i);
                return (
                  <button
                    key={d}
                    type="button"
                    className={cn(
                      "flex-1 rounded-md px-2 py-2 text-xs font-medium",
                      on ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                    onClick={() =>
                      patchDraft({
                        days: on ? draft.days.filter((x) => x !== i) : [...draft.days, i].sort(),
                      })
                    }
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-xl border p-4">
            <input
              type="checkbox"
              checked={draft.on}
              onChange={(e) => patchDraft({ on: e.target.checked })}
            />
            <div>
              <p className="text-sm font-semibold">{t("activateNow")}</p>
              <p className="text-xs text-muted-foreground">{t("activateNowHint")}</p>
            </div>
          </label>
        </CardContent>
      </Card>

      <Card className="sticky top-20 h-fit">
        <CardHeader>
          <CardTitle className="text-base">{t("previewTitle")}</CardTitle>
          <p className="text-xs text-muted-foreground">{t("previewLive")}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="font-semibold">{draft.name || "—"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {draft.ruleType === "base"
                ? t("previewBase", { pts: String(draft.pts), per: String(draft.per) })
                : draft.ruleType === "mult"
                  ? t("previewMult")
                  : t("previewBonus")}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {draft.days.map((d) => (
                <span key={d} className="rounded-full bg-background px-2 py-0.5 text-xs">
                  {weekdays[d]}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2 rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 size-4 shrink-0" />
            <p>{t("upgradeGrowthHint")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
