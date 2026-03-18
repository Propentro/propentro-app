'use client';

import {
  Building2,
  LayoutDashboard,
  Settings2,
  Shield,
  UserCircle,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { paths } from '@/config/routes';
import { useHotkeys } from '@/hooks/use-hotkeys';
import { useMe } from '@/hooks/use-me';
import { usePathname, useRouter } from '@/i18n/routing';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const me = useMe();
  const t = useTranslations('layout.search');
  const tPages = useTranslations('pages');

  const orgSlug = pathname.split('/')[1];

  const navigate = useCallback(
    (href: string) => {
      const fullHref = `/${orgSlug}${href}`;
      router.push(fullHref);
      setOpen(false);
    },
    [orgSlug, router]
  );

  useHotkeys(
    'ctrl+k',
    useCallback(() => setOpen((o) => !o), [])
  );

  if (!me || !orgSlug) return null;

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={t('ariaLabel')}
      description={t('placeholder')}
    >
      <Command>
        <CommandInput placeholder={t('placeholder')} />
        <CommandList>
          <CommandEmpty>{t('noResults')}</CommandEmpty>
          <CommandGroup heading={t('navigation')}>
            <CommandItem onSelect={() => navigate(paths.home)}>
              <LayoutDashboard />
              {tPages('dashboard')}
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading={t('settings')}>
            <CommandItem onSelect={() => navigate(paths.settings.organization)}>
              <Building2 />
              {tPages('settingsOrganization')}
            </CommandItem>
            <CommandItem onSelect={() => navigate(paths.settings.members)}>
              <Users />
              {tPages('settingsMembers')}
            </CommandItem>
            <CommandItem onSelect={() => navigate(paths.settings.roles)}>
              <Shield />
              {tPages('settingsRoles')}
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading={t('account')}>
            <CommandItem onSelect={() => navigate(paths.account.profile)}>
              <UserCircle />
              {tPages('accountProfile')}
            </CommandItem>
            <CommandItem onSelect={() => navigate(paths.account.preferences)}>
              <Settings2 />
              {tPages('accountPreferences')}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
