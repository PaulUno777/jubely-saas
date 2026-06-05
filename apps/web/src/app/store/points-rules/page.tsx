"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@jubely/ui";
import { ApiResponseError } from "@jubely/api-schemas";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Main } from "@/components/layout/main";
import { StorePageHeader } from "@/components/store/store-page-header";
import { useSession } from "@/hooks/useSession";
import { storeListRules, storeSimulateRules } from "@/lib/storeRulesApi";

export default function StorePointsRulesPage() {
  const t = useTranslations("store.pointsRules");
  const { session } = useSession();
  const [amount, setAmount] = useState("5000");
  const [tier, setTier] = useState("bronze");

  const rulesQ = useQuery({
    queryKey: ["store", "rules"],
    enabled: Boolean(session),
    queryFn: () => storeListRules(),
  });

  const simMut = useMutation({
    mutationFn: () =>
      storeSimulateRules({
        amount_fcfa: parseInt(amount, 10) || 0,
        tier,
        is_new: false,
      }),
    onError: (e) => toast.error(e instanceof ApiResponseError ? e.message : t("simulateError")),
  });

  return (
    <>
      <StorePageHeader title={t("title")} />
      <Main className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("simulatorTitle")}</CardTitle>
            <CardDescription>{t("simulatorDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 max-w-md">
            <div className="grid gap-2">
              <Label>{t("amount")}</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("tier")}</Label>
              <Input value={tier} onChange={(e) => setTier(e.target.value)} />
            </div>
            <Button type="button" disabled={simMut.isPending} onClick={() => simMut.mutate()}>
              {t("simulate")}
            </Button>
            {simMut.data && (
              <p className="text-sm font-medium">
                {t("simulateResult", { total: String(simMut.data.total) })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("listTitle")}</CardTitle>
            <CardDescription>{t("listDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("trigger")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rulesQ.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-sm text-muted-foreground">{t("loading")}</TableCell>
                  </TableRow>
                ) : rulesQ.data?.length ? (
                  rulesQ.data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.rule.name}</TableCell>
                      <TableCell>{row.rule.trigger}</TableCell>
                      <TableCell>
                        <Badge variant={row.active && row.rule.on ? "default" : "secondary"}>
                          {row.active && row.rule.on ? t("active") : t("inactive")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-sm text-muted-foreground">{t("empty")}</TableCell>
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
