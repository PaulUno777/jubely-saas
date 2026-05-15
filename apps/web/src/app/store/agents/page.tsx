"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@jubely/ui";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ApiResponseError } from "@jubely/api-schemas";
import { Main } from "@/components/layout/main";
import { StorePageHeader } from "@/components/store/store-page-header";
import { useSession } from "@/hooks/useSession";
import { storeCreateInvitation, storeListUsers } from "@/lib/storeApi";
import { useForm } from "react-hook-form";

export default function StoreAgentsPage() {
  const t = useTranslations("store.agents");
  const { session } = useSession();

  const inviteSchema = z.object({
    email: z.string().email(t("invalidEmail")),
  });

  const q = useQuery({
    queryKey: ["store", "users"],
    enabled: Boolean(session),
    queryFn: () => storeListUsers({ limit: 50, offset: 0 }),
  });

  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  });

  const mut = useMutation({
    mutationFn: async (values: z.infer<typeof inviteSchema>) => {
      return storeCreateInvitation({ email: values.email, role: "staff" });
    },
    onSuccess: () => {
      toast.success(t("inviteSuccess"));
      form.reset();
      q.refetch();
    },
    onError: (e) => {
      toast.error(e instanceof ApiResponseError ? e.message : t("inviteError"));
    },
  });

  return (
    <>
      <StorePageHeader title={t("title")} />
      <Main>
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
                  <form onSubmit={form.handleSubmit((values) => mut.mutate(values))} className="space-y-4">
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
                      <div className="rounded-lg border border-border bg-muted p-3">
                        <p className="mb-1 text-xs text-muted-foreground">{t("tokenLabel")}</p>
                        <p className="break-all font-mono text-sm">{mut.data.token}</p>
                      </div>
                    ) : null}
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("email")}</TableHead>
                  <TableHead>{t("role")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-sm text-muted-foreground">
                      {t("loading")}
                    </TableCell>
                  </TableRow>
                ) : q.error ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-sm text-destructive">
                      {q.error instanceof ApiResponseError ? q.error.message : t("loadErrorDetail")}
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
                      {t("empty")}
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
