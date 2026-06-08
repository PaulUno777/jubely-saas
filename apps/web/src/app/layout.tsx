import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Mono, Manrope } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "./globals.css";
import { Providers } from "./providers";

const fontBody = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});
const fontDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["600"],
  style: ["italic"],
});
const fontMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["400", "500"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");

  return {
    title: t("title"),
    description: t("description"),
    manifest: "/favicon/site.webmanifest",
    icons: {
      icon: [
        { url: "/favicon/favicon.ico" },
        { url: "/favicon/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      ],
      apple: "/favicon/apple-touch-icon.png",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={[
          fontBody.variable,
          fontDisplay.variable,
          fontMono.variable,
          "min-h-screen bg-background text-foreground antialiased font-sans",
        ].join(" ")}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
