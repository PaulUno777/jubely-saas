"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiResponseError } from "@jubely/api-schemas";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Main } from "@/components/layout/main";
import { StorePageHeader } from "@/components/store/store-page-header";
import { useSession } from "@/hooks/useSession";
import { storeGetTenant, storePatchTenant } from "@/lib/storeApi";

const schema = z.object({
  primaryHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "hex"),
});

export default function StoreBrandingPage() {
  const t = useTranslations("store.branding");
  const { session } = useSession();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["store", "tenant", session?.tenantId],
    enabled: Boolean(session),
    queryFn: () => storeGetTenant(),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { primaryHex: "#1a1a1a" },
  });

  useEffect(() => {
    if (!q.data) return;
    const s = q.data.settings as Record<string, unknown> | undefined;
    const branding = (s?.branding as Record<string, unknown> | undefined) ?? {};
    const raw = typeof branding.primary === "string" ? branding.primary : "#1a1a1a";
    form.reset({ primaryHex: /^#[0-9A-Fa-f]{6}$/.test(raw) ? raw : "#1a1a1a" });
  }, [q.data, form]);

  const mut = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      const prev = (q.data?.settings as Record<string, unknown> | undefined) ?? {};
      const next = {
        ...prev,
        branding: {
          ...((prev.branding as Record<string, unknown> | undefined) ?? {}),
          primary: values.primaryHex,
        },
      };
      return storePatchTenant({
        body: { settings: next },
      });
    },
    onSuccess: () => {
      toast.success(t("saved"));
      void qc.invalidateQueries({ queryKey: ["store", "tenant"] });
    },
    onError: (e) => {
      toast.error(e instanceof ApiResponseError ? e.message : e instanceof Error ? e.message : t("saveError"));
    },
  });

  const logoUrl = q.data?.logo_url;

  return (
    <>
      <StorePageHeader title={t("title")} />
      <Main>
        <Card>
          <CardHeader>
            <CardTitle>{t("cardTitle")}</CardTitle>
            <CardDescription>{t("cardDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 max-w-xl">
            {q.isLoading ? (
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            ) : q.error ? (
              <p className="text-sm text-destructive">{t("loadError")}</p>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("logo")}</p>
                  {logoUrl ? (
                    <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("noLogo")}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{t("logoHint")}</p>
                </div>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="primaryHex"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("primaryColor")}</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input type="color" className="h-10 w-14 p-1" value={field.value} onChange={(e) => field.onChange(e.target.value)} />
                              <Input {...field} className="font-mono" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={mut.isPending}>
                      {mut.isPending ? t("saving") : t("save")}
                    </Button>
                  </form>
                </Form>
              </>
            )}
          </CardContent>
        </Card>
      </Main>
    </>
  );
}
