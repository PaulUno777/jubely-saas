"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiResponseError } from "@jubely/api-schemas";
import {
  Badge,
  Button,
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
import { QRCodeCanvas } from "qrcode.react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { pwaGetWallet } from "@/lib/customerApi";
import {
  clearCustomerQr,
  loadCustomerQr,
  subscribeCustomerQr,
} from "@/lib/customerSession";

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

export default function CustomerWalletPage() {
  const t = useTranslations("customer.wallet");
  const token = useSyncExternalStore(
    subscribeCustomerQr,
    loadCustomerQr,
    () => null,
  );

  const walletQ = useQuery({
    queryKey: ["pwa", "wallet", token],
    enabled: Boolean(token),
    queryFn: () => pwaGetWallet(token!),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("hint")}</p>
      </div>

      {!token ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/customer/enroll">{t("enrollCta")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {walletQ.isLoading ? (
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          ) : walletQ.error ? (
            <p className="text-sm text-destructive">
              {walletQ.error instanceof ApiResponseError
                ? walletQ.error.message
                : t("loadError")}
            </p>
          ) : walletQ.data ? (
            <Card className="border-human/30 bg-human-surface/30">
              <CardHeader>
                <CardTitle>{walletQ.data.tenant_name}</CardTitle>
                <CardDescription>
                  {t("tier")}:{" "}
                  <Badge variant="outline">{walletQ.data.tier}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("balance")}
                  </p>
                  <p className="font-display text-4xl tabular-nums">
                    {walletQ.data.points_balance}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("pointsLabel")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="space-y-4 rounded-xl border border-border bg-card p-6">
            <p className="text-sm font-medium">{t("qrTitle")}</p>
            <div className="inline-block rounded-lg border border-border bg-background p-3">
              <QRCodeCanvas value={token} size={200} />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => clearCustomerQr()}
            >
              {t("clear")}
            </Button>
          </div>

          {walletQ.data?.recent_events.length ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("historyTitle")}</CardTitle>
                <CardDescription>{t("historyHint")}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("date")}</TableHead>
                      <TableHead>{t("type")}</TableHead>
                      <TableHead>{t("amount")}</TableHead>
                      <TableHead className="text-right">
                        {t("points")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {walletQ.data.recent_events.map((row) => (
                      <TableRow key={row.event_id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(row.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.event_type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {amountFromPayload(row.payload) ?? "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {row.delta > 0 ? `+${row.delta}` : row.delta}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
