'use client';

import type { LucideIcon } from 'lucide-react';
import { useParams } from 'next/navigation';

import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useHasPermission } from '@/hooks/use-me';
import { Link, usePathname } from '@/i18n/routing';
import type { Permission } from '@/types/user.types';

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
};

export function SidebarNav({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const hasPermission = useHasPermission(item.permission ?? ('org:settings:read' as Permission));

  if (item.permission && !hasPermission) {
    return null;
  }

  const fullHref = `/${orgSlug}${item.href === '/' ? '' : item.href}`;
  const isActive =
    item.href === '/'
      ? pathname === `/${orgSlug}` || pathname === `/${orgSlug}/`
      : pathname.startsWith(`/${orgSlug}${item.href}`);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton render={<Link href={fullHref} />} isActive={isActive}>
        <item.icon />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
