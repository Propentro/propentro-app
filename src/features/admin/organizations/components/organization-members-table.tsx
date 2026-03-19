'use client';

import {
  type ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { LoaderIcon, MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { RelativeTime } from '@/components/shared/relative-time';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/routes';
import { Link } from '@/i18n/routing';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import type { AdminMember, MemberRoleInfo } from '../../types';
import {
  useAdminDeactivateMember,
  useAdminReactivateMember,
  useRemoveMember,
} from '../hooks/use-admin-members';
import { useAdminOrgMembers } from '../hooks/use-admin-organizations';

const memberColumnHelper = createColumnHelper<AdminMember>();

interface OrganizationMembersTableProps {
  organizationId: string;
}

export function OrganizationMembersTable({
  organizationId,
}: OrganizationMembersTableProps) {
  const t = useTranslations('admin.organizations');
  const tCommon = useTranslations('common');
  const { data: members, isPending } = useAdminOrgMembers(organizationId);
  const removeMember = useRemoveMember(organizationId);
  const deactivateMember = useAdminDeactivateMember(organizationId);
  const reactivateMember = useAdminReactivateMember(organizationId);
  const [removingMember, setRemovingMember] = useState<AdminMember | null>(
    null
  );
  const [deactivatingMember, setDeactivatingMember] =
    useState<AdminMember | null>(null);
  const [reactivatingMember, setReactivatingMember] =
    useState<AdminMember | null>(null);

  function handleRemove() {
    if (!removingMember) return;
    removeMember.mutate(removingMember.userId, {
      onSuccess: () => {
        toast.success(t('removeMemberSuccess'));
        setRemovingMember(null);
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('removeMemberError')));
      },
    });
  }

  function handleDeactivateMember() {
    if (!deactivatingMember) return;
    deactivateMember.mutate(deactivatingMember.userId, {
      onSuccess: () => {
        toast.success(t('deactivateMemberSuccess'));
        setDeactivatingMember(null);
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('deactivateMemberError')));
      },
    });
  }

  function handleReactivateMember() {
    if (!reactivatingMember) return;
    reactivateMember.mutate(reactivatingMember.userId, {
      onSuccess: () => {
        toast.success(t('reactivateMemberSuccess'));
        setReactivatingMember(null);
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('reactivateMemberError')));
      },
    });
  }

  const columns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cols: ColumnDef<AdminMember, any>[] = [
      memberColumnHelper.accessor('firstName', {
        header: t('memberColumnName'),
        cell: ({ row }) => {
          const { firstName, lastName, userId } = row.original;
          const displayName =
            `${firstName ?? ''} ${lastName ?? ''}`.trim() || '-';
          return (
            <Link
              href={`${paths.admin.users}/${userId}`}
              className="font-medium hover:underline"
            >
              {displayName}
            </Link>
          );
        },
      }),
      memberColumnHelper.accessor('email', {
        header: t('memberColumnEmail'),
      }),
      memberColumnHelper.display({
        id: 'roles',
        header: t('memberColumnRole'),
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
      memberColumnHelper.accessor('status', {
        header: t('memberColumnStatus'),
        cell: ({ getValue }) => (
          <Badge variant={getValue() === 'active' ? 'default' : 'secondary'}>
            {getValue() === 'active' ? t('statusActive') : t('statusDeactivated')}
          </Badge>
        ),
      }),
      memberColumnHelper.accessor('joinedAt', {
        header: t('memberColumnJoined'),
        cell: ({ getValue }) => <RelativeTime date={getValue()} />,
      }),
      memberColumnHelper.display({
        id: 'actions',
        header: t('memberActions'),
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                render={
                  <Link href={`${paths.admin.users}/${row.original.userId}`} />
                }
              >
                {t('viewUser')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {row.original.status === 'active' ? (
                <DropdownMenuItem
                  onClick={() => setDeactivatingMember(row.original)}
                >
                  {t('deactivateMember')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => setReactivatingMember(row.original)}
                >
                  {t('reactivateMember')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setRemovingMember(row.original)}
              >
                {t('removeMember')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ];
    return cols;
  }, [t]);

  const table = useReactTable({
    data: members?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isPending) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!members?.items?.length) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {t('noMembers')}
      </p>
    );
  }

  return (
    <>
      <DataTable table={table} />

      {/* Remove member dialog */}
      <Dialog
        open={!!removingMember}
        onOpenChange={(open) => {
          if (removeMember.isPending) return;
          if (!open) setRemovingMember(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('removeMemberTitle')}</DialogTitle>
            <DialogDescription>
              {t('removeMemberDescription', {
                name:
                  `${removingMember?.firstName ?? ''} ${removingMember?.lastName ?? ''}`.trim() ||
                  removingMember!.email,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemovingMember(null)}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={removeMember.isPending}
            >
              {removeMember.isPending && (
                <LoaderIcon className="animate-spin" />
              )}
              {t('removeMember')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate member dialog */}
      <Dialog
        open={!!deactivatingMember}
        onOpenChange={(open) => {
          if (deactivateMember.isPending) return;
          if (!open) setDeactivatingMember(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deactivateMemberTitle')}</DialogTitle>
            <DialogDescription>
              {t('deactivateMemberDescription', {
                name:
                  `${deactivatingMember?.firstName ?? ''} ${deactivatingMember?.lastName ?? ''}`.trim() ||
                  deactivatingMember!.email,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeactivatingMember(null)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivateMember}
              disabled={deactivateMember.isPending}
            >
              {deactivateMember.isPending && (
                <LoaderIcon className="animate-spin" />
              )}
              {t('deactivateMember')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate member dialog */}
      <Dialog
        open={!!reactivatingMember}
        onOpenChange={(open) => {
          if (reactivateMember.isPending) return;
          if (!open) setReactivatingMember(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('reactivateMemberTitle')}</DialogTitle>
            <DialogDescription>
              {t('reactivateMemberDescription', {
                name:
                  `${reactivatingMember?.firstName ?? ''} ${reactivatingMember?.lastName ?? ''}`.trim() ||
                  reactivatingMember!.email,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReactivatingMember(null)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleReactivateMember}
              disabled={reactivateMember.isPending}
            >
              {reactivateMember.isPending && (
                <LoaderIcon className="animate-spin" />
              )}
              {t('reactivateMember')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
