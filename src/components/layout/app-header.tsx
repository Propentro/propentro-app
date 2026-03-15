'use client';

import { SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import { UserMenu } from '@/components/layout/user-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { paths } from '@/config/routes';
import { Link, usePathname } from '@/i18n/routing';

type PageTranslationKey =
  | 'settings'
  | 'settingsOrganization'
  | 'settingsMembers'
  | 'settingsRoles'
  | 'account'
  | 'accountProfile'
  | 'accountPreferences';

const SEGMENT_TO_TRANSLATION_KEY: Record<string, PageTranslationKey> = {
  settings: 'settings',
  organization: 'settingsOrganization',
  members: 'settingsMembers',
  roles: 'settingsRoles',
  account: 'account',
  profile: 'accountProfile',
  preferences: 'accountPreferences',
};

interface BreadcrumbSegment {
  label: PageTranslationKey;
  href: string;
  isLast: boolean;
}

function buildBreadcrumbSegments(
  orgSlug: string,
  pageSegments: string[]
): BreadcrumbSegment[] {
  const segments: BreadcrumbSegment[] = [];

  let accumulatedPath = '';
  for (let i = 0; i < pageSegments.length; i++) {
    const segment = pageSegments[i];
    const translationKey = SEGMENT_TO_TRANSLATION_KEY[segment];
    if (!translationKey) continue;

    accumulatedPath = `${accumulatedPath}/${segment}`;
    segments.push({
      label: translationKey,
      href: `/${orgSlug}${accumulatedPath}`,
      isLast: i === pageSegments.length - 1,
    });
  }

  return segments;
}

function HeaderBreadcrumb({
  orgSlug,
  pageSegments,
}: {
  orgSlug: string;
  pageSegments: string[];
}) {
  const tPages = useTranslations('pages');

  const segments = buildBreadcrumbSegments(orgSlug, pageSegments);

  if (segments.length === 0) return null;

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href={paths.home} />}>
            {tPages('dashboard')}
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment) => (
          <React.Fragment key={segment.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {segment.isLast ? (
                <BreadcrumbPage>{tPages(segment.label)}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href={segment.href} />}>
                  {tPages(segment.label)}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function AppHeader() {
  const t = useTranslations('layout.header');
  const pathname = usePathname();

  // pathname from next-intl's usePathname is locale-stripped, e.g. "/acme/settings/members"
  const parts = pathname.split('/').filter(Boolean);
  const orgSlug = parts[0] ?? '';
  const pageSegments = parts.slice(1);

  function handleSearchClick() {
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        metaKey: true,
        bubbles: true,
      })
    );
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <HeaderBreadcrumb orgSlug={orgSlug} pageSegments={pageSegments} />
      <div className="flex-1" />
      <Button
        variant="outline"
        size="sm"
        className="text-muted-foreground hidden sm:flex items-center gap-2 text-sm font-normal"
        onClick={handleSearchClick}
      >
        <SearchIcon className="size-4" />
        <span>{t('search')}</span>
        <kbd className="bg-muted pointer-events-none ml-1 hidden select-none items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-xs opacity-100 sm:flex">
          <span className="text-xs">⌘K</span>
        </kbd>
      </Button>
      <UserMenu />
    </header>
  );
}
