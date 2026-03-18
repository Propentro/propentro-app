'use client';

import {
  type ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { LoaderIcon, Mail, SearchIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

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
import { useDebounce } from '@/hooks/use-debounce';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import { useAdminInvites, useCancelInvite } from '../hooks/use-admin-invites';
import type { AdminInvite } from '../types/admin.types';
import { AdminFormattedDate } from './admin-formatted-date';

function inviteStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'outline';
    case 'accepted':
      return 'default';
    case 'canceled':
      return 'destructive';
    case 'expired':
      return 'secondary';
    default:
      return 'secondary';
  }
}

const columnHelper = createColumnHelper<AdminInvite>();

export function InvitesList() {
  const t = useTranslations('admin.invites');

  // ---------------------------------------------------------------------------
  // Filter state
  // ---------------------------------------------------------------------------
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [cancellingInvite, setCancellingInvite] = useState<AdminInvite | null>(
    null
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  // ---------------------------------------------------------------------------
  // Query & mutations
  // ---------------------------------------------------------------------------
  const { data, isPending } = useAdminInvites({
    search: debouncedSearch || undefined,
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
        cell: ({ getValue }) => (
          <Badge variant="secondary">{getValue()}</Badge>
        ),
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
          return val ? <AdminFormattedDate value={val} /> : '-';
        },
      }),
      columnHelper.accessor('createdAt', {
        header: t('columnCreated'),
        cell: ({ getValue }) => <AdminFormattedDate value={getValue()} />,
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
    state: { pagination: { pageIndex: page - 1, pageSize } },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex: page - 1, pageSize })
          : updater;
      setPage(next.pageIndex + 1);
      setPageSize(next.pageSize);
    },
  });

  const isEmpty = !data?.items.length && !debouncedSearch;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('title')}
        </h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

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

          {search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearch('')}
            >
              <XIcon />
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
            <Button
              variant="outline"
              onClick={() => setCancellingInvite(null)}
            >
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
