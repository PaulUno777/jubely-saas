import { defaultLocale, locales } from "@jubely/i18n";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: "never",
});
