"use client";

import { parseJsonUnknown } from "@jubely/api-schemas";
import { useSession } from "@/hooks/useSession";
import { authedFetch } from "@/lib/http";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@jubely/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function PasswordPage() {
  const { session } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!session) return <div className="p-6">Session requise.</div>;

  const sess = session;

  async function submit() {
    setLoading(true);
    try {
      const res = await authedFetch("/v1/me/credentials/password", {
        method: "PATCH",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const raw = await res.text();
      const j = parseJsonUnknown(raw) as { error?: { message?: string } };
      if (!res.ok) {
        throw new Error(typeof j?.error?.message === "string" ? j.error.message : "Erreur");
      }
      toast.success("Mot de passe mis à jour");
      if (sess.role === "superadmin") router.push("/root");
      else if (sess.role === "merchant_admin") router.push("/store");
      else if (sess.role === "staff") router.push("/agent");
      else router.push("/customer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 flex justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Changer le mot de passe</CardTitle>
          <CardDescription>Requis après un mot de passe temporaire.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mot de passe actuel</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Nouveau mot de passe</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <Button onClick={submit} disabled={loading || newPassword.trim().length < 8}>
            Enregistrer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

