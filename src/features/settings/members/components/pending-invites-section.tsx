'use client';

import {
  type ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { LoaderIcon, MailIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { DataTable } from '@/components/table/data-table';
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
import { DATE_PRESETS } from '@/lib/format-date';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import { useCancelInvite, useOrgInvites } from '../hooks/use-invites';
import type { OrgInvite } from '../types';

const columnHelper = createColumnHelper<OrgInvite>();

interface PendingInvitesSectionProps {
  canManage: boolean;
}

export function PendingInvitesSection({
  canManage,
}: PendingInvitesSectionProps) {
  const t = useTranslations('members');
  const format = useFormatter();
  const { data, isPending } = useOrgInvites();
  const cancelInvite = useCancelInvite();
  const [cancellingInvite, setCancellingInvite] = useState<OrgInvite | null>(
    null
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleCancel() {
    if (!cancellingInvite) return;
    cancelInvite.mutate(cancellingInvite.inviteId, {
      onSuccess: () => {
        toast.success(t('cancelInviteSuccess'));
        setCancellingInvite(null);
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('cancelInviteError')));
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Columns
  // ---------------------------------------------------------------------------

  const columns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cols: ColumnDef<OrgInvite, any>[] = [
      columnHelper.accessor('email', {
        header: t('inviteColumnEmail'),
        cell: ({ getValue }) => (
          <div className="flex items-center gap-2">
            <MailIcon className="text-muted-foreground size-4" />
            <span>{getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor('roleName', {
        header: t('inviteColumnRole'),
        cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
      }),
      columnHelper.accessor('expiresAt', {
        header: t('inviteColumnExpires'),
        cell: ({ getValue }) => {
          const value = getValue();
          return value ? (
            <time dateTime={value}>
              {format.dateTime(new Date(value), DATE_PRESETS.medium)}
            </time>
          ) : (
            <span>—</span>
          );
        },
      }),
    ];

    if (canManage) {
      cols.push(
        columnHelper.display({
          id: 'actions',
          cell: ({ row }) => (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => setCancellingInvite(row.original)}
            >
              {t('cancelInviteAction')}
            </Button>
          ),
        })
      );
    }

    return cols;
  }, [canManage, t]);

  // ---------------------------------------------------------------------------
  // Table
  // ---------------------------------------------------------------------------

  const pendingInvites = useMemo(
    () => (data?.items ?? []).filter((inv) => inv.status === 'pending'),
    [data]
  );

  const table = useReactTable({
    data: pendingInvites,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isPending || pendingInvites.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('pendingInvitationsTitle')}</h3>

      <DataTable table={table} />

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
            <DialogTitle>{t('cancelInviteTitle')}</DialogTitle>
            <DialogDescription>
              {t('cancelInviteDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancellingInvite(null)}>
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelInvite.isPending}
            >
              {cancelInvite.isPending && (
                <LoaderIcon className="animate-spin" />
              )}
              {t('cancelInviteConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
