import type { Locale } from "./types";
import enAgent from "./locales/en/agent";
import enApp from "./locales/en/app";
import enAuth from "./locales/en/auth";
import enCommon from "./locales/en/common";
import enCustomer from "./locales/en/customer";
import enErrors from "./locales/en/errors";
import enPreferences from "./locales/en/preferences";
import enStaff from "./locales/en/staff";
import enStore from "./locales/en/store";
import frAgent from "./locales/fr/agent";
import frApp from "./locales/fr/app";
import frAuth from "./locales/fr/auth";
import frCommon from "./locales/fr/common";
import frCustomer from "./locales/fr/customer";
import frErrors from "./locales/fr/errors";
import frPreferences from "./locales/fr/preferences";
import frStaff from "./locales/fr/staff";
import frStore from "./locales/fr/store";

const catalogs = {
  en: {
    agent: enAgent,
    app: enApp,
    auth: enAuth,
    common: enCommon,
    customer: enCustomer,
    errors: enErrors,
    preferences: enPreferences,
    staff: enStaff,
    store: enStore,
  },
  fr: {
    agent: frAgent,
    app: frApp,
    auth: frAuth,
    common: frCommon,
    customer: frCustomer,
    errors: frErrors,
    preferences: frPreferences,
    staff: frStaff,
    store: frStore,
  },
} as const;

export type Messages = (typeof catalogs)[Locale];

export function getMessages(locale: Locale): Messages {
  return catalogs[locale];
}
