'use client';

import {
  type ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { SearchIcon, Users, XIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { DataTable } from '@/components/table/data-table';
import { DataTablePagination } from '@/components/table/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { paths } from '@/config/routes';
import { useDebounce } from '@/hooks/use-debounce';
import { useListParams } from '@/hooks/use-list-params';
import { Link } from '@/i18n/routing';
import { DATE_PRESETS } from '@/lib/format-date';

import type { AdminUserListItem } from '../../types';
import { useAdminUsers } from '../hooks/use-admin-users';

const columnHelper = createColumnHelper<AdminUserListItem>();

export function UsersList() {
  const t = useTranslations('admin.users');
  const tc = useTranslations('common');
  const format = useFormatter();

  // ---------------------------------------------------------------------------
  // Filter state
  // ---------------------------------------------------------------------------
  const {
    search,
    status,
    page,
    pageSize,
    hasFilters,
    setSearch,
    setStatus,
    setPage,
    setPageSize,
    clearFilters,
  } = useListParams({ defaultPageSize: 10 });
  const debouncedSearch = useDebounce(search, 300);

  // ---------------------------------------------------------------------------
  // Query
  // ---------------------------------------------------------------------------
  const { data, isPending } = useAdminUsers({
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
    page,
    pageSize,
  });

  // ---------------------------------------------------------------------------
  // Columns
  // ---------------------------------------------------------------------------
  const columns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cols: ColumnDef<AdminUserListItem, any>[] = [
      columnHelper.accessor('email', {
        header: t('columnEmail'),
        cell: ({ row }) => {
          const { email, userId } = row.original;
          return (
            <Link
              href={`${paths.admin.users}/${userId}`}
              className="font-medium hover:underline"
            >
              {email}
            </Link>
          );
        },
      }),
      columnHelper.accessor('firstName', {
        header: t('columnName'),
        cell: ({ row }) => {
          const { firstName, lastName } = row.original;
          return `${firstName ?? ''} ${lastName ?? ''}`.trim() || '-';
        },
      }),
      columnHelper.accessor('isActive', {
        header: t('columnStatus'),
        cell: ({ getValue }) => (
          <Badge variant={getValue() ? 'default' : 'destructive'}>
            {getValue() ? t('statusActive') : t('statusInactive')}
          </Badge>
        ),
      }),
      columnHelper.accessor('organizationCount', {
        header: t('columnOrgs'),
        cell: ({ getValue }) => getValue(),
      }),
      columnHelper.accessor('createdAt', {
        header: t('columnCreated'),
        cell: ({ getValue }) => (
          <time dateTime={getValue()}>
            {format.dateTime(new Date(getValue()), DATE_PRESETS.medium)}
          </time>
        ),
      }),
    ];
    return cols;
  }, [t]);

  // ---------------------------------------------------------------------------
  // Table
  // ---------------------------------------------------------------------------
  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.totalPages ?? -1,
    state: { pagination: { pageIndex: page - 1, pageSize } },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex: page - 1, pageSize })
          : updater;
      if (next.pageSize !== pageSize) {
        setPageSize(next.pageSize);
      } else {
        setPage(next.pageIndex + 1);
      }
    },
  });
  const isEmpty = !data?.items.length && !debouncedSearch && status === 'all';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 pl-8"
            />
          </div>

          <Select
            value={status}
            onValueChange={(value) => setStatus(value ?? 'all')}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder={t('filterStatus')}>
                {status === 'all'
                  ? t('allStatuses')
                  : status === 'active'
                    ? t('statusActive')
                    : t('statusInactive')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatuses')}</SelectItem>
              <SelectItem value="active">{t('statusActive')}</SelectItem>
              <SelectItem value="inactive">{t('statusInactive')}</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              <XIcon />
              {tc('table.clearFilters')}
            </Button>
          )}
        </div>

        {/* Content */}
        {isPending ? (
          <div className="flex h-32 items-center justify-center">
            <div className="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-full">
              <Users className="text-muted-foreground size-6" />
            </div>
            <h3 className="text-lg font-medium">{t('emptyTitle')}</h3>
            <p className="text-muted-foreground mt-1 max-w-sm text-sm">
              {t('emptyDescription')}
            </p>
          </div>
        ) : (
          <>
            <DataTable table={table} />
            <DataTablePagination table={table} />
          </>
        )}
      </div>
    </div>
  );
}
