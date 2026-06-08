"use client";

import { Avatar, AvatarFallback, cn } from "@jubely/ui";

const kindClasses = ["ava-em", "ava-gd", "ava-tr", "ava-tl"] as const;

function hashKind(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return kindClasses[Math.abs(hash) % kindClasses.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

type InitialsAvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "size-7 text-[10px] rounded-lg",
  md: "size-9 text-[11px] rounded-[10px]",
  lg: "size-12 text-sm rounded-[10px]",
};

export function InitialsAvatar({ name, size = "md", className }: InitialsAvatarProps) {
  const kind = hashKind(name);

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback
        className={cn(
          "font-semibold",
          kind === "ava-em" && "bg-[var(--e0,#E8F7EE)] text-[var(--e4,#0A5038)]",
          kind === "ava-gd" && "bg-[var(--g0,#FBF0D4)] text-[var(--g4,#6B4510)]",
          kind === "ava-tr" && "bg-[var(--t0,#FBF0EB)] text-[var(--t3,#8A3D28)]",
          kind === "ava-tl" && "bg-[var(--tl0,#E8F4F4)] text-[var(--tl3,#0A5450)]",
        )}
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
