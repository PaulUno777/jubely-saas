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
  accessToken,
}: {
  tenant: Tenant;
  tenantId: string;
  accessToken: string;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(() => tenant.name);
  const [plan, setPlan] = useState(() => String(tenant.plan).toLowerCase());
  const [conflict, setConflict] = useState(() => tenant.conflict_policy ?? "HIGHEST_WINS");
  const [active, setActive] = useState(() => tenant.active);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const saveMut = useMutation({
    mutationFn: async () => {
      return adminPatchTenant({
        accessToken,
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
      toast.success("Tenant enregistré");
    },
    onError: (e) => {
      if (!(e instanceof Error && e.message === "Unauthorized")) toast.error(e instanceof Error ? e.message : "Erreur");
    },
  });

  const settingsRecord =
    typeof tenant.settings === "object" && tenant.settings !== null && !Array.isArray(tenant.settings)
      ? (tenant.settings as Record<string, unknown>)
      : {};
  const currentLogoUrl = tenantLogoUrl(tenant);

  const logoMut = useMutation({
    mutationFn: async () => {
      if (!logoFile) throw new Error("Fichier manquant");
      const { url } = await adminUploadTenantLogo({ accessToken, file: logoFile });
      return adminPatchTenant({
        accessToken,
        tenantId,
        body: { settings: { ...settingsRecord, logo_url: url } },
      });
    },
    onSuccess: () => {
      setLogoFile(null);
      void qc.invalidateQueries({ queryKey: ["admin", "tenant", tenantId] });
      void qc.invalidateQueries({ queryKey: ["admin", "tenants"] });
      toast.success("Logo mis à jour");
    },
    onError: (e) => {
      if (!(e instanceof Error && e.message === "Unauthorized")) toast.error(e instanceof Error ? e.message : "Erreur");
    },
  });

  const removeLogoMut = useMutation({
    mutationFn: async () => {
      const next = { ...settingsRecord };
      delete next.logo_url;
      return adminPatchTenant({
        accessToken,
        tenantId,
        body: { settings: next },
      });
    },
    onSuccess: () => {
      setLogoFile(null);
      void qc.invalidateQueries({ queryKey: ["admin", "tenant", tenantId] });
      void qc.invalidateQueries({ queryKey: ["admin", "tenants"] });
      toast.success("Logo retiré");
    },
    onError: (e) => {
      if (!(e instanceof Error && e.message === "Unauthorized")) toast.error(e instanceof Error ? e.message : "Erreur");
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
          <CardTitle className="text-base">Informations</CardTitle>
          <CardDescription>Identité, plan et politique de conflit (Phase 4).</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>Nom</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Plan</Label>
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="growth">Growth</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Conflict policy</Label>
          <Input value={conflict} onChange={(e) => setConflict(e.target.value)} placeholder="HIGHEST_WINS" />
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <input id="t-active" type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <Label htmlFor="t-active">Tenant actif</Label>
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
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TenantDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { session } = useSession();
  const token = session?.accessToken;
  const qc = useQueryClient();

  const tenantQ = useQuery({
    queryKey: ["admin", "tenant", id],
    enabled: Boolean(token && id),
    queryFn: () => adminGetTenant({ accessToken: token!, tenantId: id }),
  });

  const usersQ = useQuery({
    queryKey: ["admin", "tenant", id, "users"],
    enabled: Boolean(token && id),
    queryFn: () => adminListTenantUsers({ accessToken: token!, tenantId: id, limit: 100, offset: 0 }),
  });

  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [genPwd, setGenPwd] = useState(true);
  const [newPwd, setNewPwd] = useState("");

  const addAdminMut = useMutation({
    mutationFn: async () => {
      return adminCreateTenantUser({
        accessToken: token!,
        tenantId: id,
        email: newEmail.trim(),
        role: "merchant_admin",
        temp_password: genPwd ? undefined : newPwd.trim() || null,
      });
    },
    onSuccess: (out) => {
      void qc.invalidateQueries({ queryKey: ["admin", "tenant", id, "users"] });
      toast.success(`Admin créé. Mot de passe temporaire : ${out.temp_password}`);
      setAddOpen(false);
      setNewEmail("");
      setNewPwd("");
      setGenPwd(true);
    },
    onError: (e) => {
      if (!(e instanceof Error && e.message === "Unauthorized")) toast.error(e instanceof Error ? e.message : "Erreur");
    },
  });

  if (!token) return <div className="p-6">Session requise.</div>;

  const t = tenantQ.data;
  const formKey = t ? `${t.tenant_id}-${String(t.updated_at ?? tenantQ.dataUpdatedAt)}` : "loading";

  return (
    <>
      <Header fixed>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/root/tenants" aria-label="Retour">
              <ArrowLeft size={18} />
            </Link>
          </Button>
          {t ? (
            <>
              <TenantLogo tenant={t} size="sm" />
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold">{t.name}</h1>
                <p className="truncate font-mono text-xs text-muted-foreground">{t.slug}</p>
              </div>
            </>
          ) : (
            <h1 className="text-base font-semibold">Détail tenant</h1>
          )}
        </div>
      </Header>

      <Main className="space-y-4">
        {tenantQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : tenantQ.error || !t ? (
          <p className="text-sm text-destructive">Tenant introuvable.</p>
        ) : (
          <>
            <TenantInfoFields key={formKey} tenant={t} tenantId={id} accessToken={token} />

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Administrateurs</CardTitle>
                  <CardDescription>Comptes merchant_admin rattachés à ce tenant.</CardDescription>
                </div>
                <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
                  <UserPlus size={14} />
                  Ajouter un admin
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Créé</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersQ.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-muted-foreground text-sm">
                          Chargement…
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
                        <TableCell colSpan={3} className="text-muted-foreground text-sm">
                          Aucun utilisateur.
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
            <DialogTitle>Ajouter un administrateur</DialogTitle>
            <DialogDescription>Crée un merchant_admin avec mot de passe temporaire.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="adm-email">Email</Label>
              <Input id="adm-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={genPwd} onChange={(e) => setGenPwd(e.target.checked)} />
              Générer le mot de passe
            </label>
            {!genPwd ? (
              <div className="space-y-1.5">
                <Label>Mot de passe temporaire</Label>
                <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
              </div>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Annuler
            </Button>
            <Button
              disabled={!newEmail.includes("@") || addAdminMut.isPending || (!genPwd && newPwd.trim().length < 8)}
              onClick={() => addAdminMut.mutate()}
            >
              {addAdminMut.isPending ? <Loader2 className="animate-spin" size={16} /> : null}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
