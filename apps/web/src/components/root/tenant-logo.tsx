"use client";

import { Avatar, AvatarFallback, AvatarImage, cn } from "@jubely/ui";
import { tenantInitials, tenantLogoUrl, type TenantLogoSource } from "@/lib/tenantLogo";

const sizeClasses = {
  xs: "h-8 w-8 text-[9px]",
  sm: "h-9 w-9 text-[10px]",
  md: "h-12 w-12 text-xs",
  lg: "h-20 w-20 text-lg",
  xl: "h-28 w-28 text-2xl",
} as const;

type TenantLogoProps = {
  tenant: TenantLogoSource & { name: string };
  size?: keyof typeof sizeClasses;
  className?: string;
};

export function TenantLogo({ tenant, size = "md", className }: TenantLogoProps) {
  const url = tenantLogoUrl(tenant);
  const initials = tenantInitials(tenant.name);

  return (
    <Avatar className={cn("shrink-0 rounded-xl border border-border bg-muted", sizeClasses[size], className)}>
      {url ? <AvatarImage src={url} alt="" className="object-cover" /> : null}
      <AvatarFallback className="rounded-xl bg-primary/10 font-semibold text-primary">{initials}</AvatarFallback>
    </Avatar>
  );
}
