'use client';

import {
  type ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { RelativeTime } from '@/components/shared/relative-time';
import { DataTable } from '@/components/table/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import { useCancelInvite } from '../../invites/hooks/use-admin-invites';
import { type AdminInvite, inviteStatusVariant } from '../../types';
import { useAdminOrgInvites } from '../hooks/use-admin-org-invites';
import { CreateInviteDialog } from './create-invite-dialog';

const inviteColumnHelper = createColumnHelper<AdminInvite>();

interface OrganizationInvitesTableProps {
  organizationId: string;
}

export function OrganizationInvitesTable({
  organizationId,
}: OrganizationInvitesTableProps) {
  const t = useTranslations('admin.organizations');
  const { data: invites, isPending } = useAdminOrgInvites(organizationId);
  const cancelInvite = useCancelInvite();
  const [inviteOpen, setInviteOpen] = useState(false);

  function handleCancel(inviteId: string) {
    cancelInvite.mutate(inviteId, {
      onSuccess: () => {
        toast.success(t('cancelInviteSuccess'));
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('cancelInviteError')));
      },
    });
  }

  const columns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cols: ColumnDef<AdminInvite, any>[] = [
      inviteColumnHelper.accessor('email', {
        header: t('inviteColumnEmail'),
      }),
      inviteColumnHelper.accessor('roleName', {
        header: t('inviteColumnRole'),
        cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
      }),
      inviteColumnHelper.accessor('status', {
        header: t('inviteColumnStatus'),
        cell: ({ getValue }) => {
          const s = getValue();
          return <Badge variant={inviteStatusVariant(s)}>{s}</Badge>;
        },
      }),
      inviteColumnHelper.accessor('expiresAt', {
        header: t('inviteColumnExpires'),
        cell: ({ getValue }) => {
          const val = getValue();
          return val ? <RelativeTime date={val} /> : '-';
        },
      }),
      inviteColumnHelper.display({
        id: 'actions',
        cell: ({ row }) => {
          if (row.original.status !== 'pending') return null;
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCancel(row.original.inviteId)}
              disabled={cancelInvite.isPending}
            >
              {t('cancelInvite')}
            </Button>
          );
        },
      }),
    ];
    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const table = useReactTable({
    data: invites?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-muted-foreground text-sm font-medium">
          {t('invitesTabDescription')}
        </h3>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <PlusIcon />
          {t('inviteUser')}
        </Button>
      </div>

      {isPending ? (
        <Skeleton className="h-48 w-full" />
      ) : !invites?.items?.length ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          {t('noInvites')}
        </p>
      ) : (
        <DataTable table={table} />
      )}

      <CreateInviteDialog
        organizationId={organizationId}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />
    </div>
  );
}
