"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@jubely/ui";
import { ApiResponseError } from "@jubely/api-schemas";
import { useTranslations } from "next-intl";
import { Main } from "@/components/layout/main";
import { StorePageHeader } from "@/components/store/store-page-header";
import { useSession } from "@/hooks/useSession";
import { storeListPointEvents } from "@/lib/storeApi";

function formatDate(value: string | number | Date) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function amountFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const amount = (payload as { amount_fcfa?: unknown }).amount_fcfa;
  if (typeof amount === "number") return `${amount.toLocaleString()} FCFA`;
  return null;
}

export default function StoreTransactionsPage() {
  const t = useTranslations("store.transactions");
  const { session } = useSession();

  const q = useQuery({
    queryKey: ["store", "transactions"],
    enabled: Boolean(session),
    queryFn: () => storeListPointEvents({ limit: 100, offset: 0 }),
  });

  return (
    <>
      <StorePageHeader title={t("title")} />
      <Main>
        <Card>
          <CardHeader>
            <CardTitle>{t("listTitle")}</CardTitle>
            <CardDescription>{t("listDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("customer")}</TableHead>
                  <TableHead>{t("type")}</TableHead>
                  <TableHead>{t("amount")}</TableHead>
                  <TableHead className="text-right">{t("points")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-muted-foreground">
                      {t("loading")}
                    </TableCell>
                  </TableRow>
                ) : q.error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-destructive">
                      {q.error instanceof ApiResponseError ? q.error.message : t("loadError")}
                    </TableCell>
                  </TableRow>
                ) : q.data?.length ? (
                  q.data.map((row) => {
                    const amount = amountFromPayload(row.payload);
                    return (
                      <TableRow key={row.event_id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(row.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{row.customer_name ?? "—"}</div>
                          {row.customer_phone ? (
                            <div className="font-mono text-xs text-muted-foreground">{row.customer_phone}</div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.event_type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{amount ?? "—"}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {row.delta > 0 ? `+${row.delta}` : row.delta}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-muted-foreground">
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
