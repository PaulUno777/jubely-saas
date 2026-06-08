"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  Badge,
  Button,
  DataTable,
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
  KpiTile,
  KpiTileStrip,
  ListCard,
  Pagination,
} from "@jubely/ui";
import { ApiResponseError, userPublicSchema } from "@jubely/api-schemas";
import { Copy, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { InitialsAvatar } from "@/components/store/initials-avatar";
import { ListPageTabs } from "@/components/store/list-page-tabs";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { useRegisterPortalSearch } from "@/components/layout/portal-search-provider";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { usePagination } from "@/hooks/usePagination";
import { useStorePaginationLabels } from "@/hooks/useStorePaginationLabels";
import { useTenantAgents } from "@/hooks/tenant-admin-hooks";
import { useTenantId } from "@/hooks/useTenantId";
import { createInvitation } from "@/lib/tenant-admin";

type AgentRow = z.infer<typeof userPublicSchema>;
type AgentTab = "all" | "staff" | "admin";

export default function StoreAgentsPage() {
  const t = useTranslations("store.agents");
  const paginationLabels = useStorePaginationLabels();
  const { headerContext } = useMerchantLocationScope();
  const tenantId = useTenantId();
  const [tab, setTab] = useState<AgentTab>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const { offset, limit, setOffset, setLimit, reset } = usePagination({ defaultLimit: 25 });

  useRegisterPortalSearch({
    enabled: true,
    placeholder: t("searchPlaceholder"),
    value: search,
    onChange: setSearch,
  });

  useEffect(() => {
    reset();
  }, [debouncedSearch, tab, reset]);

  const inviteSchema = z.object({
    email: z.string().email(t("invalidEmail")),
  });

  const q = useTenantAgents({ limit, offset });

  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  });

  const mut = useMutation({
    mutationFn: async (values: z.infer<typeof inviteSchema>) =>
      createInvitation(tenantId!, { email: values.email, role: "staff" }),
    onSuccess: () => {
      toast.success(t("inviteSuccess"));
      form.reset();
      void q.refetch();
    },
    onError: (e) => {
      toast.error(e instanceof ApiResponseError ? e.message : t("inviteError"));
    },
  });

  const agents = useMemo(() => {
    let rows = (q.data?.agents ?? []) as AgentRow[];
    if (tab === "staff") rows = rows.filter((a) => a.role === "staff");
    if (tab === "admin") rows = rows.filter((a) => a.role === "merchant_admin");
    if (debouncedSearch.trim()) {
      const needle = debouncedSearch.toLowerCase();
      rows = rows.filter((a) => a.email.toLowerCase().includes(needle));
    }
    return rows;
  }, [q.data?.agents, tab, debouncedSearch]);

  const total = q.data?.pagination?.total ?? agents.length;

  return (
    <MerchantPageShell title={t("title")} context={headerContext} className="space-y-6">
      <KpiTileStrip>
        <KpiTile label={t("kpiTeam")} value={total} tone="teal" />
        <KpiTile label={t("kpiShown")} value={agents.length} tone="emerald" />
      </KpiTileStrip>

      <ListCard
        title={t("usersTitle")}
        description={t("usersDescription")}
        actions={
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
                    </div>
                  ) : null}
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
        toolbar={
          <ListPageTabs
            tabs={[
              { id: "all", label: t("tabAll"), count: total },
              { id: "staff", label: t("tabStaff") },
              { id: "admin", label: t("tabAdmin") },
            ]}
            active={tab}
            onChange={(id) => setTab(id as AgentTab)}
          />
        }
      >
        <DataTable
          columns={[
            {
              key: "agent",
              header: t("email"),
              cell: (u) => (
                <div className="flex items-center gap-3">
                  <InitialsAvatar name={u.email} />
                  <span className="font-mono text-sm">{u.email}</span>
                </div>
              ),
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
          getErrorMessage={(error) =>
            error instanceof ApiResponseError ? error.message : t("loadErrorDetail")
          }
          footer={
            <Pagination
              offset={offset}
              limit={limit}
              total={total}
              onOffsetChange={setOffset}
              onLimitChange={setLimit}
              labels={paginationLabels}
            />
          }
        />
      </ListCard>
    </MerchantPageShell>
  );
}
