import { SidebarInset, SidebarProvider } from "@jubely/ui";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SubscriptionBanner } from "@/components/store/subscription-banner";
import { StorePortalProviders } from "@/components/store/store-portal-providers";

export default function StoreAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="merchant-portal-inset m-0 flex min-h-svh flex-col p-0">
        <StorePortalProviders>
          <div className="shrink-0 px-4 pt-3">
            <SubscriptionBanner />
          </div>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </StorePortalProviders>
      </SidebarInset>
    </SidebarProvider>
  );
}
