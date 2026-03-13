'use client';

import { ChevronsUpDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useOrganizations } from '@/hooks/use-organizations';
import { useRouter } from '@/i18n/routing';

export function WorkspaceSwitcher() {
  const { activeOrganization, userMemberships, setActive, isLoaded } =
    useOrganizations();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <SidebarMenuButton className="h-12">
        <div className="bg-muted size-8 animate-pulse rounded" />
        <div className="bg-muted h-4 w-24 animate-pulse rounded" />
      </SidebarMenuButton>
    );
  }

  const handleSwitch = async (orgId: string, slug: string) => {
    if (setActive) {
      await setActive({ organization: orgId });
      router.push(`/${slug}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<SidebarMenuButton className="h-12" />}>
        <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded font-semibold">
          {activeOrganization?.name?.[0]?.toUpperCase() ?? 'P'}
        </div>
        <span className="truncate font-medium">
          {activeOrganization?.name ?? 'Propentro'}
        </span>
        <ChevronsUpDown className="ml-auto size-4 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {userMemberships?.data?.map((membership) => (
          <DropdownMenuItem
            key={membership.organization.id}
            onClick={() =>
              handleSwitch(
                membership.organization.id,
                membership.organization.slug ?? ''
              )
            }
          >
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded text-xs font-semibold">
              {membership.organization.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="truncate">{membership.organization.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
