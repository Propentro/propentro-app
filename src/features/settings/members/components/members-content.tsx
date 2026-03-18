'use client';

import {
  type ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { LoaderIcon, MoreHorizontalIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDebounce } from '@/hooks/use-debounce';
import { DATE_PRESETS } from '@/lib/format-date';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import { useRoles } from '../../roles/hooks/use-roles';
import {
  useDeactivateMember,
  useMembers,
  useReactivateMember,
} from '../hooks/use-members';
import type { OrgMember } from '../types';
import { EditMemberRolesSheet } from './edit-member-roles-sheet';
import { InviteMemberSheet } from './invite-member-sheet';
import { MembersEmptyState } from './members-empty-state';
import { MembersSkeleton } from './members-skeleton';
import { MembersToolbar } from './members-toolbar';
import { PendingInvitesSection } from './pending-invites-section';

const columnHelper = createColumnHelper<OrgMember>();

interface MembersContentProps {
  canManage: boolean;
}

export function MembersContent({ canManage }: MembersContentProps) {
  const t = useTranslations('members');
  const format = useFormatter();

  // ---------------------------------------------------------------------------
  // Filter state
  // ---------------------------------------------------------------------------
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState('all');
  const [roleId, setRoleId] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, roleId, pageSize]);

  // ---------------------------------------------------------------------------
  // Sheet / dialog state
  // ---------------------------------------------------------------------------
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editRolesOpen, setEditRolesOpen] = useState(false);
  const [editRolesMember, setEditRolesMember] = useState<OrgMember | null>(
    null
  );
  const [deactivatingMember, setDeactivatingMember] =
    useState<OrgMember | null>(null);

  // ---------------------------------------------------------------------------
  // Queries & mutations
  // ---------------------------------------------------------------------------
  const { data, isPending } = useMembers({
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
    roleId: roleId === 'all' ? undefined : roleId,
    page,
    pageSize,
  });
  const { data: roles } = useRoles();

  const deactivateMember = useDeactivateMember();
  const reactivateMember = useReactivateMember();

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  function handleEditRoles(member: OrgMember) {
    setEditRolesMember(member);
    setEditRolesOpen(true);
  }

  function handleDeactivate() {
    if (!deactivatingMember) return;
    deactivateMember.mutate(deactivatingMember.userId, {
      onSuccess: () => {
        toast.success(t('deactivateSuccess'));
        setDeactivatingMember(null);
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('deactivateError')));
      },
    });
  }

  function handleReactivate(member: OrgMember) {
    reactivateMember.mutate(member.userId, {
      onSuccess: () => {
        toast.success(t('reactivateSuccess'));
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('reactivateError')));
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Columns
  // ---------------------------------------------------------------------------
  const columns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cols: ColumnDef<OrgMember, any>[] = [
      columnHelper.accessor('firstName', {
        header: t('columnName'),
        cell: ({ row }) => {
          const { firstName, lastName, email } = row.original;
          const initials =
            `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
          return (
            <div className="flex items-center gap-3">
              <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {firstName} {lastName}
                </div>
                <div className="text-muted-foreground truncate text-xs">
                  {email}
                </div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('roles', {
        header: t('columnRole'),
        cell: ({ getValue }) => {
          const memberRoles = getValue();
          const visible = memberRoles.slice(0, 2);
          const remaining = memberRoles.length - 2;
          return (
            <div className="flex flex-wrap gap-1">
              {visible.map((role: OrgMember['roles'][number]) => (
                <Badge key={role.id} variant="secondary">
                  {role.name}
                </Badge>
              ))}
              {remaining > 0 && <Badge variant="outline">+{remaining}</Badge>}
            </div>
          );
        },
      }),
      columnHelper.accessor('joinedAt', {
        header: t('columnJoined'),
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <time dateTime={value}>
              {format.dateTime(new Date(value), DATE_PRESETS.medium)}
            </time>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: t('columnStatus'),
        cell: ({ getValue }) => {
          const memberStatus = getValue();
          return (
            <Badge
              variant={memberStatus === 'active' ? 'default' : 'destructive'}
            >
              {memberStatus === 'active'
                ? t('statusActive')
                : t('statusDeactivated')}
            </Badge>
          );
        },
      }),
    ];

    if (canManage) {
      cols.push(
        columnHelper.display({
          id: 'actions',
          cell: ({ row }) => {
            const member = row.original;
            return (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="icon-sm" />}
                >
                  <MoreHorizontalIcon className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditRoles(member)}>
                    {t('actionEditRoles')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {member.status === 'active' ? (
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeactivatingMember(member)}
                    >
                      {t('actionDeactivate')}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => handleReactivate(member)}>
                      {t('actionReactivate')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          },
        })
      );
    }

    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage, t]);

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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (isPending) {
    return <MembersSkeleton />;
  }

  const isEmpty =
    !data?.items.length &&
    !debouncedSearch &&
    status === 'all' &&
    roleId === 'all';

  return (
    <div className="space-y-4">
      <MembersToolbar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        roleId={roleId}
        onRoleIdChange={setRoleId}
        roles={roles ?? []}
        canManage={canManage}
        onInvite={() => setInviteOpen(true)}
      />

      {isEmpty ? (
        <MembersEmptyState
          canManage={canManage}
          onInvite={() => setInviteOpen(true)}
        />
      ) : (
        <>
          <DataTable table={table} />
          <DataTablePagination table={table} />
        </>
      )}

      {canManage && <PendingInvitesSection canManage={canManage} />}

      <InviteMemberSheet open={inviteOpen} onOpenChange={setInviteOpen} />

      <EditMemberRolesSheet
        member={editRolesMember}
        open={editRolesOpen}
        onOpenChange={setEditRolesOpen}
      />

      {/* Deactivation confirmation dialog */}
      <Dialog
        open={!!deactivatingMember}
        onOpenChange={(open) => {
          if (deactivateMember.isPending) return;
          if (!open) setDeactivatingMember(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deactivateTitle')}</DialogTitle>
            <DialogDescription>{t('deactivateDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeactivatingMember(null)}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={deactivateMember.isPending}
            >
              {deactivateMember.isPending && (
                <LoaderIcon className="animate-spin" />
              )}
              {t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
