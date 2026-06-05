"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, Button } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { toast } from "sonner";
import { ApiResponseError } from "@jubely/api-schemas";
import { QRBrandingForm } from "@/components/store/qr-branding-form";
import { QRPreviewPanel } from "@/components/store/qr-preview-panel";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { useQRBranding, useTenantQRToken } from "@/hooks/tenant-admin-hooks";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { useTenantId } from "@/hooks/useTenantId";
import { qrRenderSvgUrl } from "@/lib/tenant-admin";

export default function StoreEnrollmentQrPage() {
  const t = useTranslations("store.enrollmentQr");
  const { headerContext } = useMerchantLocationScope();
  const tenantId = useTenantId();

  const tenantQ = useTenantSettings();
  const qrQ = useTenantQRToken();
  const brandingQ = useQRBranding();

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined" || !tenantQ.data?.slug) return "";
    return `${window.location.origin}/join/${tenantQ.data.slug}`;
  }, [tenantQ.data?.slug]);

  const token = qrQ.data?.store_qr ?? "";
  const loading = tenantQ.isLoading || qrQ.isLoading;
  const renderUrl = tenantId ? qrRenderSvgUrl(tenantId) : undefined;

  const onCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <MerchantPageShell title={t("title")} context={headerContext}>
      <Card>
        <CardHeader>
          <CardTitle>{t("cardTitle")}</CardTitle>
          <CardDescription>{t("cardDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          ) : qrQ.error ? (
            <p className="text-sm text-destructive">
              {qrQ.error instanceof ApiResponseError ? qrQ.error.message : t("loadError")}
            </p>
          ) : (
            <Tabs defaultValue="preview">
              <TabsList>
                <TabsTrigger value="preview">{t("tabPreview")}</TabsTrigger>
                <TabsTrigger value="branding">{t("tabBranding")}</TabsTrigger>
                <TabsTrigger value="token">{t("tabToken")}</TabsTrigger>
              </TabsList>
              <TabsContent value="preview" className="mt-4">
                <QRPreviewPanel
                  token={token}
                  joinUrl={joinUrl}
                  renderSvgUrl={renderUrl}
                  tenantName={tenantQ.data?.name}
                />
              </TabsContent>
              <TabsContent value="branding" className="mt-4">
                <QRBrandingForm branding={brandingQ.data} />
              </TabsContent>
              <TabsContent value="token" className="mt-4 space-y-3">
                <p className="text-sm font-medium">{t("storeToken")}</p>
                <Textarea readOnly rows={4} className="font-mono text-xs" value={token} />
                <Button type="button" variant="outline" size="sm" onClick={() => void onCopy(token)}>
                  {t("copyToken")}
                </Button>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </MerchantPageShell>
  );
}
