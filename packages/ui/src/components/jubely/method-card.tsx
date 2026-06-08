"use client";

import { cn } from "../../cn";

type MethodCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected?: boolean;
  onClick?: () => void;
};

export function MethodCard({ icon, title, description, selected, onClick }: MethodCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border p-5 text-center transition-all cursor-pointer",
        selected
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-secondary/30 text-muted-foreground hover:border-border/60 hover:bg-secondary/50",
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          selected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </div>
      <div>
        <p className={cn("text-sm font-semibold", selected ? "text-foreground" : "text-foreground/80")}>{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </button>
  );
}
