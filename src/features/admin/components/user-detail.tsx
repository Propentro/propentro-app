'use client';

import {
  type ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { LoaderIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { DangerZone, DangerZoneItem } from '@/components/shared/danger-zone';
import { HardDeleteConfirmation } from '@/components/shared/hard-delete-confirmation';
import { DataTable } from '@/components/table/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import {
  useAdminUser,
  useDeactivateUser,
  useDeleteUser,
  useReactivateUser,
} from '../hooks/use-admin-users';
import type {
  MemberRoleInfo,
  UserOrganizationInfo,
} from '../types/admin.types';
import { AdminFormattedDate } from './admin-formatted-date';

const orgColumnHelper = createColumnHelper<UserOrganizationInfo>();

interface UserDetailProps {
  publicId: string;
}

export function UserDetail({ publicId }: UserDetailProps) {
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('common');
  const { data: user, isPending } = useAdminUser(publicId);
  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();
  const deleteUser = useDeleteUser();
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  function handleDeactivate() {
    deactivateUser.mutate(publicId, {
      onSuccess: () => {
        toast.success(t('deactivateSuccess'));
        setDeactivateOpen(false);
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('deactivateError')));
      },
    });
  }

  function handleReactivate() {
    reactivateUser.mutate(publicId, {
      onSuccess: () => {
        toast.success(t('reactivateSuccess'));
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('reactivateError')));
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Org memberships columns
  // ---------------------------------------------------------------------------
  const orgColumns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cols: ColumnDef<UserOrganizationInfo, any>[] = [
      orgColumnHelper.accessor('name', {
        header: t('columnOrgName'),
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue()}</span>
        ),
      }),
      orgColumnHelper.display({
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

  const orgTable = useReactTable({
    data: user?.organizations ?? [],
    columns: orgColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!user) return null;

  const displayName =
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('detailTitle')}
        </h1>
        {user.isActive ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeactivateOpen(true)}
          >
            {t('deactivate')}
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleReactivate}
            disabled={reactivateUser.isPending}
          >
            {reactivateUser.isPending && (
              <LoaderIcon className="animate-spin" />
            )}
            {t('reactivate')}
          </Button>
        )}
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">{t('sectionInfo')}</h2>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-sm">
                {t('labelEmail')}
              </dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">
                {t('labelFirstName')}
              </dt>
              <dd className="font-medium">{user.firstName ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">
                {t('labelLastName')}
              </dt>
              <dd className="font-medium">{user.lastName ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">
                {t('labelStatus')}
              </dt>
              <dd>
                <Badge variant={user.isActive ? 'default' : 'destructive'}>
                  {user.isActive ? t('statusActive') : t('statusInactive')}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">
                {t('labelCreated')}
              </dt>
              <dd>
                <AdminFormattedDate value={user.createdAt} />
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Organization Memberships */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">
            {t('sectionOrganizations')}
          </h2>
        </CardHeader>
        <CardContent>
          {user.organizations.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              {t('noOrganizations')}
            </p>
          ) : (
            <DataTable table={orgTable} />
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <DangerZone>
        <DangerZoneItem
          title={t('dangerZoneTitle')}
          description={t('dangerZoneDescription')}
          action={
            <HardDeleteConfirmation
              entityName={displayName}
              warningTitle={t('deleteWarningTitle')}
              warningDescription={t('deleteWarningDescription')}
              confirmTitle={t('deleteConfirmTitle')}
              confirmDescription={t('deleteConfirmDescription', {
                name: displayName,
              })}
              confirmButtonLabel={t('deleteButton')}
              onConfirm={() => {
                deleteUser.mutate(
                  { publicId: user.userId },
                  {
                    onSuccess: () => {
                      toast.success(t('deleteSuccess'));
                    },
                    onError: (error) =>
                      toast.error(
                        getErrorMessage(error, t('deleteError'))
                      ),
                  }
                );
              }}
              isPending={deleteUser.isPending}
              loadingLabel={tCommon('hardDelete.deleting')}
              trigger={
                <Button variant="destructive" size="sm">
                  {t('deleteUser')}
                </Button>
              }
            />
          }
        />
      </DangerZone>

      {/* Deactivate confirmation dialog */}
      <Dialog
        open={deactivateOpen}
        onOpenChange={(open) => {
          if (deactivateUser.isPending) return;
          if (!open) setDeactivateOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deactivateTitle')}</DialogTitle>
            <DialogDescription>
              {t('deactivateDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeactivateOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={deactivateUser.isPending}
            >
              {deactivateUser.isPending && (
                <LoaderIcon className="animate-spin" />
              )}
              {t('deactivate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
