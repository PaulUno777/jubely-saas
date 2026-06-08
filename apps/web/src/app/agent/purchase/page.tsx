"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiResponseError } from "@jubely/api-schemas";
import { staffRecordPurchase } from "@/lib/staffApi";
import { Numpad, applyNumpadKey } from "@/components/agent/numpad";
import { IconChevronLeft, IconClose, IconCheck, IconChevronRight } from "@/components/agent/icons";

const RULE_LABEL = "1 pt / 100 FCFA";
const PTS_RATE = 100;

function calcPoints(amount: number) {
  return Math.floor(amount / PTS_RATE);
}

export default function PurchasePage() {
  const t = useTranslations("agent.purchase");
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";
  const customerQr = params.get("customer_qr") ?? "";
  const customerLabel = phone || (customerQr ? t("enrolledCustomer") : "");

  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<{ pts: number; delta: number; balanceAfter?: number } | null>(null);

  const num = parseInt(amount || "0", 10);
  const pts = calcPoints(num);

  const mut = useMutation({
    mutationFn: () =>
      staffRecordPurchase({
        values: {
          phone: phone || undefined,
          customer_qr: customerQr || undefined,
          amount_fcfa: num,
        },
      }),
    onSuccess: (out) =>
      setResult({
        pts: out.points_awarded,
        delta: out.delta,
        balanceAfter: out.balance_after,
      }),
    onError: (e) => toast.error(e instanceof ApiResponseError ? e.message : t("error")),
  });

  if (result)
    return (
      <AwardSuccess
        t={t}
        phone={customerLabel}
        amount={num}
        pts={result.pts}
        balanceAfter={result.balanceAfter}
        onReset={() => {
          setResult(null);
          setAmount("");
        }}
        router={router}
      />
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      {/* Top bar */}
      <div className="a-scr-top">
        <button onClick={() => router.back()} className="a-scr-back" type="button" style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--a-cream-2)", border: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconChevronLeft size={20} />
        </button>
        <span className="a-scr-title">{t("title")}</span>
        <button onClick={() => router.push("/agent")} style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--a-cream-2)", border: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} type="button">
          <IconClose size={18} />
        </button>
      </div>

      {/* Customer card */}
      <div style={{ padding: "4px 16px 0" }}>
        <div className="a-card-cream" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "var(--a-gold-bg)", color: "var(--a-gold-3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
            {customerLabel ? customerLabel.slice(-2) : "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customerLabel || "—"}</div>
            <div style={{ fontSize: 12, color: "var(--a-ink-mut)", marginTop: 2 }}>{t("enrolledCustomer")}</div>
          </div>
          <IconCheck size={18} color="var(--a-green)" />
        </div>
      </div>

      {/* Amount display */}
      <div style={{ padding: "24px 20px 4px", textAlign: "center" }}>
        <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--a-ink-mut)", fontWeight: 600, marginBottom: 4 }}>
          {t("purchaseAmount")}
        </div>
        <div style={{ fontFamily: "var(--jubely-font-display)", fontStyle: "italic", fontSize: 56, lineHeight: 1, color: "var(--a-ink)" }}>
          {num ? num.toLocaleString("fr-FR") : "0"}
          <span style={{ fontSize: 22, color: "var(--a-ink-mut)", marginLeft: 8 }}>FCFA</span>
        </div>
        <div style={{ marginTop: 10 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 999, fontSize: 12.5,
            background: pts > 0 ? "var(--a-mint)" : "var(--a-cream-2)",
            color: pts > 0 ? "var(--a-green)" : "var(--a-ink-mut)",
          }}>
            <b style={{ fontWeight: 600 }}>{t("ptsPreview", { pts: String(pts), rule: RULE_LABEL })}</b>
          </span>
        </div>
      </div>

      {/* Numpad */}
      <div style={{ padding: "8px 20px 12px" }}>
        <Numpad onPress={(k) => setAmount((prev) => applyNumpadKey(prev, k))} />
      </div>

      {/* Confirm */}
      <div style={{ padding: "0 16px 16px" }}>
        <button
          type="button"
          onClick={() => mut.mutate()}
          disabled={pts === 0 || mut.isPending || (!phone && !customerQr)}
          style={{
            width: "100%", background: "var(--a-card)", color: "var(--a-cream)",
            borderRadius: 16, padding: "14px 20px", fontSize: 15, fontWeight: 600,
            border: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: pts === 0 || mut.isPending ? 0.35 : 1,
            transition: "opacity .15s",
          }}
        >
          {mut.isPending ? t("submitting") : pts === 1 ? t("awardBtn", { pts: String(pts) }) : t("awardBtnPlural", { pts: String(pts) })}
          {!mut.isPending && <IconChevronRight size={18} />}
        </button>
      </div>
    </div>
  );
}

function AwardSuccess({ t, phone, amount, pts, balanceAfter, onReset, router }: {
  t: ReturnType<typeof useTranslations<"agent.purchase">>;
  phone: string; amount: number; pts: number; balanceAfter?: number;
  onReset: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div style={{ minHeight: "100%", background: "var(--a-card)", color: "var(--a-cream)", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px 24px", gap: 22 }}>
      <div className="a-pop-in" style={{ width: 96, height: 96, borderRadius: "50%", background: "var(--a-gold-2)", color: "var(--a-card)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 14px rgba(212,174,108,0.18)" }}>
        <IconCheck size={48} strokeWidth={2.5} />
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{t("successTitle")}</div>
        <div style={{ fontFamily: "var(--jubely-font-display)", fontStyle: "italic", fontSize: 56, color: "var(--a-gold-2)", lineHeight: 1, marginTop: 4 }}>
          +{pts}<span style={{ fontSize: 22, color: "rgba(255,255,255,0.55)", marginLeft: 6 }}>pts</span>
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 8 }}>
          {t("successBody", { amount: amount.toLocaleString("fr-FR") })} &mdash; <b style={{ color: "var(--a-cream)" }}>{phone}</b>
        </div>
        {balanceAfter !== undefined && (
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
            {t("balanceAfter")}: {balanceAfter.toLocaleString("fr-FR")} pts
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: "auto" }}>
        <button type="button" onClick={onReset} style={{ width: "100%", background: "var(--a-gold-2)", color: "var(--a-card)", borderRadius: 16, padding: "14px 20px", fontSize: 15, fontWeight: 600, border: 0, cursor: "pointer" }}>
          {t("scanNext")}
        </button>
        <button type="button" onClick={() => router.push("/agent")} style={{ width: "100%", background: "transparent", color: "var(--a-cream)", borderRadius: 16, padding: "14px 20px", fontSize: 15, fontWeight: 600, border: "1px solid rgba(255,255,255,0.18)", cursor: "pointer" }}>
          {t("backHome")}
        </button>
      </div>
    </div>
  );
}
