import { cn } from "../../cn";

type AuthCardProps = {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  className?: string;
};

export function AuthCard({ children, currentStep, totalSteps, className }: AuthCardProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-8 shadow-xl", className)}>
      {/* Progress bars */}
      <div className="flex gap-1.5 mb-7">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn("h-0.5 flex-1 rounded-full transition-colors duration-300", i < currentStep ? "bg-primary" : "bg-border")}
          />
        ))}
      </div>
      {children}
    </div>
  );
}
