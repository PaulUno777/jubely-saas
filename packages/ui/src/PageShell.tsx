import type { ReactNode } from "react";
import { cn } from "./cn";

type PageShellProps = {
  children: ReactNode;
  wide?: boolean;
};

export function PageShell({ children, wide }: PageShellProps) {
  return (
    <div className="min-h-svh bg-background font-sans text-foreground antialiased">
      <div className={cn("mx-auto px-5 py-10", wide ? "max-w-3xl" : "max-w-xl")}>{children}</div>
    </div>
  );
}
