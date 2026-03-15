'use client';

import { useTranslations } from 'next-intl';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { usePermissions } from '../hooks/use-roles';
import type { OrgRoleItem } from '../types';

interface ViewPermissionsSheetProps {
  role: OrgRoleItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewPermissionsSheet({
  role,
  open,
  onOpenChange,
}: ViewPermissionsSheetProps) {
  const t = useTranslations('roles');
  const { data: permissionGroups } = usePermissions();

  const rolePermissionCodes = role?.permissionCodes ?? [];

  const filteredGroups = permissionGroups
    ?.map((group) => ({
      ...group,
      permissions: group.permissions.filter((p) =>
        rolePermissionCodes.includes(p.code)
      ),
    }))
    .filter((group) => group.permissions.length > 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] overflow-y-auto sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle>{role?.name}</SheetTitle>
          <SheetDescription>{t('viewPermissionsDescription')}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          {filteredGroups?.map((group) => (
            <div key={group.group} className="space-y-2">
              <span className="text-sm font-medium capitalize">
                {group.group}
              </span>

              <div className="space-y-1 pl-1">
                {group.permissions.map((permission) => (
                  <div
                    key={permission.code}
                    className="bg-muted/40 flex flex-col gap-0.5 rounded-md px-3 py-2"
                  >
                    <span className="text-xs font-medium">
                      {permission.code}
                    </span>
                    {permission.description && (
                      <span className="text-muted-foreground text-xs">
                        {permission.description}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
