"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiResponseError, type CreateCustomerForm } from "@jubely/api-schemas";
import { staffCreateCustomer } from "@/lib/staffApi";
import { IconChevronLeft, IconUser, IconPhone, IconMail, IconCheck, IconScan } from "@/components/agent/icons";

function Field({ label, value, onChange, icon: Icon, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  placeholder?: string; type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ background: "var(--a-cream-2)", borderRadius: 14, padding: "12px 14px", boxShadow: focused ? "0 0 0 2px var(--a-card) inset" : "none" }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--a-ink-mut)", letterSpacing: "0.06em", textTransform: "uppercase" as const, display: "block", marginBottom: 4 }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon size={16} color="var(--a-ink-mut)" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ background: "transparent", border: 0, outline: 0, fontFamily: "inherit", fontSize: 16, color: "var(--a-ink)", flex: 1, padding: 0 }}
        />
      </div>
    </div>
  );
}

export default function NewClientPage() {
  const t = useTranslations("agent.newClient");
  const tc = useTranslations("agent.customers");
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+237 ");
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const canSubmit = name.trim().length > 1 && phone.replace(/\D/g, "").length >= 9;

  const mut = useMutation({
    mutationFn: () => {
      const values: CreateCustomerForm = { name: name.trim(), phone: phone.trim(), email: email.trim() };
      return staffCreateCustomer({ values });
    },
    onSuccess: () => setSuccess(true),
    onError: (e) => toast.error(e instanceof ApiResponseError ? e.message : t("error")),
  });

  if (success) return <SuccessScreen t={t} name={name} phone={phone} router={router} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--a-cream-2)", border: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} type="button">
          <IconChevronLeft size={20} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 600 }}>{t("title")}</span>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: "6px 20px 12px" }}>
        <div style={{ fontFamily: "var(--jubely-font-display)", fontStyle: "italic", fontSize: 24, lineHeight: 1.15, color: "var(--a-ink)" }}>{t("intro")}</div>
        <div style={{ fontSize: 13, color: "var(--a-ink-mut)", marginTop: 6 }}>{t("hintSms")}</div>
      </div>

      <div style={{ padding: "6px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        <Field label={tc("name")}  value={name}  onChange={setName}  icon={IconUser}  placeholder="Ex. Patricia Mballa" />
        <Field label={tc("phone")} value={phone} onChange={setPhone} icon={IconPhone} type="tel" />
        <Field label={tc("email")} value={email} onChange={setEmail} icon={IconMail}  placeholder="prenom@exemple.com" type="email" />

        {/* Bonus card */}
        <div style={{ background: "var(--a-cream)", border: "1px solid var(--a-line)", borderRadius: 18, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--a-gold-bg)", color: "var(--a-gold-3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>★</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--a-ink)" }}>{t("bonusTitle")}</div>
            <div style={{ fontSize: 11.5, color: "var(--a-ink-mut)" }}>{t("bonusSub")}</div>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "var(--a-gold-bg)", color: "var(--a-gold-3)", fontSize: 11, fontWeight: 600 }}>
            {t("bonusLabel")}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6, marginBottom: 8 }}>
          <button type="button" disabled={!canSubmit || mut.isPending} onClick={() => mut.mutate()}
            style={{ width: "100%", background: "var(--a-card)", color: "var(--a-cream)", borderRadius: 16, padding: "14px 20px", fontSize: 15, fontWeight: 600, border: 0, cursor: "pointer", opacity: canSubmit && !mut.isPending ? 1 : 0.35 }}>
            {mut.isPending ? t("submitting") : t("submit")}
          </button>
          <button type="button" onClick={() => router.back()}
            style={{ width: "100%", background: "transparent", color: "var(--a-ink)", borderRadius: 16, padding: "14px 20px", fontSize: 15, fontWeight: 600, border: "1px solid rgba(26,24,20,0.12)", cursor: "pointer" }}>
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({ t, name, phone, router }: {
  t: ReturnType<typeof useTranslations<"agent.newClient">>;
  name: string; phone: string;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px 24px", gap: 22 }}>
      <div className="a-pop-in" style={{ width: 96, height: 96, borderRadius: "50%", background: "var(--a-mint)", color: "var(--a-green)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 14px rgba(220,234,223,0.6)" }}>
        <IconCheck size={42} strokeWidth={2} />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--a-green)", fontWeight: 600 }}>{t("successLabel")}</div>
        <div style={{ fontFamily: "var(--jubely-font-display)", fontStyle: "italic", fontSize: 36, color: "var(--a-ink)", lineHeight: 1.05, marginTop: 6 }}>{t("successTitle")}</div>
        <div style={{ fontSize: 14, color: "var(--a-ink-mut)", marginTop: 8, maxWidth: 290 }}>{t("successBody")}</div>
      </div>
      <div style={{ background: "var(--a-cream-2)", borderRadius: 22, padding: 16, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "var(--a-mint)", color: "var(--a-green)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700 }}><IconUser size={20} color="var(--a-green)" /></div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{name}</div>
            <div style={{ fontSize: 12, color: "var(--a-ink-mut)" }}>{phone}</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--a-ink-mut)", lineHeight: 1.5, borderTop: "0.5px solid var(--a-line)", paddingTop: 10 }}>{t("successHint")}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: "auto" }}>
        <button type="button" onClick={() => router.push("/agent/scanner?mode=award")}
          style={{ width: "100%", background: "var(--a-card)", color: "var(--a-cream)", borderRadius: 16, padding: "14px 20px", fontSize: 15, fontWeight: 600, border: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <IconScan size={18} /> {t("scanFirst")}
        </button>
        <button type="button" onClick={() => router.push("/agent/customers")}
          style={{ width: "100%", background: "transparent", color: "var(--a-ink)", borderRadius: 16, padding: "14px 20px", fontSize: 15, fontWeight: 600, border: "1px solid rgba(26,24,20,0.12)", cursor: "pointer" }}>
          {t("seeDirectory")}
        </button>
      </div>
    </div>
  );
}
