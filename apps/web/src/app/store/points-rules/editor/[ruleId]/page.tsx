"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTenantRules } from "@/hooks/tenant-admin-hooks";
import { RuleEditorShell } from "@/components/store/rules/rule-editor-shell";
import { normalizeTierList } from "@/components/store/rules/shared/tier-normalize";
import { useRuleEditorStore, type AdvancedRuleDraft, type BasicRuleDraft } from "@/stores/rule-editor-store";

export default function EditRuleEditorPage() {
  const router = useRouter();
  const params = useParams();
  const ruleId = String(params.ruleId);
  const rulesQ = useTenantRules();
  const initFromServer = useRuleEditorStore((s) => s.initFromServer);

  useEffect(() => {
    const row = rulesQ.data?.find((r) => r.id === ruleId);
    if (!row) return;
    const r = row.rule;
    if (r.editorTier === "advanced" || (r.schemaVersion ?? 0) >= 2) {
      const draft: AdvancedRuleDraft = {
        schemaVersion: 2,
        editorTier: "advanced",
        id: r.id,
        name: r.name,
        on: r.on,
        trigger: (r.trigger as AdvancedRuleDraft["trigger"]) ?? "transaction",
        tag: r.tag ?? "Avancé",
        logic: r.logic ?? "AND",
        conditions: (r.conditions ?? []).map((c) =>
          c.type === "tier" ? { ...c, tiers: normalizeTierList(c.tiers) } : c,
        ),
        actions: r.actions ?? [],
      };
      initFromServer(draft, ruleId);
      return;
    }
    const action = r.action;
    const draft: BasicRuleDraft = {
      schemaVersion: 1,
      editorTier: "basic",
      id: r.id,
      name: r.name,
      on: r.on,
      trigger: (r.trigger as BasicRuleDraft["trigger"]) ?? "transaction",
      tag: r.tag ?? "Base",
      ruleType:
        action?.type === "mult" ? "mult" : action?.type === "flat" ? "bonus" : "base",
      days: r.cond?.days ?? [0, 1, 2, 3, 4, 5, 6],
      tier: r.cond?.tier ?? "all",
      minAmount: r.cond?.minAmount ?? 0,
      per: action?.per ?? 100,
      pts: action?.pts ?? 1,
      factor: action?.factor ?? 2,
      bonusPts: action?.pts ?? 200,
      bonusTrigger: r.trigger === "enroll" ? "enroll" : "birthday",
      hourFrom: r.cond?.hours?.[0] ?? 17,
      hourTo: r.cond?.hours?.[1] ?? 19,
    };
    initFromServer(draft, ruleId);
  }, [rulesQ.data, ruleId, initFromServer]);

  if (rulesQ.isLoading) return null;

  return <RuleEditorShell ruleId={ruleId} onBack={() => router.push("/store/points-rules")} />;
}
