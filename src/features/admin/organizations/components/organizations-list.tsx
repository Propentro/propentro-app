'use client';

import {
  type ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Building2, PlusIcon, SearchIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { NoSearchResults } from '@/components/shared/no-search-results';
import { RelativeTime } from '@/components/shared/relative-time';
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
import { useRouter } from '@/i18n/routing';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import type {
  AdminOrganizationListItem,
  CreateOrganizationInput,
} from '../../types';
import {
  useAdminOrganizations,
  useCreateOrganization,
} from '../hooks/use-admin-organizations';
import { CreateOrganizationDialog } from './create-organization-dialog';

const columnHelper = createColumnHelper<AdminOrganizationListItem>();

export function OrganizationsList() {
  const t = useTranslations('admin.organizations');
  const tc = useTranslations('common');
  const router = useRouter();
  // ---------------------------------------------------------------------------
  // Filter state
  // ---------------------------------------------------------------------------
  const {
    search,
    status,
    page,
    pageSize,
    sortBy,
    sortDir,
    hasFilters,
    setSearch,
    setStatus,
    setPage,
    setPageSize,
    setSort,
    clearFilters,
  } = useListParams({ defaultPageSize: 25 });
  const debouncedSearch = useDebounce(search, 300);
  const [createOpen, setCreateOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // Queries & mutations
  // ---------------------------------------------------------------------------
  const { data, isPending } = useAdminOrganizations({
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
    page,
    pageSize,
    sortBy: sortBy || undefined,
    sortDir: (sortDir as 'asc' | 'desc') || undefined,
  });

  const createOrganization = useCreateOrganization();

  // ---------------------------------------------------------------------------
  // Create handler
  // ---------------------------------------------------------------------------
  function handleCreate(values: CreateOrganizationInput) {
    createOrganization.mutate(values, {
      onSuccess: () => {
        toast.success(t('createSuccess'));
        setCreateOpen(false);
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('createError')));
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Columns
  // ---------------------------------------------------------------------------
  const columns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cols: ColumnDef<AdminOrganizationListItem, any>[] = [
      columnHelper.accessor('name', {
        header: t('columnName'),
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue()}</span>
        ),
      }),
      columnHelper.accessor('slug', {
        header: t('columnSlug'),
        enableSorting: false,
        cell: ({ getValue }) => (
          <span className="text-muted-foreground font-mono text-xs">
            {getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('memberCount', {
        header: t('columnMembers'),
        cell: ({ getValue }) => getValue(),
      }),
      columnHelper.accessor('isActive', {
        header: t('columnStatus'),
        cell: ({ getValue }) => (
          <Badge variant={getValue() ? 'default' : 'outline'}>
            {getValue() ? t('statusActive') : t('statusInactive')}
          </Badge>
        ),
      }),
      columnHelper.accessor('createdAt', {
        header: t('columnCreated'),
        cell: ({ getValue }) => <RelativeTime date={getValue()} />,
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
    rowCount: data?.total ?? 0,
    manualSorting: true,
    state: {
      pagination: { pageIndex: page - 1, pageSize },
      sorting: sortBy ? [{ id: sortBy, desc: sortDir === 'desc' }] : [],
    },
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
    onSortingChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater(sortBy ? [{ id: sortBy, desc: sortDir === 'desc' }] : [])
          : updater;
      if (next.length > 0) {
        setSort(next[0].id, next[0].desc ? 'desc' : 'asc');
      } else {
        setSort('', '');
      }
    },
  });

  const isEmpty = !data?.items.length && !hasFilters;
  const noResults = !data?.items.length && hasFilters;

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

          <Button className="ml-auto" onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            {t('createOrganization')}
          </Button>
        </div>

        {/* Content */}
        {isPending ? (
          <div className="flex h-32 items-center justify-center">
            <div className="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-full">
              <Building2 className="text-muted-foreground size-6" />
            </div>
            <h3 className="text-lg font-medium">{t('emptyTitle')}</h3>
            <p className="text-muted-foreground mt-1 max-w-sm text-sm">
              {t('emptyDescription')}
            </p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              {t('createOrganization')}
            </Button>
          </div>
        ) : noResults ? (
          <NoSearchResults onClearFilters={clearFilters} />
        ) : (
          <>
            <DataTable
              table={table}
              onRowClick={(row) => {
                router.push(
                  `${paths.admin.organizations}/${row.original.organizationId}`
                );
              }}
            />
            <DataTablePagination table={table} />
          </>
        )}
      </div>

      {/* Create Organization Dialog */}
      <CreateOrganizationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isPending={createOrganization.isPending}
      />
    </div>
  );

}
