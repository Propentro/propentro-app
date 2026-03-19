'use client';

import {
  type ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { DataTable } from '@/components/table/data-table';
import { Badge } from '@/components/ui/badge';
import { paths } from '@/config/routes';
import { useRouter } from '@/i18n/routing';

import type { MemberRoleInfo, UserOrganizationInfo } from '../../types';

const columnHelper = createColumnHelper<UserOrganizationInfo>();

interface UserOrganizationsTableProps {
  organizations: UserOrganizationInfo[];
}

export function UserOrganizationsTable({
  organizations,
}: UserOrganizationsTableProps) {
  const t = useTranslations('admin.users');
  const router = useRouter();

  const columns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cols: ColumnDef<UserOrganizationInfo, any>[] = [
      columnHelper.accessor('name', {
        header: t('columnOrgName'),
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue()}</span>
        ),
      }),
      columnHelper.display({
        id: 'roles',
        header: t('columnRole'),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.roles.map((role: MemberRoleInfo) => (
              <Badge key={role.id} variant="secondary">
                {role.name}
              </Badge>
            ))}
          </div>
        ),
      }),
    ];
    return cols;
  }, [t]);

  const table = useReactTable({
    data: organizations,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (organizations.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {t('noOrganizations')}
      </p>
    );
  }

  return (
    <DataTable
      table={table}
      onRowClick={(row) => {
        router.push(
          `${paths.admin.organizations}/${row.original.organizationId}`
        );
      }}
    />
  );
}
