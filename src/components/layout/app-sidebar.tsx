'use client';

import {
  Building2,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { paths } from '@/config/routes';

import { SidebarNav } from './sidebar-nav';
import { UserMenu } from './user-menu';
import { WorkspaceSwitcher } from './workspace-switcher';

export function AppSidebar() {
  const t = useTranslations('layout.sidebar');

  const overviewItems = [
    {
      title: t('menu.dashboard'),
      href: '/',
      icon: LayoutDashboard,
    },
  ];

  const settingsItems = [
    {
      title: t('menu.organization'),
      href: paths.settings.organization,
      icon: Building2,
      permission: 'org:settings:read' as const,
    },
    {
      title: t('menu.members'),
      href: paths.settings.members,
      icon: Users,
      permission: 'org:members:read' as const,
    },
    {
      title: t('menu.roles'),
      href: paths.settings.roles,
      icon: Shield,
      permission: 'org:roles:read' as const,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('labels.overview')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {overviewItems.map((item) => (
                <SidebarNav key={item.href} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Settings className="mr-2 size-4" />
            {t('labels.settings')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarNav key={item.href} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
