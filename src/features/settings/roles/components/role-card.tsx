'use client';

import { LockIcon, MoreHorizontalIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { OrgRoleItem } from '../types';

interface RoleCardProps {
  role: OrgRoleItem;
  canManage: boolean;
  onEdit: (role: OrgRoleItem) => void;
  onDelete: (role: OrgRoleItem) => void;
  onView: (role: OrgRoleItem) => void;
}

export function RoleCard({
  role,
  canManage,
  onEdit,
  onDelete,
  onView,
}: RoleCardProps) {
  const t = useTranslations('roles');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{role.name}</CardTitle>
            {role.isSystem && (
              <Badge variant="secondary">{t('systemRole')}</Badge>
            )}
          </div>

          {role.isSystem ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onView(role)}
              aria-label={t('viewPermissions')}
            >
              <LockIcon className="text-muted-foreground size-4" />
            </Button>
          ) : canManage ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <MoreHorizontalIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(role)}>
                  {t('editRole')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(role)}
                >
                  {t('deleteRole')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        {role.description && (
          <CardDescription>{role.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <div className="text-muted-foreground flex items-center gap-4 text-sm">
          <span>{t('memberCount', { count: role.memberCount })}</span>
          <span>
            {t('permissionCount', { count: role.permissionCodes.length })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
