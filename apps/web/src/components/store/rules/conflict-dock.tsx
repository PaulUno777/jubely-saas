"use client";

import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { validateRules } from "@/lib/tenant-admin";
import { useTenantId } from "@/hooks/useTenantId";

export function ConflictDock({ refreshKey }: { refreshKey: string | number }) {
  const t = useTranslations("store.pointsRules");
  const tenantId = useTenantId();
  const validateMut = useMutation({
    mutationFn: () => validateRules(tenantId!),
  });

  useEffect(() => {
    if (tenantId) validateMut.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, refreshKey]);

  const conflicts = validateMut.data?.conflicts ?? [];

  return (
    <Card className="mt-auto border-t-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("conflictDockTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {validateMut.isPending ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : conflicts.length === 0 ? (
          <p className="text-sm text-emerald-700">{t("noConflicts")}</p>
        ) : (
          conflicts.map((c, i) => (
            <div key={i} className="rounded-md border p-2 text-sm">
              <Badge variant={c.level === "error" ? "destructive" : "outline"}>{c.level}</Badge>
              <span className="ml-2">{c.msg}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
