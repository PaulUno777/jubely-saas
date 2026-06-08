"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@jubely/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiResponseError } from "@jubely/api-schemas";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { InitialsAvatar } from "@/components/store/initials-avatar";
import { TierBadge } from "@/components/store/tier-badge";
import { useTenantId } from "@/hooks/useTenantId";
import { adjustCustomerPoints, getCustomer } from "@/lib/tenant-admin";

type CustomerDetailSheetProps = {
  enrollmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CustomerDetailSheet({
  enrollmentId,
  open,
  onOpenChange,
}: CustomerDetailSheetProps) {
  const t = useTranslations("store.customers");
  const tenantId = useTenantId();
  const qc = useQueryClient();

  const detailQ = useQuery({
    queryKey: ["tenant-admin", "customer-detail", tenantId, enrollmentId],
    enabled: Boolean(tenantId && enrollmentId && open),
    queryFn: () => getCustomer(tenantId!, enrollmentId!),
  });

  const adjustSchema = z.object({
    delta: z.coerce.number().int().refine((v) => v !== 0, t("adjustDeltaRequired")),
    reason: z.string().min(1, t("adjustReasonRequired")),
  });

  const form = useForm<z.infer<typeof adjustSchema>>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { delta: 0, reason: "" },
  });

  const adjustMut = useMutation({
    mutationFn: (values: z.infer<typeof adjustSchema>) =>
      adjustCustomerPoints(tenantId!, enrollmentId!, values),
    onSuccess: () => {
      toast.success(t("adjustSuccess"));
      form.reset();
      void qc.invalidateQueries({ queryKey: ["tenant-admin", "customers"] });
      void detailQ.refetch();
    },
    onError: (e) =>
      toast.error(e instanceof ApiResponseError ? e.message : t("adjustError")),
  });

  const customer = detailQ.data;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-3">
            {customer ? <InitialsAvatar name={customer.name} size="lg" /> : null}
            <div>
              <SheetTitle>{customer?.name ?? t("detailTitle")}</SheetTitle>
              <SheetDescription>{customer?.phone ?? ""}</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        {detailQ.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("loading")}</p>
        ) : customer ? (
          <div className="mt-4 space-y-6">
            <div className="rounded-2xl border border-border bg-[var(--g0,#FBF0D4)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.1em] text-[var(--g4,#6B4510)] uppercase">
                    {t("tier")}
                  </p>
                  {customer.tier && typeof customer.tier === "object" && "code" in customer.tier ? (
                    <div className="mt-1">
                      <TierBadge code={(customer.tier as { code: string }).code} />
                    </div>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="font-mono text-2xl font-medium tabular-nums">{customer.points_balance}</p>
                  <p className="text-xs text-muted-foreground">{t("points")}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {customer.email ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{customer.email}</span>
                </div>
              ) : null}
            </div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((v) => adjustMut.mutate(v))}
                className="space-y-3 rounded-lg border border-border p-3"
              >
                <p className="text-sm font-medium">{t("adjustTitle")}</p>
                <FormField
                  control={form.control}
                  name="delta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("adjustDelta")}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("adjustReason")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="sm" disabled={adjustMut.isPending}>
                  {t("adjustSubmit")}
                </Button>
              </form>
            </Form>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
