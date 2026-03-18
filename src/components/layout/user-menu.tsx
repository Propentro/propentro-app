'use client';

import { useClerk } from '@clerk/nextjs';
import { LogOut, UserCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { paths } from '@/config/routes';
import { useMe } from '@/hooks/use-me';
import { usePathname, useRouter } from '@/i18n/routing';

export function UserMenu() {
  const me = useMe();
  const { signOut } = useClerk();
  const t = useTranslations('layout.profile');
  const router = useRouter();
  const pathname = usePathname();

  const fullName = `${me.firstName} ${me.lastName}`;
  const initials = `${me.firstName[0]}${me.lastName[0]}`.toUpperCase();
  const orgSlug = pathname.split('/')[1];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="rounded-full" />}
      >
        <Avatar className="size-7">
          <AvatarImage src={me.imageUrl} alt={fullName} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 rounded-lg">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={me.imageUrl} alt={fullName} />
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{fullName}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {me.email}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push(`/${orgSlug}${paths.account.profile}`)}
          >
            <UserCircle />
            {t('account')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut />
          {t('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
