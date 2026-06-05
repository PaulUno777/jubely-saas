"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label } from "@jubely/ui";
import type { QrBranding } from "@jubely/api-schemas";
import { ApiResponseError } from "@jubely/api-schemas";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTenantId } from "@/hooks/useTenantId";
import { putQRBranding } from "@/lib/tenant-admin";

type QRBrandingFormProps = {
  branding: QrBranding | undefined;
};

export function QRBrandingForm({ branding }: QRBrandingFormProps) {
  const t = useTranslations("store.enrollmentQr");
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const [accentColor, setAccentColor] = useState("#2563eb");
  const [variant, setVariant] = useState("default");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (!branding?.branding) return;
    setAccentColor(branding.branding.accent_color ?? accentColor);
    setVariant(branding.branding.variant ?? variant);
    setTheme(branding.branding.theme ?? theme);
  }, [branding]);

  const saveMut = useMutation({
    mutationFn: () =>
      putQRBranding(tenantId!, {
        variant,
        theme,
        accent_color: accentColor,
        font_family: branding?.branding.font_family ?? "system-ui",
        layout_json: branding?.branding.layout_json ?? {},
        section_toggles: branding?.branding.section_toggles ?? {},
        copy: branding?.copy ?? {},
      }),
    onSuccess: () => {
      toast.success(t("brandingSaved"));
      void qc.invalidateQueries({ queryKey: ["tenant-admin", "qr-branding"] });
    },
    onError: (e) =>
      toast.error(e instanceof ApiResponseError ? e.message : t("brandingSaveError")),
  });

  return (
    <div className="grid gap-4 max-w-md rounded-lg border border-border p-4">
      <p className="text-sm font-medium">{t("brandingTitle")}</p>
      <div className="grid gap-2">
        <Label htmlFor="qr-variant">{t("brandingVariant")}</Label>
        <Input id="qr-variant" value={variant} onChange={(e) => setVariant(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="qr-theme">{t("brandingTheme")}</Label>
        <Input id="qr-theme" value={theme} onChange={(e) => setTheme(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="qr-accent">{t("brandingAccent")}</Label>
        <Input id="qr-accent" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
      </div>
      <Button type="button" size="sm" disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
        {t("brandingSave")}
      </Button>
    </div>
  );
}
