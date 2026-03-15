'use client';

import { Building2, LayoutDashboard, Mail, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
} from '@/components/ui/sidebar';

import { AdminSidebarNav } from './admin-sidebar-nav';

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
                  title: t('menu.organisations'),
                  href: '/admin/organisations',
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
      <SidebarRail />
    </Sidebar>
  );
}
