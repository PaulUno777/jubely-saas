"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiResponseError } from "@jubely/api-schemas";
import { customerClaimReward, customerGetWallet, customerListRewards } from "@/lib/customerApi";
import { IconGift, IconCheck } from "@/components/agent/icons";
import { useSession } from "@/hooks/useSession";

function RewardRow({
  id,
  title,
  cost,
  affordable,
  onClaim,
  claiming,
}: {
  id: string;
  title: string;
  cost: number;
  affordable: boolean;
  onClaim: (id: string) => void;
  claiming: boolean;
}) {
  const t = useTranslations("customer.rewards");

  return (
    <div style={{ background: "var(--c-cream)", border: "1px solid var(--c-line)", borderRadius: 18, overflow: "hidden", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0,
          background: affordable ? "var(--c-mint)" : "var(--c-cream-2)",
          color: affordable ? "var(--c-green)" : "var(--c-ink-mut)",
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconGift size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--c-ink)" }}>{title}</div>
          <div style={{ fontSize: 12, color: "var(--c-ink-mut)", marginTop: 2 }}>
            {t("pointsCost", { pts: String(cost) })}
          </div>
        </div>
        <button
          type="button"
          disabled={!affordable || claiming}
          onClick={() => onClaim(id)}
          style={{ appearance: "none", border: 0, cursor: affordable && !claiming ? "pointer" : "default",
            padding: "8px 14px", borderRadius: 999,
            background: affordable ? "var(--c-green)" : "var(--c-cream-2)",
            color: affordable ? "#fff" : "var(--c-ink-mut)",
            fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, opacity: affordable ? 1 : 0.5 }}>
          {claiming ? "…" : affordable ? t("claim") : t("locked")}
        </button>
      </div>
    </div>
  );
}

export default function RewardsPage() {
  const t = useTranslations("customer.rewards");
  const router = useRouter();
  const qc = useQueryClient();
  const { session } = useSession();

  const walletQ = useQuery({
    queryKey: ["customer", "wallet", session?.activeEnrollmentId],
    enabled: Boolean(session?.activeEnrollmentId),
    queryFn: () => customerGetWallet(),
  });

  const rewardsQ = useQuery({
    queryKey: ["customer", "rewards", session?.activeEnrollmentId],
    enabled: Boolean(session?.activeEnrollmentId),
    queryFn: () => customerListRewards(),
  });

  const claimMut = useMutation({
    mutationFn: (rewardId: string) => customerClaimReward(rewardId),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["customer", "wallet"] });
      void qc.invalidateQueries({ queryKey: ["customer", "rewards"] });
      const params = new URLSearchParams({
        claim_qr: data.claim_qr,
        code: data.display_code,
        reward: data.reward_name,
        expires: String(data.expires_at),
      });
      router.push(`/customer/qr?${params.toString()}`);
    },
    onError: (e) => toast.error(e instanceof ApiResponseError ? e.message : t("claimError")),
  });

  const balance = rewardsQ.data?.points_balance ?? walletQ.data?.points_balance ?? 0;
  const tier = rewardsQ.data?.tier ?? walletQ.data?.tier ?? "—";

  return (
    <div style={{ paddingBottom: 8 }}>
      <div style={{ padding: "12px 20px 6px" }}>
        <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--c-ink-mut)", fontWeight: 600 }}>{t("title")}</div>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 2 }}>{t("title")}</div>
      </div>

      {session?.activeEnrollmentId && (
        <div style={{ padding: "4px 16px 0" }}>
          <div className="c-card-dark" style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{t("yourBalance")}</div>
              <div style={{ fontFamily: "var(--jubely-font-display)", fontStyle: "italic", fontSize: 34, color: "var(--c-gold-2)", lineHeight: 1 }}>
                {balance.toLocaleString("fr-FR")}
                <span style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", marginLeft: 6 }}>pts</span>
              </div>
            </div>
            <Link href="/customer/wallet" style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.7)", fontSize: 12.5, textDecoration: "none" }}>
              <IconCheck size={14} /> {tier}
            </Link>
          </div>
        </div>
      )}

      <div style={{ padding: "20px 16px 16px" }}>
        <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--c-ink-mut)", fontWeight: 600, marginBottom: 10 }}>{t("available")}</div>
        {rewardsQ.isLoading ? (
          <p style={{ fontSize: 13, color: "var(--c-ink-mut)" }}>{t("loading")}</p>
        ) : session?.activeEnrollmentId && rewardsQ.data?.rewards.length ? (
          rewardsQ.data.rewards.map((r) => (
            <RewardRow
              key={r.id}
              id={r.id}
              title={r.name}
              cost={r.point_cost}
              affordable={r.affordable}
              claiming={claimMut.isPending && claimMut.variables === r.id}
              onClaim={(id) => claimMut.mutate(id)}
            />
          ))
        ) : session?.activeEnrollmentId ? (
          <p style={{ fontSize: 13, color: "var(--c-ink-mut)" }}>{t("noRewards")}</p>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <IconGift size={32} color="var(--c-ink-mut)" />
            <p style={{ fontSize: 13, color: "var(--c-ink-mut)", marginTop: 12 }}>{t("noRewards")}</p>
            <Link href="/customer/enroll" style={{ display: "inline-block", marginTop: 12, background: "var(--c-green)", color: "#fff", borderRadius: 12, padding: "10px 20px", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}>
              {t("enrollCta")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
