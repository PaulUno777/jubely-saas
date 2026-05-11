import { defaultLocale, getMessages, isLocale } from "@jubely/i18n";
import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

const localeCookieName = "NEXT_LOCALE";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  const locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return {
    locale,
    messages: getMessages(locale),
  };
});
