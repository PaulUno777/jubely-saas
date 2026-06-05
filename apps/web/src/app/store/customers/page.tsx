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
import { storeListCustomers } from "@/lib/storeApi";

function formatDate(value: string | number | Date) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function StoreCustomersPage() {
  const t = useTranslations("store.customers");
  const { session } = useSession();

  const q = useQuery({
    queryKey: ["store", "customers"],
    enabled: Boolean(session),
    queryFn: () => storeListCustomers({ limit: 100, offset: 0 }),
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
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("phone")}</TableHead>
                  <TableHead>{t("tier")}</TableHead>
                  <TableHead className="text-right">{t("points")}</TableHead>
                  <TableHead>{t("enrolledAt")}</TableHead>
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
                  q.data.map((row) => (
                    <TableRow key={row.enrollment_id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="font-mono text-sm">{row.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.tier}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{row.points_balance}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(row.enrolled_at)}
                      </TableCell>
                    </TableRow>
                  ))
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
