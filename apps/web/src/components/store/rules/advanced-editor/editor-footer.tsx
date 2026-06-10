"use client";

import { Badge, Button } from "@jubely/ui";
import { useTranslations } from "next-intl";

type EditorFooterProps = {
  conditionsCount: number;
  actionsCount: number;
  onToggleTest: () => void;
  onQuickSimulate: () => void;
  quickSimPending: boolean;
  simulateResult?: string;
};

export function EditorFooter({
  conditionsCount,
  actionsCount,
  onToggleTest,
  onQuickSimulate,
  quickSimPending,
  simulateResult,
}: EditorFooterProps) {
  const t = useTranslations("store.pointsRules");

  return (
    <div className="flex flex-wrap items-center gap-2 border-t bg-muted/20 px-4 py-3">
      <Badge variant="outline" className="border-emerald-300 text-emerald-700">
        {t("ruleValid")}
      </Badge>
      <span className="text-xs text-muted-foreground">
        {conditionsCount} {t("conditionsCount")} · {actionsCount} {t("actionsCount")}
      </span>
      {simulateResult ? <p className="text-sm font-medium">{simulateResult}</p> : null}
      <div className="ml-auto flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onToggleTest}>
          {t("testWithData")}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={quickSimPending} onClick={onQuickSimulate}>
          {t("quickSimulate")}
        </Button>
      </div>
    </div>
  );
}
