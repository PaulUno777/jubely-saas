"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@jubely/ui";
import { Copy, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ApiResponseError } from "@jubely/api-schemas";
import { MerchantDataTable } from "@/components/store/merchant-data-table";
import { MerchantKpiStrip } from "@/components/store/merchant-kpi-strip";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { useTenantAgents } from "@/hooks/tenant-admin-hooks";
import { useTenantId } from "@/hooks/useTenantId";
import { userPublicSchema } from "@jubely/api-schemas";
import { createInvitation } from "@/lib/tenant-admin";

type AgentRow = z.infer<typeof userPublicSchema>;
import { useForm } from "react-hook-form";

export default function StoreAgentsPage() {
  const t = useTranslations("store.agents");
  const { headerContext } = useMerchantLocationScope();
  const tenantId = useTenantId();

  const inviteSchema = z.object({
    email: z.string().email(t("invalidEmail")),
  });

  const q = useTenantAgents({ limit: 50, offset: 0 });

  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  });

  const mut = useMutation({
    mutationFn: async (values: z.infer<typeof inviteSchema>) => {
      return createInvitation(tenantId!, { email: values.email, role: "staff" });
    },
    onSuccess: () => {
      toast.success(t("inviteSuccess"));
      form.reset();
      void q.refetch();
    },
    onError: (e) => {
      toast.error(e instanceof ApiResponseError ? e.message : t("inviteError"));
    },
  });

  const agents = (q.data?.agents ?? []) as AgentRow[];

  return (
    <MerchantPageShell title={t("title")} context={headerContext} className="space-y-6">
      <MerchantKpiStrip
        items={[
          {
            key: "team",
            label: t("kpiTeam"),
            value: agents.length,
            tone: "teal",
          },
        ]}
      />
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>{t("usersTitle")}</CardTitle>
            <CardDescription>{t("usersDescription")}</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 shrink-0">
                <Plus size={14} />
                {t("invite")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("inviteTitle")}</DialogTitle>
                <DialogDescription>{t("inviteDescription")}</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((values) => mut.mutate(values))}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("email")}</FormLabel>
                        <FormControl>
                          <Input type="email" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={mut.isPending}>
                      {t("createInvitation")}
                    </Button>
                  </DialogFooter>
                  {mut.data ? (
                    <div className="space-y-3 rounded-lg border border-border bg-muted p-3">
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">{t("inviteLinkLabel")}</p>
                        <p className="break-all font-mono text-sm">
                          {typeof window !== "undefined"
                            ? `${window.location.origin}/invite/${mut.data.token}`
                            : `/invite/${mut.data.token}`}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 gap-1.5"
                          onClick={async () => {
                            const url = `${window.location.origin}/invite/${mut.data!.token}`;
                            await navigator.clipboard.writeText(url);
                            toast.success(t("inviteLinkCopied"));
                          }}
                        >
                          <Copy size={14} />
                          {t("copyInviteLink")}
                        </Button>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">{t("tokenLabel")}</p>
                        <p className="break-all font-mono text-sm">{mut.data.token}</p>
                      </div>
                    </div>
                  ) : null}
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <MerchantDataTable
            columns={[
              {
                key: "email",
                header: t("email"),
                cell: (u) => <span className="font-mono text-sm">{u.email}</span>,
              },
              {
                key: "role",
                header: t("role"),
                cell: (u) => <Badge variant="outline">{u.role}</Badge>,
              },
            ]}
            rows={agents}
            rowKey={(u) => u.user_id}
            loading={q.isLoading}
            error={q.error}
            loadingLabel={t("loading")}
            errorLabel={t("loadErrorDetail")}
            emptyLabel={t("empty")}
          />
        </CardContent>
      </Card>
    </MerchantPageShell>
  );
}
