'use client';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { AdminHeader } from './admin-header';
import { AdminSidebar } from './admin-sidebar';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
