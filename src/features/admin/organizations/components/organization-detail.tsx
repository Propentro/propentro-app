'use client';

import {
  type ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { LoaderIcon, MoreHorizontal } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CurrencyPicker } from '@/components/shared/currency-picker';
import { DangerZone, DangerZoneItem } from '@/components/shared/danger-zone';
import { FormField } from '@/components/shared/form-field';
import { HardDeleteConfirmation } from '@/components/shared/hard-delete-confirmation';
import { TimezonePicker } from '@/components/shared/timezone-picker';
import { DataTable } from '@/components/table/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Form } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { paths } from '@/config/routes';
import { Link } from '@/i18n/routing';
import { DATE_PRESETS } from '@/lib/format-date';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import { useCancelInvite } from '../../invites/hooks/use-admin-invites';
import {
  inviteStatusVariant,
  type AdminInvite,
  type AdminMember,
  type MemberRoleInfo,
  type UpdateOrganizationInput,
} from '../../types';
import {
  useAdminDeactivateMember,
  useAdminReactivateMember,
  useRemoveMember,
} from '../hooks/use-admin-members';
import { useAdminOrgInvites } from '../hooks/use-admin-org-invites';
import {
  useAdminOrganization,
  useAdminOrgMembers,
  useDeactivateOrganization,
  useDeleteOrganization,
  useReactivateOrganization,
  useUpdateOrganization,
} from '../hooks/use-admin-organizations';
import { updateOrganizationSchema } from '../validators/update-organization.schema';

const memberColumnHelper = createColumnHelper<AdminMember>();
const inviteColumnHelper = createColumnHelper<AdminInvite>();

interface OrganizationDetailProps {
  organizationId: string;
}

