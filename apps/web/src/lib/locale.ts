import { type Locale, isLocale } from "@jubely/i18n";

export const localeCookieName = "NEXT_LOCALE";

export function readLocaleCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${localeCookieName}=([^;]*)`));
  const value = match?.[1];
  return value && isLocale(value) ? value : null;
}

export function writeLocaleCookie(locale: Locale) {
  document.cookie = `${localeCookieName}=${locale};path=/;max-age=31536000;samesite=lax`;
}
