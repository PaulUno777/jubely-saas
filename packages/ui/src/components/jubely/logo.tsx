import { cn } from "../../cn";

type JubelyLogoProps = {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  iconOnly?: boolean;
  logoSrc?: string;
};

const sizeMap = {
  xs: { icon: 24, text: "text-base" },
  sm: { icon: 28, text: "text-lg" },
  md: { icon: 36, text: "text-2xl" },
  lg: { icon: 48, text: "text-3xl" },
};

export function JubelyLogo({
  className,
  size = "md",
  iconOnly = false,
  logoSrc = "/jubelee_logo.png",
}: JubelyLogoProps) {
  const s = sizeMap[size];

  return (
    <div className={cn("flex items-center", className)} aria-label={iconOnly ? undefined : "Jubelee"}>
      <img
        src={logoSrc}
        alt={iconOnly ? "Jubelee" : ""}
        width={s.icon}
        height={s.icon}
        className="block shrink-0 rounded-xl object-contain"
      />
      {!iconOnly ? (
        <span className={cn("-ms-1.5 font-medium leading-none tracking-tight text-inherit", s.text)}>
          <span className="font-semibold" style={{ fontFamily: "var(--jubely-font-body)" }}>
            Jubel
          </span>
          <span
            className="italic"
            style={{ fontFamily: "var(--jubely-font-display)", fontWeight: 400 }}
          >
            ee
          </span>
        </span>
      ) : null}
    </div>
  );
}
