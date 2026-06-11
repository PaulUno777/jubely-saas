"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { validateRules } from "@/lib/tenant-admin";
import { useTenantId } from "@/hooks/useTenantId";
import { draftToApiRule, type RuleDraft } from "@/stores/rule-editor-store";

export type RuleConflict = {
  level: "warn" | "error" | "info";
  rules?: string[] | null;
  msg: string;
};

export function useRuleValidation(draft: RuleDraft, excludeRuleId?: string) {
  const tenantId = useTenantId();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validateMut = useMutation({
    mutationFn: () =>
      validateRules(tenantId!, {
        draft_rules: [draftToApiRule(draft)],
        exclude_rule_id: excludeRuleId,
      }),
  });

  const draftKey = useMemo(() => JSON.stringify(draftToApiRule(draft)), [draft]);

  useEffect(() => {
    if (!tenantId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      validateMut.mutate();
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, draftKey, excludeRuleId]);

  const conflicts = validateMut.data?.conflicts ?? [];
  const errors = conflicts.filter((c) => c.level === "error");
  const warnings = conflicts.filter((c) => c.level === "warn");

  return {
    valid: validateMut.data?.valid ?? false,
    conflicts,
    errors,
    warnings,
    isValidating: validateMut.isPending,
  };
}
