'use client';

import { ChevronsUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useOrganizations } from '@/hooks/use-organizations';
import { useRouter } from '@/i18n/routing';

export function WorkspaceSwitcher() {
  const { activeOrganization, userMemberships, setActive, isLoaded } =
    useOrganizations();
  const router = useRouter();
  const t = useTranslations('layout.sidebar');
  const { isMobile } = useSidebar();

  if (!isLoaded) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="h-12">
            <div className="bg-muted size-8 animate-pulse rounded-lg" />
            <div className="bg-muted h-4 w-24 animate-pulse rounded" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const handleSwitch = async (orgId: string, slug: string) => {
    if (setActive) {
      await setActive({ organization: orgId });
      router.push(`/${slug}`);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarImage
                src={activeOrganization?.imageUrl}
                alt={activeOrganization?.name}
              />
              <AvatarFallback className="rounded-lg">
                {activeOrganization?.name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate font-semibold">
              {activeOrganization?.name}
            </span>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                {t('workspaces')}
              </DropdownMenuLabel>
              {userMemberships?.data?.map((membership) => (
                <DropdownMenuItem
                  key={membership.organization.id}
                  onClick={() =>
                    handleSwitch(
                      membership.organization.id,
                      membership.organization.slug ?? ''
                    )
                  }
                  className="gap-2 p-2"
                >
                  <Avatar className="size-6 rounded-sm">
                    <AvatarImage
                      src={membership.organization.imageUrl}
                      alt={membership.organization.name}
                    />
                    <AvatarFallback className="rounded-sm text-xs">
                      {membership.organization.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">
                    {membership.organization.name}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
