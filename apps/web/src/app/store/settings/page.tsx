"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@jubely/ui";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { useTenantLocales } from "@/hooks/tenant-admin-hooks";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { useTenantId } from "@/hooks/useTenantId";
import { patchSettings, putLocales } from "@/lib/tenant-admin";
import { ApiResponseError } from "@jubely/api-schemas";

const schema = z.object({
  name: z.string().min(1),
  conflict_policy: z.string().min(1),
  allow_staff_self_enrollment: z.boolean(),
  settingsJson: z.string(),
});

export default function StoreSettingsPage() {
  const t = useTranslations("store.settings");
  const { headerContext } = useMerchantLocationScope();
  const tenantId = useTenantId();
  const qc = useQueryClient();

  const q = useTenantSettings();
  const localesQ = useTenantLocales();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      conflict_policy: "FIFO",
      allow_staff_self_enrollment: false,
      settingsJson: "{}",
    },
  });

  useEffect(() => {
    if (!q.data) return;
    form.reset({
      name: q.data.name,
      conflict_policy: q.data.conflict_policy ?? "FIFO",
      allow_staff_self_enrollment: Boolean(q.data.allow_staff_self_enrollment),
      settingsJson: JSON.stringify(q.data.settings ?? {}, null, 2),
    });
  }, [q.data, form]);

  const mut = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      let settings: unknown;
      try {
        settings = JSON.parse(values.settingsJson || "{}");
      } catch {
        throw new Error(t("invalidJson"));
      }
      return patchSettings(tenantId!, {
        name: values.name,
        conflict_policy: values.conflict_policy,
        allow_staff_self_enrollment: values.allow_staff_self_enrollment,
        settings,
      });
    },
    onSuccess: () => {
      toast.success(t("saved"));
      void qc.invalidateQueries({ queryKey: ["tenant-admin", "settings"] });
    },
    onError: (e) => {
      toast.error(
        e instanceof ApiResponseError ? e.message : e instanceof Error ? e.message : t("saveError"),
      );
    },
  });

  return (
    <MerchantPageShell title={t("title")} context={headerContext}>
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{t("tabGeneral")}</TabsTrigger>
          <TabsTrigger value="locales">{t("tabLocales")}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("cardTitle")}</CardTitle>
              <CardDescription>{t("cardDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {q.isLoading ? (
                <p className="text-sm text-muted-foreground">{t("loading")}</p>
              ) : q.error ? (
                <p className="text-sm text-destructive">{t("loadError")}</p>
              ) : (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((v) => mut.mutate(v))}
                    className="space-y-4 max-w-xl"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("name")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="conflict_policy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("conflictPolicy")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="allow_staff_self_enrollment"
                      render={({ field }) => (
                        <FormItem className="rounded-lg border border-border p-4">
                          <div className="space-y-1">
                            <FormLabel>{t("allowStaffSelfEnrollmentLabel")}</FormLabel>
                            <FormDescription>{t("allowStaffSelfEnrollmentHelp")}</FormDescription>
                          </div>
                          <FormControl>
                            <label className="mt-3 flex items-center gap-3 text-sm">
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={(event) => field.onChange(event.target.checked)}
                              />
                              <span>{t("allowStaffSelfEnrollmentToggle")}</span>
                            </label>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="settingsJson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("settingsJson")}</FormLabel>
                          <FormControl>
                            <Textarea rows={10} className="font-mono text-sm" {...field} />
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locales" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("localesTitle")}</CardTitle>
              <CardDescription>{t("localesDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {localesQ.isLoading ? (
                <p className="text-sm text-muted-foreground">{t("loading")}</p>
              ) : localesQ.data?.length ? (
                <LocalesEditor
                  key={localesQ.data.map((loc) => loc.locale).join(",")}
                  initialLocales={localesQ.data}
                  tenantId={tenantId!}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{t("localesEmpty")}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MerchantPageShell>
  );
}

type LocaleDraft = { locale: string; is_primary: boolean; enabled: boolean };

function LocalesEditor({
  initialLocales,
  tenantId,
}: {
  initialLocales: LocaleDraft[];
  tenantId: string;
}) {
  const t = useTranslations("store.settings");
  const qc = useQueryClient();
  const [localeDraft, setLocaleDraft] = useState(initialLocales);

  const localesMut = useMutation({
    mutationFn: async () => putLocales(tenantId, localeDraft),
    onSuccess: () => {
      toast.success(t("localesSaved"));
      void qc.invalidateQueries({ queryKey: ["tenant-admin", "locales"] });
    },
    onError: (e) =>
      toast.error(e instanceof ApiResponseError ? e.message : t("localesSaveError")),
  });

  return (
    <>
      {localeDraft.map((loc, index) => (
        <div
          key={loc.locale}
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
        >
          <span className="font-mono">{loc.locale}</span>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="primary-locale"
                checked={loc.is_primary}
                onChange={() =>
                  setLocaleDraft((prev) =>
                    prev.map((item, i) => ({
                      ...item,
                      is_primary: i === index,
                    })),
                  )
                }
              />
              {t("primaryLocale")}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={loc.enabled}
                onChange={(event) =>
                  setLocaleDraft((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, enabled: event.target.checked } : item,
                    ),
                  )
                }
              />
              {t("localeEnabled")}
            </label>
          </div>
        </div>
      ))}
      <Button type="button" disabled={localesMut.isPending} onClick={() => localesMut.mutate()}>
        {localesMut.isPending ? t("saving") : t("saveLocales")}
      </Button>
    </>
  );
}
