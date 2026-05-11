"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { agentLoginFormSchema, type AgentLoginForm } from "@jubely/api-schemas";
import { useMutation } from "@tanstack/react-query";
import { Key, Loader2, LogIn, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  AuthCard,
  AuthStepNav,
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  JubelyLogo,
  MethodCard,
  OtpInput,
} from "@jubely/ui";
import { LanguageSelector } from "@/components/preferences/language-selector";
import { ThemeSelector } from "@/components/preferences/theme-selector";
import { API_BASE_URL } from "@/lib/env";
import { decodeSessionFromJWT, saveSession } from "@/lib/session";
import { startAuthentication } from "@simplewebauthn/browser";

type MFAMethod = "totp" | "passkey";
type LoginMFARequired = {
  step: "mfa_required";
  challenge_token: string;
  methods: MFAMethod[];
  must_change_password?: boolean;
};
type LoginOK = {
  step: "ok";
  access_token: string;
  refresh_token?: string;
  must_change_password?: boolean;
};
type LoginResponse = LoginMFARequired | LoginOK;

export default function LoginPage() {
  const router = useRouter();
  const tLogin = useTranslations("auth.login");
  const tForm = useTranslations("common.form");
  const tErrors = useTranslations("errors");

  const mfaSteps = useMemo(
    () => [
      { label: tLogin("mfaSteps.identity") },
      { label: tLogin("mfaSteps.method") },
      { label: tLogin("mfaSteps.verification") },
    ],
    [tLogin],
  );

  const [flow, setFlow] = useState<
    | { screen: "identity" }
    | { screen: "method"; challengeToken: string; methods: MFAMethod[] }
    | { screen: "totp"; challengeToken: string; availableMethods: MFAMethod[] }
    | { screen: "passkey"; challengeToken: string; availableMethods: MFAMethod[] }
  >({ screen: "identity" });

  const [otp, setOtp] = useState("");

  const form = useForm<AgentLoginForm>({
    resolver: zodResolver(agentLoginFormSchema),
    defaultValues: { email: "", password: "", tenantSlug: "" },
  });

  function joinUrl(path: string) {
    return `${API_BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  }

  async function postJson(path: string, body: unknown): Promise<unknown> {
    const res = await fetch(joinUrl(path), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as unknown;
    if (!res.ok) {
      const msg =
        typeof (json as { error?: { message?: unknown } })?.error?.message === "string"
          ? ((json as { error: { message: string } }).error.message as string)
          : tErrors("generic");
      throw new Error(msg);
    }
    return (json as { data?: unknown })?.data ?? json;
  }

  const loginMut = useMutation({
    mutationFn: async (values: AgentLoginForm) => {
      const parsed = agentLoginFormSchema.parse(values);
      return postJson("/v1/auth/login", {
        email: parsed.email.trim(),
        password: parsed.password,
        tenant_slug: parsed.tenantSlug?.trim() ?? "",
      });
    },
    onSuccess: (data) => {
      const resp = data as LoginResponse;
      if (resp?.step === "mfa_required") {
        const methods = Array.isArray(resp.methods) ? resp.methods : [];
        const token = String(resp.challenge_token ?? "");
        if (!token) {
          toast.error(tErrors("missingChallenge"));
          return;
        }
        if (methods.length > 1) {
          setFlow({ screen: "method", challengeToken: token, methods });
        } else if (methods[0] === "passkey") {
          setFlow({ screen: "passkey", challengeToken: token, availableMethods: methods });
        } else {
          setFlow({ screen: "totp", challengeToken: token, availableMethods: methods });
        }
        return;
      }

      const access = String((resp as LoginOK)?.access_token ?? "");
      if (!access) {
        toast.error(tErrors("invalidLogin"));
        return;
      }
      saveSession(access);
      if ((resp as LoginOK)?.must_change_password) {
        router.push("/account/password");
        return;
      }
      const sess = decodeSessionFromJWT(access);
      if (sess?.role === "superadmin") router.push("/root");
      else if (sess?.role === "merchant_admin") router.push("/store");
      else if (sess?.role === "staff") router.push("/agent");
      else router.push("/customer");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : tErrors("generic")),
  });

  const showMfaStepNav = flow.screen !== "identity";
  const mfaCurrentStep = flow.screen === "method" ? 1 : 2;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12 bg-background">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSelector profile="agent" />
        <ThemeSelector profile="agent" />
      </div>
      <JubelyLogo size="md" />
      <div className="w-full max-w-xl">
        {showMfaStepNav ? (
          <AuthStepNav steps={mfaSteps} currentStep={mfaCurrentStep} className="mb-6" />
        ) : null}

        {flow.screen === "identity" ? (
          <AuthCard currentStep={1} totalSteps={1}>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {tLogin("accessEyebrow")}
            </p>
            <h1 className="mt-2 font-display text-3xl font-normal tracking-tight">{tLogin("title")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{tLogin("subtitle")}</p>

            <div className="mt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit((v) => loginMut.mutate(v))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tForm("email")}</FormLabel>
                        <FormControl>
                          <Input type="email" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tForm("password")}</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="current-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tenantSlug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tLogin("tenantSlugLabel")}</FormLabel>
                        <FormControl>
                          <Input
                            autoComplete="off"
                            placeholder={tLogin("tenantSlugPlaceholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>{tLogin("tenantSlugHelp")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={loginMut.isPending}>
                    {loginMut.isPending ? <Loader2 className="animate-spin" /> : <LogIn size={16} />}
                    {tForm("continue")}
                  </Button>
                </form>
              </Form>
            </div>
          </AuthCard>
        ) : null}

        {flow.screen === "method" ? (
          <AuthCard currentStep={2} totalSteps={3}>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {tLogin("method.eyebrow")}
            </p>
            <h2 className="mt-2 font-display text-3xl font-normal tracking-tight">{tLogin("method.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{tLogin("method.subtitle")}</p>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
              {flow.methods.includes("totp") ? (
                <MethodCard
                  icon={<Smartphone size={20} />}
                  title={tLogin("method.totpTitle")}
                  description={tLogin("method.totpDescription")}
                  selected={false}
                  onClick={() =>
                    setFlow({
                      screen: "totp",
                      challengeToken: flow.challengeToken,
                      availableMethods: flow.methods,
                    })
                  }
                />
              ) : null}
              {flow.methods.includes("passkey") ? (
                <MethodCard
                  icon={<Key size={20} />}
                  title={tLogin("method.passkeyTitle")}
                  description={tLogin("method.passkeyDescription")}
                  selected={false}
                  onClick={() =>
                    setFlow({
                      screen: "passkey",
                      challengeToken: flow.challengeToken,
                      availableMethods: flow.methods,
                    })
                  }
                />
              ) : null}
            </div>
          </AuthCard>
        ) : null}

        {flow.screen === "totp" ? (
          <AuthCard currentStep={3} totalSteps={3}>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {tLogin("totp.eyebrow")}
            </p>
            <h2 className="mt-2 font-display text-3xl font-normal tracking-tight">{tLogin("totp.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{tLogin("totp.subtitle")}</p>
            <div className="mt-6">
              <OtpInput value={otp} onChange={setOtp} />
            </div>
            <div className="mt-6 flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setFlow({ screen: "identity" })}
                type="button"
                className="flex-1"
              >
                {tForm("back")}
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={otp.length !== 6}
                onClick={async () => {
                  try {
                    const data = await postJson("/v1/auth/mfa/totp/verify", {
                      challenge_token: flow.challengeToken,
                      code: otp,
                    });
                    const access = String((data as { access_token?: unknown })?.access_token ?? "");
                    if (!access) throw new Error(tErrors("invalidLogin"));
                    saveSession(access);
                    if ((data as { must_change_password?: unknown })?.must_change_password) {
                      router.push("/account/password");
                      return;
                    }
                    const sess = decodeSessionFromJWT(access);
                    if (sess?.role === "superadmin") router.push("/root");
                    else if (sess?.role === "merchant_admin") router.push("/store");
                    else if (sess?.role === "staff") router.push("/agent");
                    else router.push("/customer");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : tErrors("generic"));
                  }
                }}
              >
                {tLogin("totp.verify")}
              </Button>
            </div>
          </AuthCard>
        ) : null}

        {flow.screen === "passkey" ? (
          <AuthCard currentStep={3} totalSteps={3}>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {tLogin("passkey.eyebrow")}
            </p>
            <h2 className="mt-2 font-display text-3xl font-normal tracking-tight">{tLogin("passkey.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{tLogin("passkey.subtitle")}</p>
            <div className="mt-6 flex gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  setFlow({
                    screen: "method",
                    challengeToken: flow.challengeToken,
                    methods: flow.availableMethods,
                  })
                }
                type="button"
                className="flex-1"
              >
                {tForm("back")}
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={async () => {
                  try {
                    const begin = (await postJson("/v1/auth/mfa/passkey/begin", {
                      challenge_token: flow.challengeToken,
                    })) as { challenge_id: string; options: Parameters<typeof startAuthentication>[0] };
                    const assertion = await startAuthentication(begin.options);
                    const finish = await postJson("/v1/auth/mfa/passkey/finish", {
                      challenge_token: flow.challengeToken,
                      challenge_id: begin.challenge_id,
                      ...assertion,
                    });
                    const access = String((finish as { access_token?: unknown })?.access_token ?? "");
                    if (!access) throw new Error(tErrors("invalidLogin"));
                    saveSession(access);
                    if ((finish as { must_change_password?: unknown })?.must_change_password) {
                      router.push("/account/password");
                      return;
                    }
                    const sess = decodeSessionFromJWT(access);
                    if (sess?.role === "superadmin") router.push("/root");
                    else if (sess?.role === "merchant_admin") router.push("/store");
                    else if (sess?.role === "staff") router.push("/agent");
                    else router.push("/customer");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : tErrors("generic"));
                  }
                }}
              >
                <Key size={16} />
                {tLogin("passkey.authenticate")}
              </Button>
            </div>
          </AuthCard>
        ) : null}
      </div>
    </div>
  );
}
