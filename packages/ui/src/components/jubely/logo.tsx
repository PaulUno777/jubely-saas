import { Star } from "lucide-react";
import { cn } from "../../cn";

type JubelyLogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  iconOnly?: boolean;
};

const sizeMap = {
  sm: { icon: 28, text: "text-lg", iconSize: 14 },
  md: { icon: 36, text: "text-2xl", iconSize: 18 },
  lg: { icon: 48, text: "text-3xl", iconSize: 24 },
};

export function JubelyLogo({ className, size = "md", iconOnly = false }: JubelyLogoProps) {
  const s = sizeMap[size];
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className="flex items-center justify-center rounded-xl bg-[#1e3a2f] shrink-0"
        style={{ width: s.icon, height: s.icon }}
      >
        <Star className="fill-[#f4a228] text-[#f4a228]" style={{ width: s.iconSize, height: s.iconSize }} />
      </div>
      {!iconOnly && (
        <span className={cn("font-medium tracking-tight", s.text)}>
          <span className="font-semibold" style={{ fontFamily: "var(--jubely-font-body)" }}>Jubi</span>
          <span
            className="italic"
            style={{ fontFamily: "var(--jubely-font-display)", fontWeight: 400 }}
          >
            lee
          </span>
        </span>
      )}
    </div>
  );
}
