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
import { acceptLanguage, joinUrl } from "@/lib/http";
import { applyAuthSession, type MfaSummary, type Role } from "@/lib/session";
import { startAuthentication } from "@simplewebauthn/browser";

type MFAMethod = "totp" | "passkey";
type LoginMFARequired = {
  step: "mfa_required";
  challenge_token: string;
  methods: MFAMethod[];
  must_change_password?: boolean;
  user_id?: string;
  tenant_id?: string | null;
  role?: string;
  email?: string;
  mfa?: MfaSummary;
};
type LoginOKBff = {
  step: "ok";
  user_id: string;
  tenant_id?: string | null;
  role: string;
  email?: string;
  must_change_password?: boolean;
  mfa?: MfaSummary;
};
type LoginResponse = LoginMFARequired | LoginOKBff;

function routeAfterLogin(role: Role) {
  if (role === "superadmin") return "/root";
  if (role === "merchant_admin") return "/store";
  if (role === "staff") return "/agent";
  return "/customer";
}

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

  async function postAuthBff(path: string, body: unknown): Promise<unknown> {
    const res = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "accept-language": acceptLanguage(),
      },
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

  async function postUpstreamJson(path: string, body: unknown): Promise<unknown> {
    const res = await fetch(joinUrl(path), {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "accept-language": acceptLanguage(),
      },
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
      return postAuthBff("/api/auth/login", {
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

      if (resp?.step !== "ok") {
        toast.error(tErrors("invalidLogin"));
        return;
      }
      const ok = resp as LoginOKBff;
      if (!ok.user_id || !ok.role) {
        toast.error(tErrors("invalidLogin"));
        return;
      }
      applyAuthSession({
        user_id: ok.user_id,
        tenant_id: ok.tenant_id ?? null,
        role: ok.role,
        email: ok.email,
        must_change_password: ok.must_change_password,
        mfa: ok.mfa,
      });
      if (ok.must_change_password) {
        router.push("/account/password");
        return;
      }
      router.push(routeAfterLogin(ok.role as Role));
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
                    const data = await postAuthBff("/api/auth/mfa/totp/verify", {
                      challenge_token: flow.challengeToken,
                      code: otp,
                    });
                    const ok = data as LoginOKBff;
                    if (!ok?.user_id || !ok.role) throw new Error(tErrors("invalidLogin"));
                    applyAuthSession({
                      user_id: ok.user_id,
                      tenant_id: ok.tenant_id ?? null,
                      role: ok.role,
                      email: ok.email,
                      must_change_password: ok.must_change_password,
                      mfa: ok.mfa,
                    });
                    if (ok.must_change_password) {
                      router.push("/account/password");
                      return;
                    }
                    router.push(routeAfterLogin(ok.role as Role));
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
                    const begin = (await postUpstreamJson("/v1/auth/mfa/passkey/begin", {
                      challenge_token: flow.challengeToken,
                    })) as { challenge_id: string; options: Parameters<typeof startAuthentication>[0] };
                    const assertion = await startAuthentication(begin.options);
                    const finish = await postAuthBff("/api/auth/mfa/passkey/finish", {
                      challenge_token: flow.challengeToken,
                      challenge_id: begin.challenge_id,
                      ...assertion,
                    });
                    const ok = finish as LoginOKBff;
                    if (!ok?.user_id || !ok.role) throw new Error(tErrors("invalidLogin"));
                    applyAuthSession({
                      user_id: ok.user_id,
                      tenant_id: ok.tenant_id ?? null,
                      role: ok.role,
                      email: ok.email,
                      must_change_password: ok.must_change_password,
                      mfa: ok.mfa,
                    });
                    if (ok.must_change_password) {
                      router.push("/account/password");
                      return;
                    }
                    router.push(routeAfterLogin(ok.role as Role));
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
