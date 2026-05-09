"use client";

import { cn } from "../../cn";

type Step = {
  label: string;
  sublabel?: string;
};

type AuthStepNavProps = {
  steps: Step[];
  currentStep: number; // 0-indexed
  className?: string;
};

export function AuthStepNav({ steps, currentStep, className }: AuthStepNavProps) {
  return (
    <nav className={cn("flex items-center gap-1 rounded-2xl border border-border bg-card p-1.5", className)}>
      {steps.map((step, i) => {
        const isActive = i === currentStep;
        const isDone = i < currentStep;
        return (
          <div
            key={i}
            className={cn(
              "flex flex-1 flex-col items-center justify-center rounded-xl px-3 py-2 text-center transition-colors",
              isActive ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
          >
            <span className={cn("text-sm font-medium whitespace-nowrap", isDone && "opacity-60")}>
              {i + 1}. {step.label}
            </span>
            {step.sublabel && (
              <span className={cn("text-xs", isActive ? "text-muted-foreground" : "opacity-50")}>{step.sublabel}</span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
