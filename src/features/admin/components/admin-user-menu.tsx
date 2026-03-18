'use client';

import { useClerk, useUser } from '@clerk/nextjs';
import {
  Building2,
  Check,
  Globe,
  LogOut,
  Monitor,
  Moon,
  Sun,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/routes';
import { useMounted } from '@/hooks/use-mounted';
import { routing, usePathname, useRouter } from '@/i18n/routing';

import { useAdminMe } from '../hooks/use-admin-me';

const ADMIN_ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
};

const THEME_OPTIONS = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
] as const;

export function AdminUserMenu() {
  const { data: me, isPending } = useAdminMe();
  const { signOut } = useClerk();
  const { user } = useUser();
  const tProfile = useTranslations('layout.profile');
  const tAdmin = useTranslations('admin.userMenu');
  const tTheme = useTranslations('account.preferences.theme');
  const tLang = useTranslations('language');
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (isPending) {
    return <Skeleton className="size-7 rounded-full" />;
  }

  if (!me) return null;

  const displayName =
    [me.firstName, me.lastName].filter(Boolean).join(' ') || me.email;
  const initials = (me.firstName?.[0] ?? me.email[0]).toUpperCase();
  const roleLabel = ADMIN_ROLE_LABELS[me.adminRole] ?? me.adminRole;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="rounded-full" />}
      >
        <Avatar className="size-7">
          <AvatarImage src={user?.imageUrl} alt={displayName} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 rounded-lg">
        {/* Section 1: User Info */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={user?.imageUrl} alt={displayName} className="rounded-lg" />
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
            <div className="px-1 pb-1.5">
              <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                {roleLabel}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        {/* Section 2: Workspace Navigation */}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push(paths.selectWorkspace)}>
            <Building2 />
            {tAdmin('selectWorkspace')}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {/* Section 3: Preferences */}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Globe className="size-4" />
              {tAdmin('language')}
              <span className="text-muted-foreground ml-auto text-xs">
                {tLang(locale as 'en')}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {routing.locales.map((loc) => (
                <DropdownMenuItem
                  key={loc}
                  onClick={() => router.replace(pathname, { locale: loc })}
                >
                  {tLang(loc as 'en')}
                  {loc === locale && <Check className="ml-auto size-3" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Monitor className="size-4" />
              {tAdmin('theme')}
              <span className="text-muted-foreground ml-auto text-xs">
                {mounted ? tTheme(theme as 'light' | 'dark' | 'system') : null}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {THEME_OPTIONS.map(({ value, icon: Icon }) => (
                <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
                  <Icon className="size-4" />
                  {tTheme(value)}
                  {mounted && theme === value && (
                    <Check className="ml-auto size-3" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        {/* Section 4: Sign Out */}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut />
          {tProfile('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
