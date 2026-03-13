'use client';

import { useClerk } from '@clerk/nextjs';
import { LogOut, Moon, Sun, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useMe } from '@/hooks/use-me';

export function UserMenu() {
  const me = useMe();
  const { signOut, openUserProfile } = useClerk();
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('layout.profile');

  const initials = `${me.firstName?.[0] ?? ''}${me.lastName?.[0] ?? ''}`.toUpperCase() || 'U';

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger render={<SidebarMenuButton className="h-10" />}>
            <Avatar className="size-6">
              <AvatarImage src={me.imageUrl} alt={me.firstName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="truncate">
              {me.firstName} {me.lastName}
            </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56">
          <DropdownMenuItem onClick={() => openUserProfile()}>
            <User className="mr-2 size-4" />
            {t('accountSettings')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="mr-2 size-4" />
            ) : (
              <Moon className="mr-2 size-4" />
            )}
            {t('toggleTheme')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 size-4" />
            {t('signOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
