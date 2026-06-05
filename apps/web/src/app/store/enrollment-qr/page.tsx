"use client";

import { useQuery } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Textarea } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Main } from "@/components/layout/main";
import { StorePageHeader } from "@/components/store/store-page-header";
import { useSession } from "@/hooks/useSession";
import { storeGetStoreQR, storeGetTenant } from "@/lib/storeApi";
import { ApiResponseError } from "@jubely/api-schemas";

export default function StoreEnrollmentQrPage() {
  const t = useTranslations("store.enrollmentQr");
  const { session } = useSession();
  const [copied, setCopied] = useState(false);

  const tenantQ = useQuery({
    queryKey: ["store", "tenant", session?.tenantId],
    enabled: Boolean(session),
    queryFn: () => storeGetTenant(),
  });

  const qrQ = useQuery({
    queryKey: ["store", "qr"],
    enabled: Boolean(session),
    queryFn: () => storeGetStoreQR(),
  });

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined" || !tenantQ.data?.slug) return "";
    return `${window.location.origin}/join/${tenantQ.data.slug}`;
  }, [tenantQ.data?.slug]);

  const token = qrQ.data?.store_qr ?? "";

  const onCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <>
      <StorePageHeader title={t("title")} />
      <Main>
        <Card>
          <CardHeader>
            <CardTitle>{t("cardTitle")}</CardTitle>
            <CardDescription>{t("cardDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {qrQ.isLoading || tenantQ.isLoading ? (
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            ) : qrQ.error ? (
              <p className="text-sm text-destructive">
                {qrQ.error instanceof ApiResponseError ? qrQ.error.message : t("loadError")}
              </p>
            ) : (
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <div className="rounded-xl border border-border bg-background p-4 inline-block">
                  {token ? <QRCodeCanvas value={token} size={200} /> : null}
                </div>
                <div className="flex-1 space-y-3 min-w-0">
                  <div>
                    <p className="text-sm font-medium mb-1">{t("joinLink")}</p>
                    <p className="text-xs text-muted-foreground break-all">{joinUrl || "—"}</p>
                    {joinUrl ? (
                      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => void onCopy(joinUrl)}>
                        {copied ? t("copied") : t("copyJoin")}
                      </Button>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">{t("storeToken")}</p>
                    <Textarea readOnly rows={4} className="font-mono text-xs" value={token} />
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => void onCopy(token)}>
                      {t("copyToken")}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </Main>
    </>
  );
}
