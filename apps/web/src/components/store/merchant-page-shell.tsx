"use client";

import type { ReactNode } from "react";
import { Main } from "@/components/layout/main";
import { StorePageHeader } from "@/components/store/store-page-header";

type MerchantPageShellProps = {
  title: string;
  context?: string;
  filters?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function MerchantPageShell({
  title,
  context,
  filters,
  children,
  className,
}: MerchantPageShellProps) {
  return (
    <>
      <StorePageHeader title={title} context={context} />
      <Main className={className}>
        {filters ? <div className="mb-4">{filters}</div> : null}
        {children}
      </Main>
    </>
  );
}
