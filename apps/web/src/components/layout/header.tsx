"use client";

import { Separator, SidebarTrigger, cn } from "@jubely/ui";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageSelector } from "@/components/preferences/language-selector";
import { ThemeSelector } from "@/components/preferences/theme-selector";
import { detectProfile } from "@/lib/profile";

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean;
};

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const pathname = usePathname();
  const profile = detectProfile(pathname);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showPreferences = profile === "admin" || profile === "agent" || profile === "merchant";

  return (
    <header
      className={cn(
        "z-50 m-0 flex h-16 w-full items-center gap-3 border-b border-border bg-background px-4",
        fixed && "sticky top-0",
        scrolled && fixed && "shadow-sm",
        className,
      )}
      {...props}
    >
      <SidebarTrigger variant="outline" />
      <Separator orientation="vertical" className="h-6" />
      {children}
      {showPreferences ? (
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {profile ? <LanguageSelector profile={profile} /> : null}
          {profile && profile !== "merchant" ? <ThemeSelector profile={profile} /> : null}
        </div>
      ) : null}
    </header>
  );
}
