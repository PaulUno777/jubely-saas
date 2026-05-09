"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { startRegistration } from "@simplewebauthn/browser";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@jubely/ui";
import { useMemo, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { API_BASE_URL } from "@/lib/env";

type Factor = {
  id: string;
  type: "totp" | "passkey";
  label?: string | null;
  enabled_at?: string | null;
  last_used_at?: string | null;
  created_at?: string;
};

function joinUrl(path: string) {
  return `${API_BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

async function authed<T>(accessToken: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(joinUrl(path), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const json = (await res.json()) as unknown;
  if (!res.ok) throw new Error("Erreur");
  return ((json as { data?: unknown })?.data ?? json) as T;
}

export default function SecurityPage() {
  const { session } = useSession();
  const accessToken = session?.accessToken ?? null;

  const isAdminPortal = session?.role === "superadmin" || session?.role === "merchant_admin";
  const [totpFactorId, setTotpFactorId] = useState<string | null>(null);
  const [totpOtpAuthUrl, setTotpOtpAuthUrl] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");

  const factorsQuery = useQuery({
    queryKey: ["mfaFactors"],
    enabled: !!accessToken && isAdminPortal,
    queryFn: async () => {
      const out = await authed<{ items: Factor[] }>(accessToken!, "/v1/me/mfa", { method: "GET" });
      return out.items;
    },
  });

  const setupTotpMut = useMutation({
    mutationFn: async () => {
      return authed<{ factor_id: string; otpauth_url: string; secret_b32: string }>(accessToken!, "/v1/me/mfa/totp/setup", {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
    onSuccess: (d) => {
      setTotpFactorId(d.factor_id);
      setTotpOtpAuthUrl(d.otpauth_url);
      toast.success("TOTP généré. Scannez le QR puis confirmez.");
    },
    onError: () => toast.error("Échec génération TOTP"),
  });

  const confirmTotpMut = useMutation({
    mutationFn: async () => {
      return authed(accessToken!, "/v1/me/mfa/totp/confirm", {
        method: "POST",
        body: JSON.stringify({ factor_id: totpFactorId, code: totpCode }),
      });
    },
    onSuccess: async () => {
      toast.success("TOTP activé");
      setTotpCode("");
      setTotpFactorId(null);
      setTotpOtpAuthUrl(null);
      await factorsQuery.refetch();
    },
    onError: () => toast.error("Code invalide"),
  });

  const registerPasskeyMut = useMutation({
    mutationFn: async () => {
      const begin = await authed<{ challenge_id: string; options: Parameters<typeof startRegistration>[0] }>(
        accessToken!,
        "/v1/me/mfa/passkey/register/begin",
        { method: "POST", body: JSON.stringify({}) },
      );
      const att = await startRegistration(begin.options);
      await authed(accessToken!, "/v1/me/mfa/passkey/register/finish", {
        method: "POST",
        body: JSON.stringify({ challenge_id: begin.challenge_id, ...att }),
      });
    },
    onSuccess: async () => {
      toast.success("Passkey enregistrée");
      await factorsQuery.refetch();
    },
    onError: () => toast.error("Échec passkey"),
  });

  const deleteFactorMut = useMutation({
    mutationFn: async (id: string) => {
      return authed(accessToken!, `/v1/me/mfa/factors/${id}`, { method: "DELETE" });
    },
    onSuccess: async () => {
      toast.success("Facteur supprimé");
      await factorsQuery.refetch();
    },
    onError: () => toast.error("Échec suppression"),
  });

  const factors = useMemo(() => factorsQuery.data ?? [], [factorsQuery.data]);

  if (!session) return <div className="p-6">Session requise.</div>;
  if (!isAdminPortal) return <div className="p-6">Accès réservé aux portails admin.</div>;
  if (!accessToken) return <div className="p-6">Session invalide.</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-3xl">Sécurité</h1>
        <p className="text-sm text-muted-foreground mt-1">Activez TOTP ou une passkey pour protéger votre compte.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Facteurs MFA</CardTitle>
          <CardDescription>Facteurs activés sur votre compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {factorsQuery.isLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : null}
          {factors.length === 0 && !factorsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Aucun facteur activé.</p>
          ) : null}
          {factors.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">
                  {f.type.toUpperCase()} {f.label ? `· ${f.label}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">{f.enabled_at ? "Actif" : "En attente"}</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => deleteFactorMut.mutate(f.id)} disabled={deleteFactorMut.isPending}>
                Supprimer
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Activer TOTP</CardTitle>
            <CardDescription>Google Authenticator, Authy…</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => setupTotpMut.mutate()} disabled={setupTotpMut.isPending}>
              Générer un QR
            </Button>

            {totpOtpAuthUrl ? (
              <div className="space-y-3">
                <QRCodeCanvas value={totpOtpAuthUrl} size={180} />
                <div className="space-y-2">
                  <Label>Code à 6 chiffres</Label>
                  <Input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="123456" />
                </div>
                <Button
                  onClick={() => confirmTotpMut.mutate()}
                  disabled={!totpFactorId || totpCode.trim().length < 6 || confirmTotpMut.isPending}
                >
                  Confirmer
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activer Passkey</CardTitle>
            <CardDescription>Face ID, Touch ID, clé FIDO2</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => registerPasskeyMut.mutate()} disabled={registerPasskeyMut.isPending}>
              Enregistrer une passkey
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

