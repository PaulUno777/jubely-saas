export type Locale = "en" | "fr";

export const locales = ["en", "fr"] as const satisfies readonly Locale[];

export const defaultLocale: Locale = "fr";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
