"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from "@jubely/ui";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import type { AppProfile } from "@/lib/profile";

type ThemeSelectorProps = {
  profile: AppProfile;
  className?: string;
};

type ThemeChoice = "light" | "dark" | "system";

export function ThemeSelector({ profile, className }: ThemeSelectorProps) {
  const t = useTranslations("preferences.theme");
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return <div className={cn("h-9 w-24 rounded-full bg-muted/60", className)} aria-hidden />;
  }

  const current = (theme ?? resolvedTheme ?? "light") as ThemeChoice;

  if (profile === "admin") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("h-9 gap-2 bg-background/80", className)}
            aria-label={t("label")}
          >
            {current === "dark" ? <Moon size={16} /> : current === "system" ? <Laptop size={16} /> : <Sun size={16} />}
            <span className="hidden sm:inline">
              {current === "dark" ? t("dark") : current === "system" ? t("system") : t("light")}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon className="mr-2 size-4" />
            {t("dark")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun className="mr-2 size-4" />
            {t("light")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const activeClass =
    profile === "customer"
      ? "bg-human-surface text-human-foreground shadow-sm border border-human/30"
      : "bg-background text-primary shadow-sm border border-border";

  const choices: Array<{ value: ThemeChoice; label: string }> =
    profile === "agent"
      ? [
          { value: "light", label: t("lightShort") },
          { value: "dark", label: t("darkShort") },
          { value: "system", label: t("system") },
        ]
      : [
          { value: "light", label: t("lightShort") },
          { value: "dark", label: t("darkShort") },
        ];

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-muted/70 p-1",
        className,
      )}
    >
      {choices.map((choice) => {
        const active = current === choice.value;
        return (
          <Button
            key={choice.value}
            type="button"
            size="sm"
            variant="ghost"
            aria-pressed={active}
            onClick={() => setTheme(choice.value)}
            className={cn(
              "h-8 rounded-full px-3 text-xs font-medium",
              active ? activeClass : "text-muted-foreground hover:text-foreground",
            )}
          >
            {choice.label}
          </Button>
        );
      })}
    </div>
  );
}
