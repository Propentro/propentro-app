'use client';

import { useClerk } from '@clerk/nextjs';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

import { useAdminMe } from '../hooks/use-admin-me';

export function AdminUserMenu() {
  const { data: me, isPending } = useAdminMe();
  const { signOut } = useClerk();
  const t = useTranslations('layout.profile');

  if (isPending) {
    return <Skeleton className="size-7 rounded-full" />;
  }

  if (!me) return null;

  const displayName =
    [me.firstName, me.lastName].filter(Boolean).join(' ') || me.email;
  const initials = (me.firstName?.[0] ?? me.email[0]).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="rounded-full" />
        }
      >
        <Avatar className="size-7">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 rounded-lg">
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{displayName}</span>
              <span className="text-muted-foreground truncate text-xs">
                {me.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut />
          {t('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
