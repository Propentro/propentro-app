'use client';

import { useTranslations } from 'next-intl';

import { paths } from '@/config/routes';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';

const accountItems = [
  {
    titleKey: 'accountProfile' as const,
    href: paths.account.profile,
  },
  {
    titleKey: 'accountPreferences' as const,
    href: paths.account.preferences,
  },
];

export function AccountNav({ orgSlug }: { orgSlug: string }) {
  const t = useTranslations('pages');
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b">
      {accountItems.map((item) => {
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
