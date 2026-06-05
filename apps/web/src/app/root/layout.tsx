import { SidebarInset, SidebarProvider } from "@jubely/ui";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function RootAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="admin-portal-inset m-0 p-0">{children}</SidebarInset>
    </SidebarProvider>
  );
}

