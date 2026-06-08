"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tenant } from "@jubely/api-schemas";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@jubely/ui";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { useSession } from "@/hooks/useSession";
import { TenantLogo } from "@/components/root/tenant-logo";
import { TenantLogoUpload } from "@/components/root/tenant-logo-upload";
import { adminCreateTenantUser, adminGetTenant, adminListTenantUsers, adminPatchTenant, adminUploadTenantLogo } from "@/lib/adminApi";
import { tenantLogoUrl } from "@/lib/tenantLogo";

function TenantInfoFields({
  tenant,
  tenantId,
}: {
  tenant: Tenant;
  tenantId: string;
}) {
  const t = useTranslations("admin.tenantDetail");
  const tErrors = useTranslations("errors");
  const qc = useQueryClient();
  const [name, setName] = useState(() => tenant.name);
  const [plan, setPlan] = useState(() => String(tenant.plan).toLowerCase());
  const [conflict, setConflict] = useState(() => tenant.conflict_policy ?? "HIGHEST_WINS");
  const [active, setActive] = useState(() => tenant.active);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const saveMut = useMutation({
    mutationFn: async () => {
      return adminPatchTenant({
        tenantId,
        body: {
          name: name.trim(),
          plan,
          conflict_policy: conflict,
          active,
        },
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "tenant", tenantId] });
      void qc.invalidateQueries({ queryKey: ["admin", "tenants"] });
      toast.success(t("toasts.saved"));
    },
    onError: (e) => {
      if (!(e instanceof Error && e.message === "Unauthorized")) toast.error(e instanceof Error ? e.message : tErrors("generic"));
    },
  });

  const settingsRecord =
    typeof tenant.settings === "object" && tenant.settings !== null && !Array.isArray(tenant.settings)
      ? (tenant.settings as Record<string, unknown>)
      : {};
  const currentLogoUrl = tenantLogoUrl(tenant);

  const logoMut = useMutation({
    mutationFn: async () => {
      if (!logoFile) throw new Error(t("toasts.fileMissing"));
      const { url } = await adminUploadTenantLogo({ file: logoFile });
      return adminPatchTenant({
        tenantId,
        body: { settings: { ...settingsRecord, logo_url: url } },
      });
    },
    onSuccess: () => {
      setLogoFile(null);
      void qc.invalidateQueries({ queryKey: ["admin", "tenant", tenantId] });
      void qc.invalidateQueries({ queryKey: ["admin", "tenants"] });
      toast.success(t("toasts.logoUpdated"));
    },
    onError: (e) => {
      if (!(e instanceof Error && e.message === "Unauthorized")) toast.error(e instanceof Error ? e.message : tErrors("generic"));
    },
  });

  const removeLogoMut = useMutation({
    mutationFn: async () => {
      const next = { ...settingsRecord };
      delete next.logo_url;
      return adminPatchTenant({
        tenantId,
        body: { settings: next },
      });
    },
    onSuccess: () => {
      setLogoFile(null);
      void qc.invalidateQueries({ queryKey: ["admin", "tenant", tenantId] });
      void qc.invalidateQueries({ queryKey: ["admin", "tenants"] });
      toast.success(t("toasts.logoRemoved"));
    },
    onError: (e) => {
      if (!(e instanceof Error && e.message === "Unauthorized")) toast.error(e instanceof Error ? e.message : tErrors("generic"));
    },
  });

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <TenantLogo tenant={tenant} size="lg" />
          <div className="min-w-0">
            <CardTitle className="truncate">{name}</CardTitle>
            <CardDescription className="font-mono">{tenant.slug}</CardDescription>
          </div>
        </div>
        <div>
          <CardTitle className="text-base">{t("infoTitle")}</CardTitle>
          <CardDescription>{t("infoDescription")}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>{t("fields.name")}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("fields.plan")}</Label>
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="starter">{t("plans.starter")}</SelectItem>
              <SelectItem value="growth">{t("plans.growth")}</SelectItem>
              <SelectItem value="business">{t("plans.business")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("fields.conflictPolicy")}</Label>
          <Input value={conflict} onChange={(e) => setConflict(e.target.value)} placeholder="HIGHEST_WINS" />
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <input id="t-active" type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <Label htmlFor="t-active">{t("fields.active")}</Label>
        </div>
        <div className="md:col-span-2 rounded-xl border border-border bg-muted/20 p-4">
          <TenantLogoUpload
            name={name.trim() || tenant.name}
            currentUrl={currentLogoUrl}
            file={logoFile}
            onFileChange={setLogoFile}
            onSave={() => logoMut.mutate()}
            onRemove={() => removeLogoMut.mutate()}
            saving={logoMut.isPending}
            removing={removeLogoMut.isPending}
          />
        </div>
        <div className="md:col-span-2">
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !name.trim()}>
            {saveMut.isPending ? <Loader2 className="animate-spin" size={16} /> : null}
            {t("save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TenantDetailPage() {
  const t = useTranslations("admin.tenantDetail");
  const tErrors = useTranslations("errors");
  const params = useParams();
  const id = String(params.id ?? "");
  const { session } = useSession();
  const qc = useQueryClient();

  const tenantQ = useQuery({
    queryKey: ["admin", "tenant", id],
    enabled: Boolean(session && id),
    queryFn: () => adminGetTenant({ tenantId: id }),
  });

  const usersQ = useQuery({
    queryKey: ["admin", "tenant", id, "users"],
    enabled: Boolean(session && id),
    queryFn: () => adminListTenantUsers({ tenantId: id, limit: 100, offset: 0 }),
  });

  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [genPwd, setGenPwd] = useState(true);
  const [newPwd, setNewPwd] = useState("");

  const addAdminMut = useMutation({
    mutationFn: async () => {
      return adminCreateTenantUser({
        tenantId: id,
        email: newEmail.trim(),
        role: "merchant_admin",
        temp_password: genPwd ? undefined : newPwd.trim() || null,
      });
    },
    onSuccess: (out) => {
      void qc.invalidateQueries({ queryKey: ["admin", "tenant", id, "users"] });
      toast.success(t("toasts.adminCreated", { password: out.temp_password }));
      setAddOpen(false);
      setNewEmail("");
      setNewPwd("");
      setGenPwd(true);
    },
    onError: (e) => {
      if (!(e instanceof Error && e.message === "Unauthorized")) toast.error(e instanceof Error ? e.message : tErrors("generic"));
    },
  });

  if (!session) return <div className="p-6">{t("sessionRequired")}</div>;

  const tenant = tenantQ.data;
  const formKey = tenant ? `${tenant.tenant_id}-${String(tenant.updated_at ?? tenantQ.dataUpdatedAt)}` : "loading";

  return (
    <>
      <Header fixed>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/root/tenants" aria-label={t("back")}>
              <ArrowLeft size={18} />
            </Link>
          </Button>
          {tenant ? (
            <>
              <TenantLogo tenant={tenant} size="sm" />
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold">{tenant.name}</h1>
                <p className="truncate font-mono text-xs text-muted-foreground">{tenant.slug}</p>
              </div>
            </>
          ) : (
            <h1 className="text-base font-semibold">{t("titleFallback")}</h1>
          )}
        </div>
      </Header>

      <Main className="space-y-4">
        {tenantQ.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : tenantQ.error || !tenant ? (
          <p className="text-sm text-destructive">{t("notFound")}</p>
        ) : (
          <>
            <TenantInfoFields key={formKey} tenant={tenant} tenantId={id} />

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>{t("adminsTitle")}</CardTitle>
                  <CardDescription>{t("adminsDescription")}</CardDescription>
                </div>
                <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
                  <UserPlus size={14} />
                  {t("addAdmin")}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.email")}</TableHead>
                      <TableHead>{t("table.role")}</TableHead>
                      <TableHead>{t("table.created")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersQ.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-sm text-muted-foreground">
                          {t("usersLoading")}
                        </TableCell>
                      </TableRow>
                    ) : usersQ.data?.length ? (
                      usersQ.data.map((u) => (
                        <TableRow key={u.user_id}>
                          <TableCell className="font-mono text-xs">{u.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{u.role}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{String(u.created_at ?? "—")}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-sm text-muted-foreground">
                          {t("usersEmpty")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </Main>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialog.title")}</DialogTitle>
            <DialogDescription>{t("dialog.description")}</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="adm-email">{t("dialog.email")}</Label>
              <Input id="adm-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={genPwd} onChange={(e) => setGenPwd(e.target.checked)} />
              {t("dialog.generatePassword")}
            </label>
            {!genPwd ? (
              <div className="space-y-1.5">
                <Label>{t("dialog.tempPassword")}</Label>
                <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
              </div>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              {t("dialog.cancel")}
            </Button>
            <Button
              disabled={!newEmail.includes("@") || addAdminMut.isPending || (!genPwd && newPwd.trim().length < 8)}
              onClick={() => addAdminMut.mutate()}
            >
              {addAdminMut.isPending ? <Loader2 className="animate-spin" size={16} /> : null}
              {t("dialog.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
