'use client';

import {
  type ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { LoaderIcon, TrashIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CurrencyPicker } from '@/components/shared/currency-picker';
import { FormField } from '@/components/shared/form-field';
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
import { Form } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import { useAdminOrgInvites, useCancelInvite } from '../hooks/use-admin-invites';
import { useRemoveMember } from '../hooks/use-admin-members';
import {
  useAdminOrganisation,
  useAdminOrgMembers,
  useDeactivateOrganisation,
  useUpdateOrganisation,
} from '../hooks/use-admin-organisations';
import type {
  AdminInvite,
  AdminMember,
  UpdateOrganizationInput,
} from '../types/admin.types';
import { AdminFormattedDate } from './admin-formatted-date';

const memberColumnHelper = createColumnHelper<AdminMember>();
const inviteColumnHelper = createColumnHelper<AdminInvite>();

interface OrganisationDetailProps {
  publicId: string;
}

export function OrganisationDetail({ publicId }: OrganisationDetailProps) {
  const t = useTranslations('admin.organisations');
  const { data: org, isPending } = useAdminOrganisation(publicId);
  const updateOrg = useUpdateOrganisation(publicId);
  const deactivateOrg = useDeactivateOrganisation();
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
    deactivateOrg.mutate(publicId, {
      onSuccess: () => {
        toast.success(t('deactivateSuccess'));
        setDeactivateOpen(false);
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('deactivateError')));
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
          {org.isActive && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeactivateOpen(true)}
            >
              {t('deactivate')}
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

        <TabsContent value="info" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Form<UpdateOrganizationInput>
                onSubmit={
                  handleUpdate as (
                    values: UpdateOrganizationInput
                  ) => void
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
                        onChange={(val) =>
                          methods.setValue('timezone', val)
                        }
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
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <OrgMembersTable publicId={publicId} />
        </TabsContent>

        <TabsContent value="invites" className="mt-4">
          <OrgInvitesTable publicId={publicId} />
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
            <DialogDescription>
              {t('deactivateDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeactivateOpen(false)}
            >
              {t('cancelInvite')}
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
// Org Members Table
// ---------------------------------------------------------------------------

function OrgMembersTable({ publicId }: { publicId: string }) {
  const t = useTranslations('admin.organisations');
  const { data: members, isPending } = useAdminOrgMembers(publicId);
  const removeMember = useRemoveMember(publicId);
  const [removingMember, setRemovingMember] = useState<AdminMember | null>(
    null
  );

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

  const columns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cols: ColumnDef<AdminMember, any>[] = [
      memberColumnHelper.accessor('firstName', {
        header: t('memberColumnName'),
        cell: ({ row }) => {
          const { firstName, lastName } = row.original;
          return `${firstName ?? ''} ${lastName ?? ''}`.trim() || '-';
        },
      }),
      memberColumnHelper.accessor('email', {
        header: t('memberColumnEmail'),
      }),
      memberColumnHelper.accessor('roleName', {
        header: t('memberColumnRole'),
        cell: ({ getValue }) => (
          <Badge variant="secondary">{getValue()}</Badge>
        ),
      }),
      memberColumnHelper.accessor('joinedAt', {
        header: t('memberColumnJoined'),
        cell: ({ getValue }) => <AdminFormattedDate value={getValue()} />,
      }),
      memberColumnHelper.display({
        id: 'actions',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setRemovingMember(row.original)}
          >
            <TrashIcon className="size-4" />
          </Button>
        ),
      }),
    ];
    return cols;
  }, [t]);

  const table = useReactTable({
    data: members ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isPending) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!members?.length) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {t('noMembers')}
      </p>
    );
  }

  return (
    <>
      <DataTable table={table} />

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
            <Button
              variant="outline"
              onClick={() => setRemovingMember(null)}
            >
              {t('cancelInvite')}
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
    </>
  );
}

// ---------------------------------------------------------------------------
// Org Invites Table
// ---------------------------------------------------------------------------

function OrgInvitesTable({ publicId }: { publicId: string }) {
  const t = useTranslations('admin.organisations');
  const { data: invites, isPending } = useAdminOrgInvites(publicId);
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
        cell: ({ getValue }) => (
          <Badge variant="secondary">{getValue()}</Badge>
        ),
      }),
      inviteColumnHelper.accessor('status', {
        header: t('inviteColumnStatus'),
        cell: ({ getValue }) => {
          const s = getValue();
          const variant =
            s === 'pending'
              ? 'outline'
              : s === 'accepted'
                ? 'default'
                : 'destructive';
          return <Badge variant={variant}>{s}</Badge>;
        },
      }),
      inviteColumnHelper.accessor('expiresAt', {
        header: t('inviteColumnExpires'),
        cell: ({ getValue }) => {
          const val = getValue();
          return val ? <AdminFormattedDate value={val} /> : '-';
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
    data: invites ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isPending) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!invites?.length) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {t('noInvites')}
      </p>
    );
  }

  return <DataTable table={table} />;
}
