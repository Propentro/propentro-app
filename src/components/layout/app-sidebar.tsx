'use client';

import { LayoutDashboard, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
} from '@/components/ui/sidebar';
import { ANY_SETTINGS_READ_PERMISSION } from '@/config/permissions';
import { paths } from '@/config/routes';
import { useMe } from '@/hooks/use-me';

import { SidebarNav } from './sidebar-nav';
import { WorkspaceSwitcher } from './workspace-switcher';

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const t = useTranslations('layout.sidebar');
  const { permissions } = useMe();

  const overviewItems = [
    {
      title: t('menu.dashboard'),
      href: '/',
      icon: LayoutDashboard,
    },
  ];

  const showSettings = ANY_SETTINGS_READ_PERMISSION.some((p) =>
    permissions.includes(p)
  );

  return (
    <Sidebar collapsible="icon" {...props}>
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
        {showSettings && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('labels.settings')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarNav
                  item={{
                    title: t('menu.settings'),
                    href: paths.settings.organization,
                    icon: Settings,
                  }}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
