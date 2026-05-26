"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { customerSelectContext, pwaGetWallet } from "@/lib/customerApi";
import { IconStore, IconChevronRight, IconSearch } from "@/components/agent/icons";
import { IconPin } from "@/components/customer/icons";
import { useSession } from "@/hooks/useSession";
import { bootstrapAuthFromServer } from "@/lib/session";

function EnrolledStoreCard({
  name,
  tier,
  points,
  active,
  onSelect,
}: {
  name: string;
  tier: string;
  points: number;
  active?: boolean;
  onSelect?: () => void;
}) {
  const t = useTranslations("customer.stores");
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ width: "100%", textAlign: "left", background: "transparent", border: 0, padding: 0 }}
    >
      <div style={{ background: "var(--c-cream)", border: active ? "1px solid var(--c-green)" : "1px solid var(--c-line)", borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: "var(--c-card)", color: "var(--c-gold-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 700 }}>
          {name.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--c-ink)" }}>{name}</div>
          <div style={{ fontSize: 12, color: "var(--c-green)", marginTop: 2, fontWeight: 500 }}>
            {t("enrolled", { pts: String(points.toLocaleString("fr-FR")), tier })}
          </div>
        </div>
        <div style={{ fontSize: 12, color: active ? "var(--c-green)" : "var(--c-ink-mut)", fontWeight: 600 }}>
          {active ? "Active" : "Open"}
        </div>
      </div>
    </button>
  );
}

export default function StoresPage() {
  const t = useTranslations("customer.stores");
  const { session } = useSession();
  const { data } = useQuery({
    queryKey: ["pwa", "wallet", session?.activeEnrollmentId],
    enabled: Boolean(session?.activeEnrollmentId),
    queryFn: () => pwaGetWallet(),
  });
  const selectMut = useMutation({
    mutationFn: async (enrollmentId: string) => {
      await customerSelectContext(enrollmentId);
      await bootstrapAuthFromServer();
    },
  });

  return (
    <div style={{ paddingBottom: 8 }}>
      <div style={{ padding: "12px 20px 6px" }}>
        <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--c-ink-mut)", fontWeight: 600 }}>{t("title")}</div>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 2 }}>{t("title")}</div>
      </div>

      {/* Search */}
      <div style={{ padding: "6px 20px 10px" }}>
        <div style={{ background: "var(--c-cream-2)", borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <IconSearch size={18} color="var(--c-ink-mut)" />
          <input placeholder={t("searchPlaceholder")} style={{ border: 0, background: "transparent", outline: 0, fontFamily: "inherit", fontSize: 14, color: "var(--c-ink)", flex: 1 }} readOnly />
        </div>
      </div>

      <div style={{ padding: "4px 16px 16px" }}>
        {session?.customerEnrollments.length ? (
          <>
            <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--c-ink-mut)", fontWeight: 600, marginBottom: 8 }}>
              {t("myPrograms")}
            </div>
            {session.customerEnrollments.map((enrollment) => (
              <EnrolledStoreCard
                key={enrollment.enrollmentId}
                name={enrollment.tenantName || enrollment.tenantSlug}
                tier={enrollment.tier}
                points={enrollment.pointsBalance}
                active={session.activeEnrollmentId === enrollment.enrollmentId}
                onSelect={() => selectMut.mutate(enrollment.enrollmentId)}
              />
            ))}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "var(--c-cream-2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <IconStore size={28} color="var(--c-ink-mut)" />
            </div>
            <p style={{ fontSize: 13, color: "var(--c-ink-mut)" }}>{t("noStores")}</p>
            <Link href="/customer/enroll" style={{ display: "inline-block", marginTop: 12, background: "var(--c-green)", color: "#fff", borderRadius: 12, padding: "10px 20px", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}>
              {t("enrollCta")}
            </Link>
          </div>
        )}

        {/* Discover section */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--c-ink-mut)", fontWeight: 600, marginBottom: 8 }}>{t("nearby")}</div>
          <div style={{ background: "var(--c-cream-2)", borderRadius: 18, padding: "20px", textAlign: "center" }}>
            <IconPin size={24} color="var(--c-ink-mut)" />
            <p style={{ fontSize: 13, color: "var(--c-ink-mut)", marginTop: 8, lineHeight: 1.5 }}>{t("nearbyHint")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
