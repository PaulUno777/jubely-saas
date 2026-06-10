"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge, Button } from "@jubely/ui";
import { ArrowLeft, Lock, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ApiResponseError } from "@jubely/api-schemas";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { AdvancedEditor } from "@/components/store/rules/advanced-editor";
import { BasicEditor } from "@/components/store/rules/basic-editor";
import { RuleVersionHistory } from "@/components/store/rules/rule-version-history";
import { useCollapseSidebarForEditor } from "@/hooks/useCollapseSidebarForEditor";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { createRule, patchRule } from "@/lib/tenant-admin";
import { useTenantId } from "@/hooks/useTenantId";
import { draftToApiRule, useRuleEditorStore } from "@/stores/rule-editor-store";

export function RuleEditorShell({
  ruleId,
  onBack,
}: {
  ruleId?: string;
  onBack: () => void;
}) {
  const t = useTranslations("store.pointsRules");
  const { headerContext } = useMerchantLocationScope();
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const mode = useRuleEditorStore((s) => s.mode);
  const draft = useRuleEditorStore((s) => s.draft);
  const isDirty = useRuleEditorStore((s) => s.isDirty);
  const markSaved = useRuleEditorStore((s) => s.markSaved);

  useCollapseSidebarForEditor();

  const saveMut = useMutation({
    mutationFn: async () => {
      const rule = draftToApiRule(draft);
      if (mode === "edit" && ruleId) {
        return patchRule(tenantId!, ruleId, { rule, summary: "Mise à jour" });
      }
      return createRule(tenantId!, { rule, active: true, summary: "Création" });
    },
    onSuccess: () => {
      markSaved();
      void qc.invalidateQueries({ queryKey: ["tenant-admin", "rules"] });
      void qc.invalidateQueries({ queryKey: ["tenant-admin", "rules-health"] });
      toast.success(mode === "edit" ? t("ruleSaved") : t("ruleCreated"));
      onBack();
    },
    onError: (e) =>
      toast.error(e instanceof ApiResponseError ? e.message : t("ruleSaveError")),
  });

  const handleBack = () => {
    if (isDirty && !window.confirm(t("unsavedChanges"))) return;
    onBack();
  };

  const ruleTitle =
    draft.name || (draft.editorTier === "advanced" ? t("newAdvancedRule") : t("newBasicRule"));

  return (
    <MerchantPageShell title={t("editorTitle")} context={headerContext} className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-1 size-4" />
          {t("editorCancel")}
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            {t("title")} / {t("editorTitle")}
          </p>
          <h2 className="truncate text-xl font-semibold">{ruleTitle}</h2>
        </div>
        <Badge variant={draft.editorTier === "advanced" ? "default" : "secondary"}>
          {draft.editorTier === "advanced" ? (
            <span className="inline-flex items-center gap-1">
              <Zap className="size-3" />
              {t("advancedEditorGrowth")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3" />
              {t("basicEditorStandard")}
            </span>
          )}
        </Badge>
        <Button type="button" disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
          {mode === "edit" ? t("editorSave") : t("editorCreate")}
        </Button>
      </div>

      {draft.editorTier === "advanced" ? <AdvancedEditor /> : <BasicEditor />}
      {ruleId ? <RuleVersionHistory ruleId={ruleId} /> : null}
    </MerchantPageShell>
  );
}
