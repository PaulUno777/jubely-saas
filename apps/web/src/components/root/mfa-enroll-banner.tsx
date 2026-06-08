"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@jubely/ui";
import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { authedJson } from "@/lib/http";
import { useSession } from "@/hooks/useSession";

type MfaList = { items: { enabled_at?: string | null }[] };

export function MfaEnrollBanner() {
  const t = useTranslations("security.mfaBanner");
  const { session } = useSession();
  const adminPortal = session?.role === "superadmin" || session?.role === "merchant_admin";
  const q = useQuery({
    queryKey: ["me", "mfa", "banner"],
    enabled: Boolean(adminPortal),
    queryFn: () => authedJson<MfaList>("/v1/me/mfa", { method: "GET" }),
  });

  const hasEnabled = Boolean(q.data?.items?.some((f) => f.enabled_at));
  if (q.isLoading || q.isError || hasEnabled) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-4 text-primary" />
        <span>
          <span className="font-medium">{t("title")}</span> — {t("body")}
        </span>
      </div>
      <Button size="sm" variant="secondary" asChild>
        <Link href="/account/security">{t("action")}</Link>
      </Button>
    </div>
  );
}
