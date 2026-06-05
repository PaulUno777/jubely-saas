"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiResponseError } from "@jubely/api-schemas";
import { staffValidateRedemption } from "@/lib/staffApi";
import { IconChevronLeft, IconCheck, IconClose } from "@/components/agent/icons";

export default function ValidatePage() {
  const t = useTranslations("agent.validate");
  const router = useRouter();
  const params = useSearchParams();
  const claimQr = params.get("claim_qr") ?? "";

  const [result, setResult] = useState<{
    rewardName: string;
    customerName: string;
    displayCode: string;
    pointsSpent: number;
  } | null>(null);

  const mut = useMutation({
    mutationFn: () => staffValidateRedemption(claimQr),
    onSuccess: (out) =>
      setResult({
        rewardName: out.reward_name,
        customerName: out.customer_name,
        displayCode: out.display_code,
        pointsSpent: out.points_spent,
      }),
    onError: (e) => toast.error(e instanceof ApiResponseError ? e.message : t("error")),
  });

  if (!claimQr) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>{t("missingQr")}</p>
        <button type="button" onClick={() => router.push("/agent/scanner?mode=validate")} className="a-btn" style={{ marginTop: 16 }}>
          {t("backScanner")}
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", padding: 20 }}>
        <div style={{ textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--a-mint)", color: "var(--a-green)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconCheck size={32} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{t("successTitle")}</h1>
          <p style={{ fontSize: 14, color: "var(--a-ink-mut)", margin: 0 }}>{result.rewardName}</p>
          <p style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700 }}>{result.displayCode}</p>
          <p style={{ fontSize: 13 }}>{result.customerName} · −{result.pointsSpent} pts</p>
        </div>
        <button type="button" className="a-btn" onClick={() => router.push("/agent")} style={{ width: "100%", padding: 14, borderRadius: 16, background: "var(--a-gold-2)", border: 0, fontWeight: 600, cursor: "pointer" }}>
          {t("done")}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div className="a-scr-top">
        <button onClick={() => router.back()} type="button" style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--a-cream-2)", border: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconChevronLeft size={20} />
        </button>
        <span className="a-scr-title">{t("title")}</span>
        <button onClick={() => router.push("/agent")} type="button" style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--a-cream-2)", border: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconClose size={18} />
        </button>
      </div>
      <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
        <p style={{ textAlign: "center", fontSize: 14, color: "var(--a-ink-mut)" }}>{t("confirmHint")}</p>
        <button
          type="button"
          className="a-btn"
          disabled={mut.isPending}
          onClick={() => mut.mutate()}
          style={{ width: "100%", padding: 14, borderRadius: 16, background: "var(--a-gold-2)", border: 0, fontWeight: 600, cursor: "pointer", opacity: mut.isPending ? 0.6 : 1 }}
        >
          {mut.isPending ? "…" : t("confirm")}
        </button>
      </div>
    </div>
  );
}
