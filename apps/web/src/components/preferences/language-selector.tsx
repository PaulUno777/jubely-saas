"use client";

import { locales, type Locale } from "@jubely/i18n";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@jubely/ui";
import { Check, ChevronDown } from "lucide-react";
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

const localeCodes: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
};

const flagEmoji: Record<Locale, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
};

function LocaleFlag({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  return (
    <span className={cn("text-base leading-none", className)} aria-hidden>
      {flagEmoji[locale]}
    </span>
  );
}

export function LanguageSelector({
  profile,
  className,
}: LanguageSelectorProps) {
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
      <Select
        value={locale}
        onValueChange={(value) => setLocale(value as Locale)}
        disabled={isPending}
      >
        <SelectTrigger
          className={cn("h-9 w-[148px] bg-background/80", className)}
          aria-label={t("label")}
        >
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

  if (profile === "merchant") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            className={cn(
              "size-9 shrink-0 p-0 shadow-none",
              "sm:h-auto sm:min-h-10 sm:w-auto sm:gap-2.5 sm:px-3 sm:py-2",
              className,
            )}
            aria-label={`${t("label")}: ${t(localeLabels[locale])}`}
          >
            <LocaleFlag locale={locale} className="text-lg" />
            <span className="hidden min-w-0 flex-col items-start text-left leading-tight sm:flex">
              <span className="text-sm font-semibold text-foreground">
                {t(localeLabels[locale])}
              </span>
            </span>
            <ChevronDown className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
          <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t("menuTitle")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {locales.map((code) => (
            <DropdownMenuItem
              key={code}
              onClick={() => setLocale(code)}
              className={cn(
                "flex items-center gap-3 rounded-lg py-2.5",
                locale === code && "bg-accent",
              )}
            >
              <LocaleFlag locale={code} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium">
                  {t(localeLabels[code])}
                </span>
                <span className="text-xs text-muted-foreground">
                  {localeCodes[code]}
                </span>
              </span>
              {locale === code ? (
                <Check className="size-4 shrink-0 text-foreground" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
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
              active
                ? activeClass
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {code}
          </Button>
        );
      })}
    </div>
  );
}
