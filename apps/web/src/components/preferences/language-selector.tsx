"use client";

import { locales, type Locale } from "@jubely/i18n";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@jubely/ui";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { writeLocaleCookie } from "@/lib/locale";
import type { AppProfile } from "@/lib/profile";

type LanguageSelectorProps = {
  profile: AppProfile;
  className?: string;
};

const localeLabels: Record<Locale, "fr" | "en"> = {
  fr: "fr",
  en: "en",
};

export function LanguageSelector({ profile, className }: LanguageSelectorProps) {
  const t = useTranslations("preferences.language");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setLocale(nextLocale: Locale) {
    if (nextLocale === locale) return;
    writeLocaleCookie(nextLocale);
    startTransition(() => {
      router.refresh();
    });
  }

  if (profile === "admin") {
    return (
      <Select value={locale} onValueChange={(value) => setLocale(value as Locale)} disabled={isPending}>
        <SelectTrigger className={cn("h-9 w-[148px] bg-background/80", className)} aria-label={t("label")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {locales.map((code) => (
            <SelectItem key={code} value={code}>
              {t(localeLabels[code])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const activeClass =
    profile === "customer"
      ? "bg-human-surface text-human-foreground shadow-sm border border-human/30"
      : "bg-background text-primary shadow-sm border border-border";

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-muted/70 p-1",
        className,
      )}
    >
      {locales.map((code) => {
        const active = locale === code;
        return (
          <Button
            key={code}
            type="button"
            size="sm"
            variant="ghost"
            disabled={isPending}
            aria-pressed={active}
            onClick={() => setLocale(code)}
            className={cn(
              "h-8 min-w-11 rounded-full px-3 text-xs font-semibold uppercase tracking-wide",
              active ? activeClass : "text-muted-foreground hover:text-foreground",
            )}
          >
            {code}
          </Button>
        );
      })}
    </div>
  );
}
