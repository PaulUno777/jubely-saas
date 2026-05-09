import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const fontBody = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});
const fontDisplay = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: ["400"],
});
const fontMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Jubely",
  description: "Portail Jubely (root, store, agent, customer)",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body
        className={[
          fontBody.variable,
          fontDisplay.variable,
          fontMono.variable,
          "min-h-screen bg-background text-foreground antialiased font-sans",
        ].join(" ")}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

