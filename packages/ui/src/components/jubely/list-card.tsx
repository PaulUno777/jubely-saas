import type { ReactNode } from "react";
import { cn } from "../../cn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

export type ListCardProps = {
  title?: ReactNode;
  description?: ReactNode;
  toolbar?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  flush?: boolean;
};

export function ListCard({
  title,
  description,
  toolbar,
  actions,
  children,
  className,
  contentClassName,
  flush = true,
}: ListCardProps) {
  const hasHeader = title || description || toolbar || actions;

  return (
    <Card data-slot="list-card" className={cn("overflow-hidden rounded-2xl shadow-sm", className)}>
      {hasHeader ? (
        <CardHeader className="flex flex-col gap-3 space-y-0 pb-3">
          {(title || description || actions) && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              {(title || description) && (
                <div className="min-w-0">
                  {title ? (
                    <CardTitle className="text-[14.5px] font-semibold tracking-tight">{title}</CardTitle>
                  ) : null}
                  {description ? (
                    <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>
                  ) : null}
                </div>
              )}
              {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
            </div>
          )}
          {toolbar ? <div className="flex flex-col gap-3">{toolbar}</div> : null}
        </CardHeader>
      ) : null}
      <CardContent className={cn(flush && "p-0 pt-0", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
