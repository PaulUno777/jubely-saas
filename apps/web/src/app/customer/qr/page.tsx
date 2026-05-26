"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import { pwaGetWallet } from "@/lib/customerApi";
import { IconChevronLeft, IconFlash } from "@/components/agent/icons";
import { IconBookmark, IconQrCode } from "@/components/customer/icons";
import { clearSession, useSessionStore } from "@/lib/session";

export default function CustomerQrPage() {
  const t = useTranslations("customer.qr");
  const router = useRouter();
  const session = useSessionStore((state) => state.session);

  const { data } = useQuery({
    queryKey: ["pwa", "wallet", session?.activeEnrollmentId],
    enabled: Boolean(session?.activeEnrollmentId),
    queryFn: () => pwaGetWallet(),
  });

  const name = "Customer";

  return (
    <div data-portal="customer" style={{ position: "fixed", inset: 0, background: "var(--c-card)", color: "var(--c-cream)", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: 0, cursor: "pointer", color: "var(--c-cream)", display: "flex", alignItems: "center", justifyContent: "center" }} type="button">
          <IconChevronLeft size={20} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 600 }}>{t("title")}</span>
        <button style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: 0, cursor: "pointer", color: "var(--c-cream)", display: "flex", alignItems: "center", justifyContent: "center" }} type="button" aria-label="Torch">
          <IconFlash size={18} />
        </button>
      </div>

      {/* Member heading */}
      <div style={{ padding: "14px 24px 0", textAlign: "center" }}>
        <div style={{ fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
          {t("memberLabel")}
        </div>
        <div style={{ fontFamily: "var(--jubely-font-display)", fontStyle: "italic", fontSize: 26, color: "var(--c-cream)", marginTop: 6, lineHeight: 1.1 }}>
          {data?.tenant_name ?? name}
        </div>
      </div>

      {/* QR code */}
      <div style={{ display: "flex", justifyContent: "center", margin: "24px auto 0" }}>
        {data?.customer_qr ? (
          <div style={{ background: "var(--c-cream)", borderRadius: 28, padding: 16, boxShadow: "0 18px 40px rgba(0,0,0,0.35)" }}>
            <QRCodeCanvas value={data.customer_qr} size={220} />
          </div>
        ) : (
          <div style={{ width: 252, height: 252, background: "rgba(255,255,255,0.06)", borderRadius: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 20, textAlign: "center" }}>
            <IconQrCode size={40} color="rgba(255,255,255,0.3)" />
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 }}>{t("empty")}</p>
          </div>
        )}
      </div>

      {/* Hint */}
      <div style={{ padding: "20px 28px 0", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--jubely-font-display)", fontStyle: "italic", fontSize: 22, color: "var(--c-gold-2)", lineHeight: 1.15 }}>
          {t("hint")}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "20px 16px 16px", marginTop: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button type="button" style={{ appearance: "none", border: 0, cursor: "pointer", padding: "14px 12px", borderRadius: 16, background: "rgba(255,255,255,0.08)", color: "var(--c-cream)", fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <IconBookmark size={16} /> {t("shortcut")}
        </button>
        <button
          type="button"
          onClick={async () => { if (data?.customer_qr) { await navigator.clipboard.writeText(data.customer_qr); toast.success(t("copied")); } }}
          style={{ appearance: "none", border: 0, cursor: "pointer", padding: "14px 12px", borderRadius: 16, background: "var(--c-gold-2)", color: "var(--c-card)", fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          {t("copy")}
        </button>
      </div>

      {data?.customer_qr && (
        <div style={{ paddingBottom: 16, textAlign: "center" }}>
          <button type="button" onClick={() => { clearSession(); router.push("/customer/wallet"); }}
            style={{ appearance: "none", border: 0, background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            {t("clear")}
          </button>
        </div>
      )}
    </div>
  );
}
