'use client';

import { LayoutDashboard, Settings, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { ANY_SETTINGS_READ_PERMISSION } from '@/config/permissions';
import { paths } from '@/config/routes';
import { useMe } from '@/hooks/use-me';
import { Link, usePathname } from '@/i18n/routing';

import { SidebarNav } from './sidebar-nav';
import { WorkspaceSwitcher } from './workspace-switcher';

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const t = useTranslations('layout.sidebar');
  const { permissions, isSystemAdmin } = useMe();
  const pathname = usePathname();

  const showSettings = ANY_SETTINGS_READ_PERMISSION.some((p) =>
    permissions.includes(p)
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {/* Main navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarNav
                item={{
                  title: t('menu.dashboard'),
                  href: paths.home,
                  icon: LayoutDashboard,
                }}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spacer pushes settings to bottom */}
        <div className="flex-1" />

        {/* Settings at bottom */}
        {showSettings && (
          <SidebarGroup>
            <SidebarSeparator />
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarNav
                  item={{
                    title: t('menu.settings'),
                    href: paths.settings.root,
                    icon: Settings,
                  }}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Platform admin — system admins only */}
        {isSystemAdmin && (
          <SidebarGroup>
            {!showSettings && <SidebarSeparator />}
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href={paths.admin.root} />}
                    isActive={pathname.startsWith(paths.admin.root)}
                    tooltip={t('menu.admin')}
                  >
                    <ShieldCheck />
                    <span>{t('menu.admin')}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
