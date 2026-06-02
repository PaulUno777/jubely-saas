import { SidebarInset, SidebarProvider } from "@jubely/ui";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { StoreSwitcher } from "@/components/store/store-switcher";
import { SubscriptionBanner } from "@/components/store/subscription-banner";

export default function StoreAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-wrap items-center justify-end gap-4 border-b px-4 py-2">
          <StoreSwitcher />
        </div>
        <div className="px-4 pt-4">
          <SubscriptionBanner />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

