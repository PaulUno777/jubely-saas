"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ApiResponseError } from "@jubely/api-schemas";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@jubely/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { publicAcceptInvitation, publicGetInvitationPreview } from "@/lib/publicApi";

function inviteStatusMessage(code: string, t: ReturnType<typeof useTranslations<"auth.invite">>) {
  if (code === "error.invitation.expired") return t("expired");
  if (code === "error.invitation.already_accepted") return t("alreadyAccepted");
  return t("notFound");
}

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const token = String(params?.token ?? "").trim();
  const t = useTranslations("auth.invite");

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [activatedSlug, setActivatedSlug] = useState<string | null>(null);

  const previewQ = useQuery({
    queryKey: ["invitation", token],
    enabled: Boolean(token),
    queryFn: () => publicGetInvitationPreview(token),
  });

  const acceptMut = useMutation({
    mutationFn: () => publicAcceptInvitation(token, password),
    onSuccess: () => {
      if (previewQ.data?.valid) {
        setActivatedSlug(previewQ.data.tenant_slug);
      }
      toast.success(t("successTitle"));
    },
    onError: (e) => toast.error(e instanceof ApiResponseError ? e.message : t("genericError")),
  });

  const loginHref = useMemo(() => {
    if (!activatedSlug) return "/login";
    return `/login?workspace=1&invited=${encodeURIComponent(activatedSlug)}`;
  }, [activatedSlug]);

  if (!token) {
    return <p className="p-6 text-sm text-muted-foreground">{t("invalidToken")}</p>;
  }

  if (previewQ.isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">{t("loading")}</p>;
  }

  if (previewQ.error) {
    return <p className="p-6 text-sm text-destructive">{t("notFound")}</p>;
  }

  const preview = previewQ.data;
  if (!preview) {
    return <p className="p-6 text-sm text-destructive">{t("notFound")}</p>;
  }

  if (activatedSlug) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("successTitle")}</CardTitle>
            <CardDescription>{t("successBody")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/50 px-4 py-3">
              <p className="text-xs text-muted-foreground">{t("storeLabel")}</p>
              <p className="text-sm font-medium">
                {previewQ.data && "tenant_name" in previewQ.data ? previewQ.data.tenant_name : ""}
              </p>
              <p className="font-mono text-xs text-muted-foreground">{activatedSlug}</p>
            </div>
            <Button asChild>
              <Link href={loginHref}>{t("goToLogin")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!preview.valid) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="text-sm text-destructive">{inviteStatusMessage(preview.code, t)}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/login">{t("goToLogin")}</Link>
        </Button>
      </div>
    );
  }

  const canSubmit =
    password.length >= 8 && passwordConfirm.length >= 8 && password === passwordConfirm;

  return (
    <div className="mx-auto max-w-lg px-4 py-10 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{preview.tenant_name}</CardTitle>
          <CardDescription>
            {t("emailLabel")}: {preview.email_masked} · {t("roleLabel")}: {preview.role}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">{t("passwordConfirm")}</Label>
            <Input
              id="passwordConfirm"
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
            {passwordConfirm && password !== passwordConfirm ? (
              <p className="text-xs text-destructive">{t("passwordMismatch")}</p>
            ) : null}
          </div>
          <Button
            type="button"
            disabled={acceptMut.isPending || !canSubmit}
            onClick={() => {
              if (password !== passwordConfirm) {
                toast.error(t("passwordMismatch"));
                return;
              }
              acceptMut.mutate();
            }}
          >
            {acceptMut.isPending ? t("activating") : t("activate")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
