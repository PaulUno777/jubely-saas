"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ApiResponseError,
  recordPurchaseFormSchema,
  type RecordPurchaseForm,
} from "@jubely/api-schemas";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { staffRecordPurchase } from "@/lib/staffApi";
import { useSession } from "@/hooks/useSession";

export default function AgentPurchasePage() {
  const t = useTranslations("agent.purchase");
  const { session } = useSession();
  const [result, setResult] = useState<{ points_awarded: number; delta: number } | null>(null);

  const form = useForm<RecordPurchaseForm>({
    resolver: zodResolver(recordPurchaseFormSchema),
    defaultValues: { phone: "", amount_fcfa: 500 },
  });

  const mut = useMutation({
    mutationFn: (values: RecordPurchaseForm) => staffRecordPurchase({ values }),
    onSuccess: (out) => {
      setResult({ points_awarded: out.points_awarded, delta: out.delta });
      toast.success(t("success", { points: String(out.points_awarded) }));
      form.reset({ phone: "", amount_fcfa: 500 });
    },
    onError: (e) => {
      toast.error(e instanceof ApiResponseError ? e.message : t("error"));
    },
  });

  if (!session) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">{t("sessionRequired")}</p>
        <Link className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-4" href="/login">
          {t("goLogin")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("formTitle")}</CardTitle>
          <CardDescription>{t("formHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => {
              setResult(null);
              mut.mutate(values);
            })}
          >
            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input id="phone" placeholder="+237611111111" {...form.register("phone")} />
              {form.formState.errors.phone ? (
                <p className="text-sm text-destructive">{t("phoneRequired")}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount_fcfa">{t("amount")}</Label>
              <Input
                id="amount_fcfa"
                type="number"
                min={500}
                step={1}
                {...form.register("amount_fcfa", { valueAsNumber: true })}
              />
              {form.formState.errors.amount_fcfa ? (
                <p className="text-sm text-destructive">{t("amountInvalid")}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">{t("ruleHint")}</p>
            </div>

            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? t("submitting") : t("submit")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">{t("resultTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{t("resultBody", { points: String(result.points_awarded) })}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
