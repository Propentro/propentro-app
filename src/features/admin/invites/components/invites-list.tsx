'use client';

import {
  type ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { LoaderIcon, Mail, SearchIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { NoSearchResults } from '@/components/shared/no-search-results';
import { RelativeTime } from '@/components/shared/relative-time';
import { DataTable } from '@/components/table/data-table';
import { DataTablePagination } from '@/components/table/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { useListParams } from '@/hooks/use-list-params';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import { type AdminInvite, inviteStatusVariant } from '../../types';
import { useAdminInvites, useCancelInvite } from '../hooks/use-admin-invites';

const columnHelper = createColumnHelper<AdminInvite>();

export function InvitesList() {
  const t = useTranslations('admin.invites');
  const tc = useTranslations('common');
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
  const [cancellingInvite, setCancellingInvite] = useState<AdminInvite | null>(
    null
  );

  // ---------------------------------------------------------------------------
  // Query & mutations
  // ---------------------------------------------------------------------------
  const { data, isPending } = useAdminInvites({
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
    page,
    pageSize,
  });

  const cancelInvite = useCancelInvite();

  function handleCancel() {
    if (!cancellingInvite) return;
    cancelInvite.mutate(cancellingInvite.inviteId, {
      onSuccess: () => {
        toast.success(t('cancelSuccess'));
        setCancellingInvite(null);
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('cancelError')));
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Columns
  // ---------------------------------------------------------------------------
  const columns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cols: ColumnDef<AdminInvite, any>[] = [
      columnHelper.accessor('email', {
        header: t('columnEmail'),
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue()}</span>
        ),
      }),
      columnHelper.accessor('organizationName', {
        header: t('columnOrganization'),
      }),
      columnHelper.accessor('roleName', {
        header: t('columnRole'),
        cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
      }),
      columnHelper.accessor('status', {
        header: t('columnStatus'),
        cell: ({ getValue }) => {
          const s = getValue();
          return <Badge variant={inviteStatusVariant(s)}>{s}</Badge>;
        },
      }),
      columnHelper.accessor('invitedBy', {
        header: t('columnInvitedBy'),
        cell: ({ getValue }) => getValue() ?? '-',
      }),
      columnHelper.accessor('expiresAt', {
        header: t('columnExpires'),
        cell: ({ getValue }) => {
          const val = getValue();
          return val ? <RelativeTime date={val} /> : '-';
        },
      }),
      columnHelper.accessor('createdAt', {
        header: t('columnCreated'),
        cell: ({ getValue }) => <RelativeTime date={getValue()} />,
      }),
      columnHelper.display({
        id: 'actions',
        cell: ({ row }) => {
          if (row.original.status !== 'pending') return null;
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCancellingInvite(row.original)}
            >
              {t('cancel')}
            </Button>
          );
        },
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
                  : status === 'pending'
                    ? t('statusPending')
                    : status === 'accepted'
                      ? t('statusAccepted')
                      : t('statusCanceled')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatuses')}</SelectItem>
              <SelectItem value="pending">{t('statusPending')}</SelectItem>
              <SelectItem value="accepted">{t('statusAccepted')}</SelectItem>
              <SelectItem value="canceled">{t('statusCanceled')}</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
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
              <Mail className="text-muted-foreground size-6" />
            </div>
            <h3 className="text-lg font-medium">{t('emptyTitle')}</h3>
            <p className="text-muted-foreground mt-1 max-w-sm text-sm">
              {t('emptyDescription')}
            </p>
          </div>
        ) : noResults ? (
          <NoSearchResults onClearFilters={clearFilters} />
        ) : (
          <>
            <DataTable table={table} />
            <DataTablePagination table={table} />
          </>
        )}
      </div>

      {/* Cancel confirmation dialog */}
      <Dialog
        open={!!cancellingInvite}
        onOpenChange={(open) => {
          if (cancelInvite.isPending) return;
          if (!open) setCancellingInvite(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('cancelTitle')}</DialogTitle>
            <DialogDescription>{t('cancelDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancellingInvite(null)}>
              {t('keepInvite')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelInvite.isPending}
            >
              {cancelInvite.isPending && (
                <LoaderIcon className="animate-spin" />
              )}
              {t('confirmCancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
