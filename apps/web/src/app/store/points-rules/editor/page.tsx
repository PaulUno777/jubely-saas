"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RuleEditorShell } from "@/components/store/rules/rule-editor-shell";
import { useRuleEditorStore } from "@/stores/rule-editor-store";
import { getSubscription } from "@/lib/tenant-admin";
import { useTenantId } from "@/hooks/useTenantId";

export default function NewRuleEditorPage() {
  const tenantId = useTenantId();
  const search = useSearchParams();
  const router = useRouter();
  const initCreate = useRuleEditorStore((s) => s.initCreate);

  const subQ = useQuery({
    queryKey: ["tenant-admin", "subscription", tenantId],
    enabled: Boolean(tenantId),
    queryFn: () => getSubscription(tenantId!),
  });

  const advanced = Boolean(
    (subQ.data?.plan?.features as { advanced_rules?: boolean } | undefined)?.advanced_rules,
  );

  useEffect(() => {
    if (subQ.isLoading) return;
    const forceBasic = search.get("new") === "base";
    initCreate(forceBasic || !advanced ? "basic" : "advanced");
  }, [subQ.isLoading, advanced, initCreate, search]);

  if (subQ.isLoading) return null;

  return <RuleEditorShell onBack={() => router.push("/store/points-rules")} />;
}
