'use client';

import { useTranslations } from 'next-intl';

import { PERMISSIONS } from '@/config/permissions';
import { paths } from '@/config/routes';
import { useMe } from '@/hooks/use-me';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import type { Permission } from '@/types/user.types';

const settingsItems = [
  {
    titleKey: 'settingsOrganization' as const,
    href: paths.settings.organization,
    permission: PERMISSIONS.settings.read,
  },
  {
    titleKey: 'settingsMembers' as const,
    href: paths.settings.members,
    permission: PERMISSIONS.members.read,
  },
  {
    titleKey: 'settingsRoles' as const,
    href: paths.settings.roles,
    permission: PERMISSIONS.roles.read,
  },
];

export function SettingsNav({ orgSlug }: { orgSlug: string }) {
  const t = useTranslations('pages');
  const pathname = usePathname();
  const { permissions } = useMe();

  const visibleItems = settingsItems.filter((item) =>
    permissions.includes(item.permission as Permission)
  );

  return (
    <nav className="flex gap-1 border-b">
      {visibleItems.map((item) => {
        const fullHref = `/${orgSlug}${item.href}`;
        const isActive = pathname.endsWith(item.href);

        return (
          <Link
            key={item.titleKey}
            href={fullHref}
            className={cn(
              'text-muted-foreground hover:text-foreground relative px-3 pt-1.5 pb-2.5 text-sm font-medium transition-colors',
              isActive &&
                'text-foreground after:bg-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5'
            )}
          >
            {t(item.titleKey)}
          </Link>
        );
      })}
    </nav>
  );
}
