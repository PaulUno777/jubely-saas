"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { agentLoginFormSchema, type AgentLoginForm } from "@jubely/api-schemas";
import { useMutation } from "@tanstack/react-query";
import { Key, Loader2, LogIn, Smartphone } from "lucide-react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  JubelyLogo,
  MethodCard,
  OtpInput,
} from "@jubely/ui";
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
  const steps = useMemo(
    () => [
      { label: "Identité" },
      { label: "Méthode 2FA" },
      { label: "Vérification" },
      { label: "Passkey" },
    ],
    [],
  );

  const [flow, setFlow] = useState<
    | { screen: "identity" }
    | { screen: "method"; challengeToken: string; methods: ("totp" | "passkey")[] }
    | { screen: "totp"; challengeToken: string }
    | { screen: "passkey"; challengeToken: string }
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
          : "Erreur";
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
          toast.error("Erreur: challenge manquant");
          return;
        }
        if (methods.length > 1) {
          setFlow({ screen: "method", challengeToken: token, methods });
        } else if (methods[0] === "passkey") {
          setFlow({ screen: "passkey", challengeToken: token });
        } else {
          setFlow({ screen: "totp", challengeToken: token });
        }
        return;
      }

      const access = String((resp as LoginOK)?.access_token ?? "");
      if (!access) {
        toast.error("Connexion invalide");
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
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erreur"),
  });

  const currentStep =
    flow.screen === "identity" ? 0 : flow.screen === "method" ? 1 : flow.screen === "totp" ? 2 : 3;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12 bg-background">
      <JubelyLogo size="md" />
      <div className="w-full max-w-xl">
        <AuthStepNav steps={steps} currentStep={currentStep} className="mb-6" />

        {flow.screen === "identity" ? (
          <AuthCard currentStep={1} totalSteps={3}>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">ACCÈS</p>
            <h1 className="mt-2 font-display text-3xl font-normal tracking-tight">Bonjour.</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Connectez-vous pour accéder à votre portail (root, store, agent, customer).
            </p>

            <div className="mt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit((v) => loginMut.mutate(v))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse email</FormLabel>
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
                        <FormLabel>Mot de passe</FormLabel>
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
                        <FormLabel>Slug tenant (magasin)</FormLabel>
                        <FormControl>
                          <Input autoComplete="off" placeholder="chez-mama" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={loginMut.isPending}>
                    {loginMut.isPending ? <Loader2 className="animate-spin" /> : <LogIn size={16} />}
                    Continuer
                  </Button>
                </form>
              </Form>
            </div>
          </AuthCard>
        ) : null}

        {flow.screen === "method" ? (
          <AuthCard currentStep={2} totalSteps={3}>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">DEUXIÈME FACTEUR</p>
            <h2 className="mt-2 font-display text-3xl font-normal tracking-tight">Choisir la méthode</h2>
            <p className="mt-2 text-sm text-muted-foreground">Comment souhaitez-vous vérifier votre identité ?</p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <MethodCard
                icon={<Smartphone size={20} />}
                title="App TOTP"
                description="Google Auth, Authy, 1Password"
                selected={false}
                onClick={() => setFlow({ screen: "totp", challengeToken: flow.challengeToken })}
              />
              <MethodCard
                icon={<Key size={20} />}
                title="Passkey"
                description="Face ID, Touch ID, clé FIDO2"
                selected={false}
                onClick={() => setFlow({ screen: "passkey", challengeToken: flow.challengeToken })}
              />
            </div>
          </AuthCard>
        ) : null}

        {flow.screen === "totp" ? (
          <AuthCard currentStep={3} totalSteps={3}>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">APP AUTHENTICATOR</p>
            <h2 className="mt-2 font-display text-3xl font-normal tracking-tight">Code à 6 chiffres</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ouvrez Google Authenticator ou Authy et saisissez le code.
            </p>
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
                Retour
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
                    if (!access) throw new Error("Réponse invalide");
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
                    toast.error(e instanceof Error ? e.message : "Erreur");
                  }
                }}
              >
                Vérifier le code
              </Button>
            </div>
          </AuthCard>
        ) : null}

        {flow.screen === "passkey" ? (
          <AuthCard currentStep={3} totalSteps={3}>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">PASSKEY</p>
            <h2 className="mt-2 font-display text-3xl font-normal tracking-tight">Vérification biométrique</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Utilisez Face ID, Touch ID ou votre clé de sécurité pour vous connecter sans code.
            </p>
            <div className="mt-6 flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setFlow({ screen: "method", challengeToken: flow.challengeToken, methods: ["totp", "passkey"] })}
                type="button"
                className="flex-1"
              >
                Retour
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
                    if (!access) throw new Error("Réponse invalide");
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
                    toast.error(e instanceof Error ? e.message : "Erreur");
                  }
                }}
              >
                <Key size={16} />
                Authentifier avec passkey
              </Button>
            </div>
          </AuthCard>
        ) : null}
      </div>
    </div>
  );
}

