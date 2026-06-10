"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge, Button } from "@jubely/ui";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { deleteRule, patchRule } from "@/lib/tenant-admin";
import { useTenantId } from "@/hooks/useTenantId";
import type { z } from "zod";
import type { storeRuleRecordSchema } from "@jubely/api-schemas";

type RuleRow = z.infer<typeof storeRuleRecordSchema>;

export function RulesList({
  rules,
  loading,
}: {
  rules: RuleRow[];
  loading?: boolean;
}) {
  const t = useTranslations("store.pointsRules");
  const tenantId = useTenantId();
  const qc = useQueryClient();

  const patchMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      patchRule(tenantId!, id, { active }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tenant-admin", "rules"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteRule(tenantId!, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tenant-admin", "rules"] });
      void qc.invalidateQueries({ queryKey: ["tenant-admin", "rules-health"] });
      toast.success(t("ruleDeleted"));
    },
  });

  if (loading) return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  if (!rules.length) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;

  return (
    <div className="space-y-2">
      {rules.map((row, index) => {
        const frozen = row.frozen || row.editor_tier === "advanced" && row.frozen_at;
        return (
          <div
            key={row.id}
            className={`flex items-start gap-3 rounded-xl border p-4 ${frozen ? "opacity-70" : ""}`}
          >
            <span className="mt-1 font-mono text-xs text-muted-foreground">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{row.rule.name}</p>
                {row.rule.tag ? <Badge variant="outline">{row.rule.tag}</Badge> : null}
                {row.editor_tier === "advanced" ? (
                  <Badge variant="secondary">{t("tagAdvanced")}</Badge>
                ) : null}
                {frozen ? <Badge variant="destructive">{t("tagFrozen")}</Badge> : null}
              </div>
              <p className="text-xs text-muted-foreground">{row.rule.trigger}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={row.active && row.rule.on}
                disabled={Boolean(frozen) || patchMut.isPending}
                onChange={(e) => patchMut.mutate({ id: row.id, active: e.target.checked })}
              />
              <Button size="icon" variant="ghost" asChild disabled={Boolean(frozen)}>
                <Link href={`/store/points-rules/editor/${row.id}`}>
                  <Pencil className="size-4" />
                </Link>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                disabled={deleteMut.isPending}
                onClick={() => deleteMut.mutate(row.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
