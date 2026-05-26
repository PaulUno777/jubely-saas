"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { agentLoginFormSchema, type AgentLoginForm } from "@jubely/api-schemas";
import { useMutation } from "@tanstack/react-query";
import { Key, Loader2, LogIn, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  AuthCard,
  AuthStepNav,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  JubelyLogo,
  Label,
  MethodCard,
  OtpInput,
} from "@jubely/ui";
import { LanguageSelector } from "@/components/preferences/language-selector";
import { ThemeSelector } from "@/components/preferences/theme-selector";
import { acceptLanguage, joinUrl } from "@/lib/http";
import { customerAuthLogin } from "@/lib/customerApi";
import { publicOtpSend, publicOtpVerify } from "@/lib/publicApi";
import {
  applyAuthSession,
  bootstrapAuthFromServer,
  loadSession,
  type MfaSummary,
  type Role,
  type WorkspaceSummary,
} from "@/lib/session";
import { startAuthentication } from "@simplewebauthn/browser";

type MFAMethod = "totp" | "passkey";
type AuthWorkspace = {
  membership_id: string;
  tenant_id: string;
  tenant_name?: string;
  tenant_slug?: string;
  role: string;
  permissions?: string[];
};
type AuthCustomerEnrollment = {
  enrollment_id: string;
  tenant_id: string;
  tenant_name?: string;
  tenant_slug?: string;
  tier?: string;
  points_balance?: number;
};
type AuthSessionLike = {
  user_id: string;
  membership_id?: string | null;
  tenant_id?: string | null;
  role?: string | null;
  email?: string;
  must_change_password?: boolean;
  workspaces?: AuthWorkspace[];
  customer_id?: string | null;
  active_enrollment_id?: string | null;
  customer_enrollments?: AuthCustomerEnrollment[];
  mfa?: MfaSummary;
};
type LoginMFARequired = {
  step: "mfa_required";
  challenge_token: string;
  methods: MFAMethod[];
} & Partial<AuthSessionLike>;
type LoginWorkspaceRequired = {
  step: "workspace_selection_required";
} & AuthSessionLike;
type LoginOKBff = {
  step: "ok";
} & AuthSessionLike;
type LoginResponse = LoginMFARequired | LoginWorkspaceRequired | LoginOKBff;

function routeAfterLogin(role: Role) {
  if (role === "superadmin") return "/root";
  if (role === "merchant_admin") return "/store";
  if (role === "staff") return "/agent";
  return "/customer";
}

function toWorkspaceSummary(workspaces?: AuthWorkspace[]): WorkspaceSummary[] {
  return Array.isArray(workspaces)
    ? workspaces.map((workspace) => ({
        membershipId: workspace.membership_id,
        tenantId: workspace.tenant_id,
        tenantName: workspace.tenant_name ?? "",
        tenantSlug: workspace.tenant_slug ?? "",
        role: workspace.role as Role,
        permissions: Array.isArray(workspace.permissions) ? workspace.permissions : [],
      }))
    : [];
}

