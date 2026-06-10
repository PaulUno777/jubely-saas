"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { listRuleVersions, restoreRuleVersion } from "@/lib/tenant-admin";
import { useTenantId } from "@/hooks/useTenantId";

export function RuleVersionHistory({ ruleId }: { ruleId: string }) {
  const t = useTranslations("store.pointsRules");
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const versionsQ = useQuery({
    queryKey: ["tenant-admin", "rule-versions", tenantId, ruleId],
    enabled: Boolean(tenantId && ruleId),
    queryFn: () => listRuleVersions(tenantId!, ruleId),
  });

  const restoreMut = useMutation({
    mutationFn: (versionId: string) => restoreRuleVersion(tenantId!, ruleId, versionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tenant-admin", "rules"] });
      void qc.invalidateQueries({ queryKey: ["tenant-admin", "rule-versions", tenantId, ruleId] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("versionHistory")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {(versionsQ.data ?? []).map((v) => (
          <div key={v.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
            <div>
              <p className="font-medium">v{v.version_number}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(v.created_at).toLocaleString()}
                {v.change_summary ? ` · ${v.change_summary}` : ""}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={restoreMut.isPending}
              onClick={() => restoreMut.mutate(v.id)}
            >
              {t("restoreVersion")}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
