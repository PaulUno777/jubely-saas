"use client";

import { useSession } from "@/hooks/useSession";
import { MfaEnrollBanner } from "@/components/root/mfa-enroll-banner";

export default function StoreHome() {
  const { session } = useSession();
  const token = session?.accessToken;

  return (
    <div className="p-6 space-y-4">
      {token ? <MfaEnrollBanner accessToken={token} /> : null}
      <div>
        <h1 className="text-lg font-semibold">Store admin</h1>
        <p className="text-sm text-muted-foreground">Tableau de bord — à venir.</p>
      </div>
    </div>
  );
}
