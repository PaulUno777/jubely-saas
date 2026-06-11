"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@jubely/ui";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRuleValidation } from "@/components/store/rules/hooks/use-rule-validation";
import { RulesSimulatorDialog } from "@/components/store/rules/rules-simulator-dialog";
import { useRuleEditorActions } from "@/components/store/rules/rule-editor-actions-context";
import { draftToApiRule, useRuleEditorStore } from "@/stores/rule-editor-store";

type RuleEditorFooterProps = {
  conditionsCount?: number;
  actionsCount?: number;
};

export function RuleEditorFooter({ conditionsCount, actionsCount }: RuleEditorFooterProps) {
  const t = useTranslations("store.pointsRules");
  const draft = useRuleEditorStore((s) => s.draft);
  const { onSave, savePending, mode, excludeRuleId } = useRuleEditorActions();
  const { valid, errors, warnings, isValidating } = useRuleValidation(draft, excludeRuleId);

  const [jsonOpen, setJsonOpen] = useState(false);
  const [simOpen, setSimOpen] = useState(false);

  const hasWarnings = warnings.length > 0;
  const showCounts = conditionsCount !== undefined && actionsCount !== undefined;

  const statusBadge = isValidating ? (
    <Badge variant="outline" className="text-muted-foreground">
      {t("ruleChecking")}
    </Badge>
  ) : !valid ? (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="size-3" />
      {errors[0]?.msg ?? t("ruleInvalid")}
    </Badge>
  ) : hasWarnings ? (
    <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-800">
      <AlertTriangle className="size-3" />
      {t("ruleHasWarnings")}
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 border-emerald-300 text-emerald-700">
      <CheckCircle2 className="size-3" />
      {t("ruleValid")}
    </Badge>
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-t bg-muted/20 px-4 py-3">
        {statusBadge}
        {showCounts ? (
          <span className="text-xs text-muted-foreground">
            {conditionsCount} {t("conditionsCount")} · {actionsCount} {t("actionsCount")}
          </span>
        ) : null}
        {hasWarnings && !isValidating ? (
          <ul className="w-full text-xs text-amber-800">
            {warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-1">
                <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                {w.msg}
              </li>
            ))}
          </ul>
        ) : null}
        {!valid && !isValidating && errors.length > 1 ? (
          <ul className="w-full text-xs text-destructive">
            {errors.slice(1).map((e, i) => (
              <li key={i}>{e.msg}</li>
            ))}
          </ul>
        ) : null}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setJsonOpen(true)}>
            {"{ }"} {t("viewJson")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setSimOpen(true)}>
            {t("testWithData")}
          </Button>
          <Button type="button" size="sm" disabled={!valid || savePending || isValidating} onClick={onSave}>
            {mode === "edit" ? t("editorSave") : t("editorCreate")}
          </Button>
        </div>
      </div>

      <Dialog open={jsonOpen} onOpenChange={setJsonOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("viewJson")}</DialogTitle>
          </DialogHeader>
          <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">
            {JSON.stringify(draftToApiRule(draft), null, 2)}
          </pre>
        </DialogContent>
      </Dialog>

      <RulesSimulatorDialog
        open={simOpen}
        onOpenChange={setSimOpen}
        draftRules={[draftToApiRule(draft)]}
        fallbackDefault={draft.editorTier !== "advanced"}
      />
    </>
  );
}
