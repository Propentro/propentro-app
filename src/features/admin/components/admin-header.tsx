'use client';

import { useTranslations } from 'next-intl';
import * as React from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Link, usePathname } from '@/i18n/routing';

import { AdminUserMenu } from './admin-user-menu';

type AdminPageTranslationKey =
  | 'dashboard'
  | 'organizations'
  | 'users'
  | 'invites'
  | 'detail';

const ADMIN_SEGMENT_TO_KEY: Record<string, AdminPageTranslationKey> = {
  organizations: 'organizations',
  users: 'users',
  invites: 'invites',
};

export function AdminHeader() {
  const t = useTranslations('admin.pages');
  const pathname = usePathname();

  // pathname from next-intl: "/admin/organizations/org_abc123"
  const parts = pathname.split('/').filter(Boolean);
  // parts[0] = "admin", parts[1] = segment, parts[2] = publicId (detail)
  const segment = parts[1];
  const hasDetail = parts.length > 2;

  const segmentKey = segment ? ADMIN_SEGMENT_TO_KEY[segment] : undefined;

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {segmentKey && (
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/admin" />}>
                {t('dashboard')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {hasDetail ? (
                <BreadcrumbLink render={<Link href={`/admin/${segment}`} />}>
                  {t(segmentKey)}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{t(segmentKey)}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {hasDetail && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('detail')}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="flex-1" />
      <AdminUserMenu />
    </header>
  );
}
