"use client";

import * as React from "react";
import { cn } from "../../cn";

type WizardStep = {
  label: string;
};

type WizardStepsProps = {
  steps: WizardStep[];
  currentStep: number; // 0-indexed
  className?: string;
};

export function WizardSteps({ steps, currentStep, className }: WizardStepsProps) {
  return (
    <nav className={cn("flex items-center gap-2", className)}>
      {steps.map((step, i) => {
        const isDone = i < currentStep;
        const isActive = i === currentStep;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                  isDone
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                      ? "border-primary bg-transparent text-primary"
                      : "border-border bg-transparent text-muted-foreground",
                )}
              >
                {i + 1}
              </div>
              <span
                className={cn(
                  "mt-1 text-[10px] font-medium",
                  isActive ? "text-primary" : isDone ? "text-muted-foreground" : "text-muted-foreground/50",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("flex-1 h-px mt-[-14px]", isDone ? "bg-primary" : "bg-border")} />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
