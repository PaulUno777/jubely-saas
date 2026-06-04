"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cn,
} from "@jubely/ui";

export type MerchantCardProps = React.ComponentProps<typeof Card>;

export const MerchantCard = React.forwardRef<HTMLDivElement, MerchantCardProps>(
  function MerchantCard({ className, ...props }, ref) {
    return (
      <Card
        ref={ref}
        className={cn(
          "portal-card rounded-2xl bg-card text-card-foreground shadow-sm",
          className,
        )}
        {...props}
      />
    );
  },
);

export {
  CardHeader as MerchantCardHeader,
  CardTitle as MerchantCardTitle,
  CardDescription as MerchantCardDescription,
  CardContent as MerchantCardContent,
  CardFooter as MerchantCardFooter,
};
