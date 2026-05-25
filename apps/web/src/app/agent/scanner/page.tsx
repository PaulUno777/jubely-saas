"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { QrCamera, useIsMobile } from "@/components/agent/qr-camera";
import { IconChevronLeft, IconFlash } from "@/components/agent/icons";

type ScanMode = "award" | "validate";

export default function ScannerPage() {
  const t = useTranslations("agent.scanner");
  const router = useRouter();
  const params = useSearchParams();
  const isMobile = useIsMobile();

  const [mode, setMode] = useState<ScanMode>((params.get("mode") as ScanMode) ?? "award");
  const [phone, setPhone] = useState("");

  function handleDetect(raw: string) {
    const extracted = extractPhone(raw);
    if (mode === "award") {
      router.push(`/agent/purchase?phone=${encodeURIComponent(extracted ?? raw)}`);
    }
  }

  function handleManualProceed() {
    if (!phone.trim()) return;
    router.push(`/agent/purchase?phone=${encodeURIComponent(phone.trim())}`);
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "var(--a-card)", color: "var(--a-cream)",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <button
          onClick={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", color: "var(--a-cream)", border: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          type="button"
        >
          <IconChevronLeft size={20} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 600 }}>{t("title")}</span>
        <button
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", color: "var(--a-cream)", border: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          type="button"
          aria-label="Torch"
        >
          <IconFlash size={18} />
        </button>
      </div>

      {/* Mode segmented control */}
      <div style={{ padding: "4px 20px 10px" }}>
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: 4, display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          {(["award", "validate"] as ScanMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              type="button"
              style={{
                appearance: "none", border: 0, cursor: "pointer",
                background: mode === m ? "var(--a-cream)" : "transparent",
                color: mode === m ? "var(--a-ink)" : "rgba(255,255,255,0.7)",
                borderRadius: 11, padding: "10px 12px",
                fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                transition: "background .15s, color .15s",
              }}
            >
              {m === "award" ? t("modeAward") : t("modeValidate")}
            </button>
          ))}
        </div>
      </div>

      {/* Camera or desktop fallback */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", gap: 24 }}>
        {isMobile ? (
          <QrCamera onDetect={handleDetect} />
        ) : (
          <DesktopPlaceholder t={t} />
        )}

        <div style={{ textAlign: "center", maxWidth: 260 }}>
          <div style={{ fontFamily: "var(--jubely-font-display)", fontStyle: "italic", fontSize: 22, color: "var(--a-gold-2)", lineHeight: 1.15 }}>
            {mode === "award" ? t("aimAward") : t("aimValidate")}
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", marginTop: 6, lineHeight: 1.5 }}>
            {mode === "award" ? t("hintAward") : t("hintValidate")}
          </div>
        </div>

        {/* Manual phone entry */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {t("manualEntry")}
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("phonePlaceholder")}
              type="tel"
              style={{ background: "transparent", border: 0, outline: 0, fontFamily: "inherit", fontSize: 16, color: "var(--a-cream)", padding: 0, width: "100%" }}
            />
          </div>
          <button
            className="a-btn"
            onClick={handleManualProceed}
            disabled={!phone.trim()}
            type="button"
            style={{ background: "var(--a-gold-2)", color: "var(--a-card)", borderRadius: 16, padding: "14px 20px", fontSize: 15, fontWeight: 600, border: 0, cursor: "pointer", opacity: phone.trim() ? 1 : 0.4 }}
          >
            {t("proceed")}
          </button>
        </div>
      </div>
    </div>
  );
}

function DesktopPlaceholder({ t }: { t: ReturnType<typeof useTranslations<"agent.scanner">> }) {
  return (
    <div style={{ width: 240, height: 240, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "rgba(255,255,255,0.05)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", padding: 24, textAlign: "center" }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--a-gold-2)", margin: 0 }}>{t("notMobile")}</p>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5 }}>{t("notMobileHint")}</p>
    </div>
  );
}

function extractPhone(raw: string): string | null {
  const e164 = raw.match(/\+\d{7,15}/);
  return e164?.[0] ?? null;
}
