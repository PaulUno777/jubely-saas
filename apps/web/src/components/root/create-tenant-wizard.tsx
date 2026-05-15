"use client";

import { useMutation } from "@tanstack/react-query";
import {
  Button,
  Card,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  WizardSteps,
} from "@jubely/ui";
import { Check, Copy, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { TenantLogoUpload } from "@/components/root/tenant-logo-upload";
import { adminCreateTenant, adminCreateTenantUser, adminPatchTenant, adminUploadTenantLogo } from "@/lib/adminApi";

const SLUG_RE = /^[a-z0-9-]{3,40}$/;
const PLANS = [
  { id: "starter", title: "Starter", desc: "Essai & petits volumes" },
  { id: "growth", title: "Growth", desc: "Multi-magasins" },
  { id: "business", title: "Business", desc: "SLA & support prioritaire" },
] as const;

function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinished?: () => void;
};

function resetWizardState(setters: {
  setStep: (n: number) => void;
  setName: (s: string) => void;
  setSlugManual: (b: boolean) => void;
  setSlugManualSlug: (s: string) => void;
  setCity: (s: string) => void;
  setSector: (s: string) => void;
  setLogoFile: (f: File | null) => void;
  setPlan: (p: (typeof PLANS)[number]["id"]) => void;
  setAdminEmail: (s: string) => void;
  setGeneratePwd: (b: boolean) => void;
  setTempPassword: (s: string) => void;
  setDonePassword: (s: string | null) => void;
  setCopied: (b: boolean) => void;
}) {
  setters.setStep(0);
  setters.setName("");
  setters.setSlugManual(false);
  setters.setSlugManualSlug("");
  setters.setCity("");
  setters.setSector("");
  setters.setLogoFile(null);
  setters.setPlan("starter");
  setters.setAdminEmail("");
  setters.setGeneratePwd(true);
  setters.setTempPassword("");
  setters.setDonePassword(null);
  setters.setCopied(false);
}