export function OrganizationDetail({ organizationId }: OrganizationDetailProps) {
  const t = useTranslations('admin.organizations');
  const tCommon = useTranslations('common');
  const { data: org, isPending } = useAdminOrganization(organizationId);
  const updateOrg = useUpdateOrganization(organizationId);
  const deactivateOrg = useDeactivateOrganization();
  const reactivateOrg = useReactivateOrganization();
  const deleteOrg = useDeleteOrganization();
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  function handleUpdate(values: Record<string, unknown>) {
    updateOrg.mutate(values as unknown as UpdateOrganizationInput, {
      onSuccess: () => {
        toast.success(t('updateSuccess'));
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('updateError')));
      },
    });
  }

  function handleDeactivate() {
    deactivateOrg.mutate(organizationId, {
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
    reactivateOrg.mutate(organizationId, {
      onSuccess: () => {
        toast.success(t('reactivateSuccess'));
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('reactivateError')));
      },
    });
  }

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!org) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1>
          <p className="text-muted-foreground font-mono text-sm">{org.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={org.isActive ? 'default' : 'destructive'}>
            {org.isActive ? t('statusActive') : t('statusInactive')}
          </Badge>
          {org.isActive ? (
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
              disabled={reactivateOrg.isPending}
            >
              {reactivateOrg.isPending && (
                <LoaderIcon className="animate-spin" />
              )}
              {t('reactivate')}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">{t('tabInfo')}</TabsTrigger>
          <TabsTrigger value="members">{t('tabMembers')}</TabsTrigger>
          <TabsTrigger value="invites">{t('tabInvites')}</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <Form<UpdateOrganizationInput>
                validationSchema={updateOrganizationSchema}
                onSubmit={
                  handleUpdate as (values: UpdateOrganizationInput) => void
                }
                resetValues={{
                  name: org.name,
                  contactName: org.contactName ?? '',
                  contactEmail: org.contactEmail ?? '',
                  contactPhone: org.contactPhone ?? '',
                  currencyCode: org.currencyCode,
                  timezone: org.timezone,
                }}
                className="space-y-4"
              >
                {(methods) => (
                  <>
                    <FormField<UpdateOrganizationInput>
                      label={t('labelName')}
                      name="name"
                      placeholder={t('placeholderName')}
                      methods={methods}
                    />
                    <FormField<UpdateOrganizationInput>
                      label={t('labelContactName')}
                      name="contactName"
                      placeholder={t('placeholderContactName')}
                      methods={methods}
                    />
                    <FormField<UpdateOrganizationInput>
                      label={t('labelContactEmail')}
                      name="contactEmail"
                      placeholder={t('placeholderContactEmail')}
                      methods={methods}
                    />
                    <FormField<UpdateOrganizationInput>
                      label={t('labelContactPhone')}
                      name="contactPhone"
                      placeholder={t('placeholderContactPhone')}
                      methods={methods}
                    />
                    <FormField<UpdateOrganizationInput>
                      label={t('labelCurrency')}
                      name="currencyCode"
                      methods={methods}
                    >
                      <CurrencyPicker
                        value={methods.watch('currencyCode')}
                        onChange={(val) =>
                          methods.setValue('currencyCode', val)
                        }
                      />
                    </FormField>
                    <FormField<UpdateOrganizationInput>
                      label={t('labelTimezone')}
                      name="timezone"
                      methods={methods}
                    >
                      <TimezonePicker
                        value={methods.watch('timezone')}
                        onChange={(val) => methods.setValue('timezone', val)}
                      />
                    </FormField>
                    <Button type="submit" disabled={updateOrg.isPending}>
                      {updateOrg.isPending && (
                        <LoaderIcon className="animate-spin" />
                      )}
                      {t('saveChanges')}
                    </Button>
                  </>
                )}
              </Form>
            </CardContent>
          </Card>

          <DangerZone>
            <DangerZoneItem
              title={t('dangerZoneTitle')}
              description={t('dangerZoneDescription')}
              action={
                <HardDeleteConfirmation
                  entityName={org.name}
                  warningTitle={t('deleteWarningTitle')}
                  warningDescription={t('deleteWarningDescription')}
                  confirmTitle={t('deleteConfirmTitle')}
                  confirmDescription={t('deleteConfirmDescription', {
                    name: org.name,
                  })}
                  confirmButtonLabel={t('deleteButton')}
                  onConfirm={() => {
                    deleteOrg.mutate(
                      { publicId: org.organizationId },
                      {
                        onSuccess: () => {
                          toast.success(t('deleteSuccess'));
                          // Redirect handled by the caller or layout
                        },
                        onError: (error) =>
                          toast.error(getErrorMessage(error, t('deleteError'))),
                      }
                    );
                  }}
                  isPending={deleteOrg.isPending}
                  loadingLabel={tCommon('hardDelete.deleting')}
                  trigger={
                    <Button variant="destructive" size="sm">
                      {t('deleteOrganization')}
                    </Button>
                  }
                />
              }
            />
          </DangerZone>
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <OrgMembersTable organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="invites" className="mt-4">
          <OrgInvitesTable organizationId={organizationId} />
        </TabsContent>
      </Tabs>

      {/* Deactivate confirmation dialog */}
      <Dialog
        open={deactivateOpen}
        onOpenChange={(open) => {
          if (deactivateOrg.isPending) return;
          if (!open) setDeactivateOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deactivateTitle')}</DialogTitle>
            <DialogDescription>{t('deactivateDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={deactivateOrg.isPending}
            >
              {deactivateOrg.isPending && (
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

// ---------------------------------------------------------------------------
// Org Members Table (Task D: row actions dropdown + user links)
// ---------------------------------------------------------------------------

function OrgMembersTable({ organizationId }: { organizationId: string }) {
  const t = useTranslations('admin.organizations');
  const tCommon = useTranslations('common');
  const format = useFormatter();
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
      memberColumnHelper.accessor('joinedAt', {
        header: t('memberColumnJoined'),
        cell: ({ getValue }) => (
          <time dateTime={getValue()}>
            {format.dateTime(new Date(getValue()), DATE_PRESETS.medium)}
          </time>
        ),
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
              <DropdownMenuItem
                onClick={() => setDeactivatingMember(row.original)}
              >
                {t('deactivateMember')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setReactivatingMember(row.original)}
              >
                {t('reactivateMember')}
              </DropdownMenuItem>
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
              {t('removeMemberDescription')}
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
              {t('deactivateMemberDescription')}
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
              {t('reactivateMemberDescription')}
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

// ---------------------------------------------------------------------------
// Org Invites Table (Task E: status badge colors)
// ---------------------------------------------------------------------------

function OrgInvitesTable({ organizationId }: { organizationId: string }) {
  const t = useTranslations('admin.organizations');
  const format = useFormatter();
  const { data: invites, isPending } = useAdminOrgInvites(organizationId);
  const cancelInvite = useCancelInvite();

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
          return val ? (
            <time dateTime={val}>
              {format.dateTime(new Date(val), DATE_PRESETS.medium)}
            </time>
          ) : '-';
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

  if (isPending) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!invites?.items?.length) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {t('noInvites')}
      </p>
    );
  }

  return <DataTable table={table} />;
}
