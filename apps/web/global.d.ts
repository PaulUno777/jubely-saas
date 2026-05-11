import type { Messages } from "@jubely/i18n";

declare module "next-intl" {
  interface AppConfig {
    Messages: Messages;
  }
}