export function CreateTenantWizard({ open, onOpenChange, onFinished }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [slugManualSlug, setSlugManualSlug] = useState("");
  const [city, setCity] = useState("");
  const [sector, setSector] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [plan, setPlan] = useState<(typeof PLANS)[number]["id"]>("starter");
  const [adminEmail, setAdminEmail] = useState("");
  const [generatePwd, setGeneratePwd] = useState(true);
  const [tempPassword, setTempPassword] = useState("");
  const [donePassword, setDonePassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const autoSlug = slugifyName(name);
  const slugValue = (slugManual ? slugManualSlug : autoSlug).toLowerCase();
  const slugOk = SLUG_RE.test(slugValue);
  const slugPreview = slugValue || "votre-enseigne";

  const handleDialogOpenChange = (next: boolean) => {
    if (next) {
      resetWizardState({
        setStep,
        setName,
        setSlugManual,
        setSlugManualSlug,
        setCity,
        setSector,
        setLogoFile,
        setPlan,
        setAdminEmail,
        setGeneratePwd,
        setTempPassword,
        setDonePassword,
        setCopied,
      });
    }
    onOpenChange(next);
  };

  const createMut = useMutation({
    mutationFn: async () => {
      if (!slugOk) throw new Error("Slug invalide (3–40 caractères, a-z 0-9 tirets).");
      const tenant = await adminCreateTenant({
        body: { name: name.trim(), slug: slugValue.trim(), plan, self_serve: false },
      });
      const prevSettings =
        typeof tenant.settings === "object" && tenant.settings !== null && !Array.isArray(tenant.settings)
          ? (tenant.settings as Record<string, unknown>)
          : {};
      const uploadedLogoUrl = logoFile ? (await adminUploadTenantLogo({ file: logoFile })).url : "";
      const nextSettings = {
        ...prevSettings,
        ...(city.trim() ? { city: city.trim() } : {}),
        ...(sector.trim() ? { sector: sector.trim() } : {}),
        ...(uploadedLogoUrl ? { logo_url: uploadedLogoUrl } : {}),
      };
      if (Object.keys(nextSettings).length > 0) {
        await adminPatchTenant({
          tenantId: tenant.tenant_id,
          body: { settings: nextSettings },
        });
      }
      const createdUser = await adminCreateTenantUser({
        tenantId: tenant.tenant_id,
        email: adminEmail.trim(),
        role: "merchant_admin",
        temp_password: generatePwd ? undefined : tempPassword.trim() || null,
      });
      return { temp_password: createdUser.temp_password };
    },
    onSuccess: (out) => {
      setDonePassword(out.temp_password);
      setStep(3);
      toast.success("Tenant créé");
      onFinished?.();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Échec création"),
  });

  const canNext1 = name.trim().length >= 2 && slugOk;
  const canNext2 = true;
  const canSubmit =
    adminEmail.includes("@") && (generatePwd || tempPassword.trim().length >= 8) && !createMut.isPending;

  const wizardSteps = useMemo(() => [{ label: "Enseigne" }, { label: "Plan" }, { label: "Admin" }], []);

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer un tenant</DialogTitle>
          <DialogDescription>Assistant en 3 étapes — le mot de passe admin n&apos;est affiché qu&apos;une fois.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {step < 3 ? <WizardSteps steps={wizardSteps} currentStep={step} className="mb-2" /> : null}

          {step === 0 ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="ct-name">Nom de l&apos;enseigne</Label>
                <Input id="ct-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Chez Mama" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ct-slug">Slug (URL)</Label>
                <Input
                  id="ct-slug"
                  value={slugValue}
                  onChange={(e) => {
                    setSlugManual(true);
                    setSlugManualSlug(e.target.value.toLowerCase());
                  }}
                  placeholder="chez-mama"
                  className="font-mono text-sm"
                />
                {!slugOk ? <p className="text-xs text-destructive">Format requis : {SLUG_RE.toString()}</p> : null}
                <p className="text-xs text-muted-foreground">
                  Aperçu : <span className="font-mono">jubelee.app/join/{slugPreview}</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ct-city">Ville</Label>
                  <Input id="ct-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Douala" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ct-sector">Secteur</Label>
                  <Input id="ct-sector" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Restauration" />
                </div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <TenantLogoUpload name={name.trim() || "Nouvelle enseigne"} file={logoFile} onFileChange={setLogoFile} />
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-2">
              {PLANS.map((p) => (
                <Card
                  key={p.id}
                  className={`cursor-pointer border-2 p-3 transition-colors ${plan === p.id ? "border-primary" : "border-transparent"}`}
                  onClick={() => setPlan(p.id)}
                >
                  <p className="text-sm font-semibold">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </Card>
              ))}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="ct-email">Email administrateur</Label>
                <Input
                  id="ct-email"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@chezmama.cm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={generatePwd} onChange={(e) => setGeneratePwd(e.target.checked)} />
                Générer un mot de passe temporaire pour moi
              </label>
              {!generatePwd ? (
                <div className="space-y-1.5">
                  <Label htmlFor="ct-temp">Mot de passe temporaire</Label>
                  <Input
                    id="ct-temp"
                    type="password"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder="8+ caractères"
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 3 && donePassword ? (
            <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
              <p className="text-sm font-medium text-amber-950 dark:text-amber-100">Mot de passe temporaire (affiché une seule fois)</p>
              <code className="block rounded bg-background px-3 py-2 font-mono text-sm">{donePassword}</code>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={async () => {
                  await navigator.clipboard.writeText(donePassword);
                  setCopied(true);
                  toast.success("Copié");
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                Copier
              </Button>
            </div>
          ) : null}
        </DialogBody>
        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex gap-2">
            {step > 0 && step < 3 ? (
              <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))}>
                Retour
              </Button>
            ) : null}
          </div>
          <div className="flex gap-2">
            {step < 2 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={(step === 0 && !canNext1) || (step === 1 && !canNext2)}
              >
                Suivant
              </Button>
            ) : null}
            {step === 2 ? (
              <Button type="button" disabled={!canSubmit} onClick={() => createMut.mutate()}>
                {createMut.isPending ? <Loader2 className="animate-spin" size={16} /> : null}
                Créer
              </Button>
            ) : null}
            {step === 3 ? (
              <Button type="button" onClick={() => handleDialogOpenChange(false)}>
                Fermer
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
