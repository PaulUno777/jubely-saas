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

  return (
    <header
      className={cn(
        "z-50 h-16 flex items-center gap-3 border-b border-border px-4 bg-background/80 backdrop-blur-sm",
        fixed && "sticky top-0 w-full",
        scrolled && fixed && "shadow-sm",
        className,
      )}
      {...props}
    >
      <SidebarTrigger variant="outline" />
      <Separator orientation="vertical" className="h-6" />
      {children}
      {profile === "admin" || profile === "agent" ? (
        <div className="ml-auto flex items-center gap-2">
          <LanguageSelector profile={profile} />
          <ThemeSelector profile={profile} />
        </div>
      ) : null}
    </header>
  );
}
