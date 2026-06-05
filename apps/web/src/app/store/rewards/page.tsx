"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { storeCreateReward, storeListRewards } from "@/lib/storeApi";

export default function StoreRewardsPage() {
  const t = useTranslations("store.rewards");
  const { session } = useSession();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [pointCost, setPointCost] = useState("100");
  const [description, setDescription] = useState("");

  const q = useQuery({
    queryKey: ["store", "rewards"],
    enabled: Boolean(session),
    queryFn: () => storeListRewards(false),
  });

  const createMut = useMutation({
    mutationFn: () =>
      storeCreateReward({
        name: name.trim(),
        description: description.trim(),
        point_cost: parseInt(pointCost, 10) || 0,
        active: true,
      }),
    onSuccess: () => {
      setName("");
      setDescription("");
      void qc.invalidateQueries({ queryKey: ["store", "rewards"] });
      toast.success(t("created"));
    },
    onError: (e) => toast.error(e instanceof ApiResponseError ? e.message : t("createError")),
  });

  return (
    <>
      <StorePageHeader title={t("title")} />
      <Main className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("addTitle")}</CardTitle>
            <CardDescription>{t("addDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 max-w-md">
            <div className="grid gap-2">
              <Label htmlFor="reward-name">{t("name")}</Label>
              <Input id="reward-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reward-cost">{t("pointCost")}</Label>
              <Input id="reward-cost" type="number" min={1} value={pointCost} onChange={(e) => setPointCost(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reward-desc">{t("description")}</Label>
              <Input id="reward-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Button
              type="button"
              disabled={!name.trim() || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              {t("create")}
            </Button>
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
                  <TableHead>{t("pointCost")}</TableHead>
                  <TableHead>{t("tier")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-muted-foreground">{t("loading")}</TableCell>
                  </TableRow>
                ) : q.error ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-destructive">
                      {q.error instanceof ApiResponseError ? q.error.message : t("loadError")}
                    </TableCell>
                  </TableRow>
                ) : q.data?.length ? (
                  q.data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="font-mono tabular-nums">{row.point_cost}</TableCell>
                      <TableCell><Badge variant="outline">{row.min_tier}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={row.active ? "default" : "secondary"}>
                          {row.active ? t("active") : t("inactive")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-muted-foreground">{t("empty")}</TableCell>
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
