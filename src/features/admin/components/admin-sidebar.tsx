'use client';

import { Building2, LayoutDashboard, Mail, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

import { useAdminMe } from '../hooks/use-admin-me';
import { AdminSidebarNav } from './admin-sidebar-nav';

function AdminProfile() {
  const t = useTranslations('admin.me');
  const { data: me, isPending } = useAdminMe();

  if (isPending) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1 group-data-[collapsible=icon]:hidden">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  if (!me) return null;

  const displayName =
    [me.firstName, me.lastName].filter(Boolean).join(' ') || me.email;

  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <div className="bg-muted flex size-8 items-center justify-center rounded-full text-xs font-medium">
        {(me.firstName?.[0] ?? me.email[0]).toUpperCase()}
      </div>
      <div className="min-w-0 group-data-[collapsible=icon]:hidden">
        <p className="truncate text-sm font-medium">{displayName}</p>
        <p className="text-muted-foreground truncate text-xs">
          {t('role', { role: me.adminRole })}
        </p>
      </div>
    </div>
  );
}

export function AdminSidebar(props: ComponentProps<typeof Sidebar>) {
  const t = useTranslations('admin.sidebar');

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded font-semibold text-sm">
            PA
          </div>
          <span className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
            {t('title')}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <AdminSidebarNav
                item={{
                  title: t('menu.dashboard'),
                  href: '/admin',
                  icon: LayoutDashboard,
                }}
              />
              <AdminSidebarNav
                item={{
                  title: t('menu.organizations'),
                  href: '/admin/organizations',
                  icon: Building2,
                }}
              />
              <AdminSidebarNav
                item={{
                  title: t('menu.users'),
                  href: '/admin/users',
                  icon: Users,
                }}
              />
              <AdminSidebarNav
                item={{
                  title: t('menu.invites'),
                  href: '/admin/invites',
                  icon: Mail,
                }}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <AdminProfile />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
