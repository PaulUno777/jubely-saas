"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { clientEnrollFormSchema, type ClientEnrollForm } from "@jubely/api-schemas";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button, Input, Label, Textarea } from "@jubely/ui";
import { enrollByStoreQr } from "@/lib/customerApi";
import { saveCustomerQr } from "@/lib/customerSession";

export default function CustomerEnrollPage() {
  const router = useRouter();
  const form = useForm<ClientEnrollForm>({
    resolver: zodResolver(clientEnrollFormSchema),
    defaultValues: { storeQr: "", phone: "", name: "", email: "" },
  });

  const mut = useMutation({
    mutationFn: enrollByStoreQr,
    onSuccess: (out) => {
      if (out.customer_qr) {
        saveCustomerQr(out.customer_qr);
        router.push("/customer/qr");
      }
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight">S’inscrire</h1>
        <p className="mt-2 text-sm text-muted-foreground">Scannez/collez le QR magasin puis entrez vos infos.</p>
      </div>

      <form
        className="rounded-xl border border-border bg-card p-6 space-y-4"
        onSubmit={form.handleSubmit((v) => mut.mutate(v))}
      >
        <div className="space-y-2">
          <Label htmlFor="storeQr">QR magasin (token)</Label>
          <Textarea id="storeQr" {...form.register("storeQr")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone (E.164)</Label>
          <Input id="phone" {...form.register("phone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Nom</Label>
          <Input id="name" {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email (optionnel)</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        </div>

        {mut.error ? <p className="text-sm text-destructive">Erreur: {String(mut.error)}</p> : null}

        <Button type="submit" disabled={mut.isPending}>
          {mut.isPending ? "Inscription…" : "S’inscrire"}
        </Button>
      </form>
    </div>
  );
}