function resolvePostLoginPath(data: AuthSessionLike): string | null {
  if (data.must_change_password) return "/account/password";
  if (!data.role) return null;
  return routeAfterLogin(data.role as Role);
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    | { screen: "workspace"; workspaces: WorkspaceSummary[] }
    | { screen: "method"; challengeToken: string; methods: MFAMethod[] }
    | { screen: "totp"; challengeToken: string; availableMethods: MFAMethod[] }
    | { screen: "passkey"; challengeToken: string; availableMethods: MFAMethod[] }
  >({ screen: "identity" });

  const [entryMode, setEntryMode] = useState<"worker" | "customer">("worker");
  const [otp, setOtp] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [customerVerifyToken, setCustomerVerifyToken] = useState<string | null>(null);

  const form = useForm<AgentLoginForm>({
    resolver: zodResolver(agentLoginFormSchema),
    defaultValues: { email: "", password: "", tenantSlug: "" },
  });

  const invitedWorkspace = searchParams.get("invited")?.trim() ?? "";

  useEffect(() => {
    if (!searchParams.get("workspace")) return;
    void bootstrapAuthFromServer().then((ok) => {
      if (!ok) return;
      const session = loadSession();
      if (session && !session.tenantId && session.workspaces.length > 1) {
        setFlow({ screen: "workspace", workspaces: session.workspaces });
      }
    });
  }, [searchParams]);

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

  function handleAuthSuccess(data: AuthSessionLike & { step?: string }) {
    if (!data.user_id) {
      toast.error(tErrors("invalidLogin"));
      return;
    }
    applyAuthSession({
      user_id: data.user_id,
      membership_id: data.membership_id ?? null,
      tenant_id: data.tenant_id ?? null,
      role: data.role ?? null,
      email: data.email,
      must_change_password: data.must_change_password,
      customer_id: data.customer_id ?? null,
      active_enrollment_id: data.active_enrollment_id ?? null,
      workspaces: data.workspaces,
      customer_enrollments: data.customer_enrollments,
      mfa: data.mfa,
    });

    const workspaces = toWorkspaceSummary(data.workspaces);
    if (data.must_change_password) {
      router.push("/account/password");
      return;
    }
    if ((data.step === "workspace_selection_required" || (!data.tenant_id && workspaces.length > 1)) && entryMode === "worker") {
      setFlow({ screen: "workspace", workspaces });
      return;
    }
    const nextPath = resolvePostLoginPath(data);
    if (nextPath) {
      router.push(nextPath);
      return;
    }
    if ((data.customer_enrollments?.length ?? 0) > 0) {
      router.push("/customer/wallet");
    }
  }

  const loginMut = useMutation({
    mutationFn: async (values: AgentLoginForm) => {
      const parsed = agentLoginFormSchema.parse(values);
      return postAuthBff("/api/auth/login", {
        email: parsed.email.trim(),
        password: parsed.password,
        ...(invitedWorkspace ? { tenant_slug: invitedWorkspace } : {}),
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

      if (resp?.step !== "ok" && resp?.step !== "workspace_selection_required") {
        toast.error(tErrors("invalidLogin"));
        return;
      }
      handleAuthSuccess(resp);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : tErrors("generic")),
  });

  const sendCustomerOtpMut = useMutation({
    mutationFn: async () => publicOtpSend(customerPhone.trim()),
    onSuccess: () => toast.success("Code sent."),
    onError: (e) => toast.error(e instanceof Error ? e.message : tErrors("generic")),
  });

  const verifyCustomerOtpMut = useMutation({
    mutationFn: async () => {
      const verified = await publicOtpVerify(customerPhone.trim(), customerCode.trim());
      return customerAuthLogin(verified.phone_verify_token);
    },
    onSuccess: (json) => {
      const data = (json as { data?: AuthSessionLike }).data;
      if (!data) {
        toast.error(tErrors("invalidLogin"));
        return;
      }
      setCustomerVerifyToken("verified");
      handleAuthSuccess({ ...data, step: "ok" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : tErrors("generic")),
  });

  const selectWorkspaceMut = useMutation({
    mutationFn: async (membershipId: string) =>
      postAuthBff("/api/auth/workspace", { membership_id: membershipId }),
    onSuccess: (data) => handleAuthSuccess({ ...(data as AuthSessionLike), step: "ok" }),
    onError: (e) => toast.error(e instanceof Error ? e.message : tErrors("generic")),
  });

  const showMfaStepNav = flow.screen === "method" || flow.screen === "totp" || flow.screen === "passkey";
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

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
                <Button
                  type="button"
                  variant={entryMode === "worker" ? "default" : "ghost"}
                  onClick={() => setEntryMode("worker")}
                >
                  {tLogin("title")}
                </Button>
                <Button
                  type="button"
                  variant={entryMode === "customer" ? "default" : "ghost"}
                  onClick={() => setEntryMode("customer")}
                >
                  Loyalty card
                </Button>
              </div>

              {entryMode === "worker" ? (
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
                    {invitedWorkspace ? (
                      <p className="text-xs text-muted-foreground">
                        Workspace hint: <span className="font-mono">{invitedWorkspace}</span>
                      </p>
                    ) : null}
                    <Button type="submit" className="w-full" disabled={loginMut.isPending}>
                      {loginMut.isPending ? <Loader2 className="animate-spin" /> : <LogIn size={16} />}
                      {tForm("continue")}
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(event.target.value)}
                      placeholder="+237..."
                      autoComplete="tel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Verification code</Label>
                    <Input
                      value={customerCode}
                      onChange={(event) => setCustomerCode(event.target.value)}
                      inputMode="numeric"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1"
                      disabled={sendCustomerOtpMut.isPending || !customerPhone.trim()}
                      onClick={() => sendCustomerOtpMut.mutate()}
                    >
                      {sendCustomerOtpMut.isPending ? <Loader2 className="animate-spin" /> : <Smartphone size={16} />}
                      Send code
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      disabled={verifyCustomerOtpMut.isPending || !customerPhone.trim() || !customerCode.trim()}
                      onClick={() => verifyCustomerOtpMut.mutate()}
                    >
                      {verifyCustomerOtpMut.isPending ? <Loader2 className="animate-spin" /> : <LogIn size={16} />}
                      Sign in
                    </Button>
                  </div>
                  {customerVerifyToken ? (
                    <p className="text-xs text-muted-foreground">Phone verified for this session.</p>
                  ) : null}
                </div>
              )}
            </div>
          </AuthCard>
        ) : null}

        {flow.screen === "workspace" ? (
          <AuthCard currentStep={1} totalSteps={1}>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Workspace
            </p>
            <h2 className="mt-2 font-display text-3xl font-normal tracking-tight">Choose your workspace</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Select the store you want to manage for this session.
            </p>
            <div className="mt-6 space-y-3">
              {flow.workspaces.map((workspace) => (
                <button
                  key={workspace.membershipId}
                  type="button"
                  onClick={() => selectWorkspaceMut.mutate(workspace.membershipId)}
                  className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-left transition hover:border-foreground/30"
                >
                  <div className="font-medium">{workspace.tenantName || workspace.tenantSlug}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {workspace.role.replaceAll("_", " ")} {workspace.tenantSlug ? `· ${workspace.tenantSlug}` : ""}
                  </div>
                </button>
              ))}
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
                    handleAuthSuccess(data as AuthSessionLike & { step?: string });
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
                    handleAuthSuccess(finish as AuthSessionLike & { step?: string });
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
