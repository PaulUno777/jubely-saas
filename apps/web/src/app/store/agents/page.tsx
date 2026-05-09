"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@jubely/ui";
import { Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { useSession } from "@/hooks/useSession";
import { storeCreateInvitation, storeListUsers } from "@/lib/storeApi";
import { useForm } from "react-hook-form";

const inviteSchema = z.object({
  email: z.string().email("Email invalide"),
});

export default function StoreAgentsPage() {
  const { session } = useSession();

  const q = useQuery({
    queryKey: ["store", "users"],
    enabled: Boolean(session?.accessToken),
    queryFn: () => storeListUsers({ accessToken: session!.accessToken, limit: 50, offset: 0 }),
  });

  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  });

  const mut = useMutation({
    mutationFn: async (values: z.infer<typeof inviteSchema>) => {
      return storeCreateInvitation({ accessToken: session!.accessToken, email: values.email, role: "staff" });
    },
    onSuccess: () => {
      form.reset();
      q.refetch();
    },
  });

  return (
    <>
      <Header fixed>
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-base font-semibold">Agents</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus size={14} />
                Inviter un agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Inviter un agent</DialogTitle>
                <DialogDescription>Envoie un lien d’activation (token) à l’agent. (UI email later)</DialogDescription>
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={mut.isPending}>
                      Créer l’invitation
                    </Button>
                  </DialogFooter>
                  {mut.data ? (
                    <div className="rounded-lg border border-border bg-muted p-3">
                      <p className="text-xs text-muted-foreground mb-1">Token (à partager)</p>
                      <p className="font-mono text-sm break-all">{mut.data.token}</p>
                    </div>
                  ) : null}
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </Header>

      <Main>
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs du magasin</CardTitle>
            <CardDescription>Liste des users du tenant (store scope).</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-sm text-muted-foreground">
                      Chargement…
                    </TableCell>
                  </TableRow>
                ) : q.error ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-sm text-destructive">
                      Échec chargement users
                    </TableCell>
                  </TableRow>
                ) : q.data?.length ? (
                  q.data.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-mono text-sm">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{u.role}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-sm text-muted-foreground">
                      Aucun user.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Main>
    </>
  );
}

