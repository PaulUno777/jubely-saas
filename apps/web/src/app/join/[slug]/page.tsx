"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
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
import { ApiResponseError } from "@jubely/api-schemas";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { customerAuthLogin, customerSelectContext, enrollByStoreQr } from "@/lib/customerApi";
import { publicGetTenantBySlug, publicOtpSend, publicOtpVerify } from "@/lib/publicApi";
import { bootstrapAuthFromServer, loadSession, tryRefreshAccessToken } from "@/lib/session";

export default function JoinBySlugPage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug ?? "");
  const t = useTranslations("customer.join");
  const router = useRouter();

  const tenantQ = useQuery({
    queryKey: ["public", "tenant", slug],
    enabled: Boolean(slug),
    queryFn: () => publicGetTenantBySlug(slug),
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verifyToken, setVerifyToken] = useState<string | null>(null);

  const sendMut = useMutation({
    mutationFn: () => publicOtpSend(phone.trim()),
    onSuccess: (data) => {
      setVerificationId(data.id);
      toast.success(t("otpSent"));
    },
    onError: (e) => toast.error(e instanceof ApiResponseError ? e.message : t("genericError")),
  });

  const verifyMut = useMutation({
    mutationFn: () => {
      if (!verificationId) throw new Error("Send OTP first");
      return publicOtpVerify(verificationId, otp.trim());
    },
    onSuccess: (data) => {
      setVerifyToken(data.phone_verify_token);
      toast.success(t("otpVerified"));
    },
    onError: (e) => toast.error(e instanceof ApiResponseError ? e.message : t("genericError")),
  });

  const enrollMut = useMutation({
    mutationFn: () =>
      enrollByStoreQr({
        storeQr: tenantQ.data!.store_qr,
        phone,
        name,
        email,
        phoneVerifyToken: verifyToken ?? undefined,
      }),
    onSuccess: (out) => {
      void (async () => {
        if (verifyToken) {
          await customerAuthLogin(verifyToken);
        } else if (loadSession()?.userId) {
          await tryRefreshAccessToken();
        }
        if (out.enrollment_id) {
          try {
            await customerSelectContext(out.enrollment_id);
          } catch {
            // Session may not exist yet; bootstrap still refreshes the latest customer context.
          }
        }
        await bootstrapAuthFromServer();
        toast.success(t("enrolled"));
        router.push("/customer/wallet");
      })().catch((error) => {
        toast.error(error instanceof Error ? error.message : t("genericError"));
      });
    },
    onError: (e) => toast.error(e instanceof ApiResponseError ? e.message : t("genericError")),
  });

  if (!slug) {
    return <p className="p-6 text-sm text-muted-foreground">{t("invalidSlug")}</p>;
  }

  if (tenantQ.isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">{t("loading")}</p>;
  }

  if (tenantQ.error || !tenantQ.data) {
    return <p className="p-6 text-sm text-destructive">{t("notFound")}</p>;
  }

  const canEnroll = name.trim() && phone.trim() && tenantQ.data.store_qr;

  return (
    <div className="mx-auto max-w-lg px-4 py-10 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight">{tenantQ.data.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("formTitle")}</CardTitle>
          <CardDescription>{t("formHint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="+237…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="outline" disabled={sendMut.isPending || !phone.trim()} onClick={() => sendMut.mutate()}>
              {t("sendOtp")}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="otp">{t("otpCode")}</Label>
            <Input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" />
            <Button type="button" variant="secondary" disabled={verifyMut.isPending || !otp.trim()} onClick={() => verifyMut.mutate()}>
              {t("verifyOtp")}
            </Button>
          </div>

          {verifyToken ? <p className="text-xs text-muted-foreground">{t("verifiedHint")}</p> : null}

          <Button
            type="button"
            disabled={enrollMut.isPending || !canEnroll}
            onClick={() => {
              if (!tenantQ.data) return;
              enrollMut.mutate();
            }}
          >
            {t("enroll")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
