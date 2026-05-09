import { SidebarInset, SidebarProvider } from "@jubely/ui";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function StoreAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}

