'use client';

import { PlusIcon, SearchIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OrgRoleItem } from '@/features/settings/roles/types';

interface MembersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  roleId: string;
  onRoleIdChange: (value: string) => void;
  roles: OrgRoleItem[];
  canManage: boolean;
  onInvite: () => void;
}

export function MembersToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  roleId,
  onRoleIdChange,
  roles,
  canManage,
  onInvite,
}: MembersToolbarProps) {
  const t = useTranslations('members');

  const hasFilters = status !== 'all' || roleId !== 'all';

  function clearFilters() {
    onStatusChange('all');
    onRoleIdChange('all');
    onSearchChange('');
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-56 pl-8"
        />
      </div>

      <Select
        value={status}
        onValueChange={(value) => onStatusChange(value ?? 'all')}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder={t('filterStatus')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filterStatus')}</SelectItem>
          <SelectItem value="active">{t('statusActive')}</SelectItem>
          <SelectItem value="deactivated">{t('statusDeactivated')}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={roleId}
        onValueChange={(value) => onRoleIdChange(value ?? 'all')}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder={t('filterRole')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filterRole')}</SelectItem>
          {roles.map((role) => (
            <SelectItem key={role.roleId} value={role.roleId}>
              {role.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <XIcon />
          {t('clear')}
        </Button>
      )}

      {canManage && (
        <Button className="ml-auto" onClick={onInvite}>
          <PlusIcon />
          {t('addMember')}
        </Button>
      )}
    </div>
  );
}
