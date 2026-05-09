"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createCustomerFormSchema, type CreateCustomerForm } from "@jubely/api-schemas";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, Label } from "@jubely/ui";
import { staffCreateCustomer } from "@/lib/staffApi";
import { useSession } from "@/hooks/useSession";

export default function AgentCreateCustomerPage() {
  const { session } = useSession();
  const [qr, setQr] = useState<string | null>(null);

  const form = useForm<CreateCustomerForm>({
    resolver: zodResolver(createCustomerFormSchema),
    defaultValues: { name: "", phone: "", email: "" },
  });

  const mut = useMutation({
    mutationFn: (values: CreateCustomerForm) => staffCreateCustomer({ accessToken: session!.accessToken, values }),
    onSuccess: (out) => setQr(out.customer_qr ?? null),
  });

  if (!session?.accessToken) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Vous devez vous connecter.</p>
        <Link className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-4" href="/login">
          Aller à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight">Créer un client</h1>
        <p className="mt-2 text-sm text-muted-foreground">Création + enrollement, retourne un QR token.</p>
      </div>

      <form
        className="rounded-xl border border-border bg-card p-6 space-y-4"
        onSubmit={form.handleSubmit((values) => {
          setQr(null);
          mut.mutate(values);
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Nom</Label>
          <Input id="name" {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone (E.164)</Label>
          <Input id="phone" {...form.register("phone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email (optionnel)</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        </div>

        {mut.error ? <p className="text-sm text-destructive">Erreur: {String(mut.error)}</p> : null}

        <Button type="submit" disabled={mut.isPending}>
          {mut.isPending ? "Création…" : "Créer"}
        </Button>
      </form>

      {qr ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs text-muted-foreground">Customer QR (token)</p>
          <p className="mt-2 font-mono text-sm break-all">{qr}</p>
        </div>
      ) : null}
    </div>
  );
}

