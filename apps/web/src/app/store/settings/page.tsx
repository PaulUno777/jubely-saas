"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input, Textarea } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Main } from "@/components/layout/main";
import { StorePageHeader } from "@/components/store/store-page-header";
import { useSession } from "@/hooks/useSession";
import { storeGetTenant, storePatchTenant } from "@/lib/storeApi";
import { ApiResponseError } from "@jubely/api-schemas";

const schema = z.object({
  name: z.string().min(1),
  conflict_policy: z.string().min(1),
  settingsJson: z.string(),
});

export default function StoreSettingsPage() {
  const t = useTranslations("store.settings");
  const { session } = useSession();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["store", "tenant", session?.tenantId],
    enabled: Boolean(session),
    queryFn: () => storeGetTenant(),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", conflict_policy: "FIFO", settingsJson: "{}" },
  });

  useEffect(() => {
    if (!q.data) return;
    form.reset({
      name: q.data.name,
      conflict_policy: q.data.conflict_policy ?? "FIFO",
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
      return storePatchTenant({
        body: {
          name: values.name,
          conflict_policy: values.conflict_policy,
          settings,
        },
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

  return (
    <>
      <StorePageHeader title={t("title")} />
      <Main>
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
                <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="space-y-4 max-w-xl">
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
      </Main>
    </>
  );
}
