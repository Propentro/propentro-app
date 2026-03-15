'use client';

import type { LucideIcon } from 'lucide-react';

import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Link, usePathname } from '@/i18n/routing';

type AdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export function AdminSidebarNav({ item }: { item: AdminNavItem }) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  const isActive =
    item.href === '/admin'
      ? pathname === '/admin' || pathname === '/admin/'
      : pathname.startsWith(item.href);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={item.href} />}
        isActive={isActive}
        tooltip={item.title}
        onClick={() => {
          if (isMobile) setOpenMobile(false);
        }}
      >
        <item.icon />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
