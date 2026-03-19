'use client';

import { LoaderIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { paths } from '@/config/routes';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import { EntityHeader } from '../../components/entity-header';
import {
  useAdminOrganization,
  useDeactivateOrganization,
  useReactivateOrganization,
} from '../hooks/use-admin-organizations';
import { OrganizationDangerZone } from './organization-danger-zone';
import { OrganizationDetailSkeleton } from './organization-detail-skeleton';
import { OrganizationDetailsForm } from './organization-details-form';
import { OrganizationInvitesTable } from './organization-invites-table';
import { OrganizationMembersTable } from './organization-members-table';

interface OrganizationDetailProps {
  organizationId: string;
}

export function OrganizationDetail({
  organizationId,
}: OrganizationDetailProps) {
  const t = useTranslations('admin.organizations');
  const tCommon = useTranslations('common');
  const { data: org, isPending } = useAdminOrganization(organizationId);
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsString.withDefault('details')
  );
  const deactivateOrg = useDeactivateOrganization();
  const reactivateOrg = useReactivateOrganization();
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  if (isPending) {
    return <OrganizationDetailSkeleton />;
  }

  if (!org) return null;

  function handleDeactivate() {
    deactivateOrg.mutate(org!.organizationId, {
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
    reactivateOrg.mutate(org!.organizationId, {
      onSuccess: () => {
        toast.success(t('reactivateSuccess'));
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('reactivateError')));
      },
    });
  }

  return (
    <div className="space-y-6">
      <EntityHeader
        name={org.name}
        isActive={org.isActive}
        activeLabel={t('statusActive')}
        inactiveLabel={t('statusInactive')}
        identifiers={[org.organizationId, org.slug, org.currencyCode, org.timezone]}
        backHref={paths.admin.organizations}
        backLabel={t('backToOrganizations')}
        quickAction={
          org.isActive
            ? {
                label: t('deactivate'),
                onClick: () => setDeactivateOpen(true),
                isPending: false,
                variant: 'destructive',
              }
            : {
                label: t('reactivate'),
                onClick: handleReactivate,
                isPending: reactivateOrg.isPending,
                variant: 'default',
              }
        }
      />

      <Tabs value={tab} onValueChange={(val) => void setTab(val)}>
        <TabsList>
          <TabsTrigger value="details">{t('tabDetails')}</TabsTrigger>
          <TabsTrigger value="members">{t('tabMembers')}</TabsTrigger>
          <TabsTrigger value="invites">{t('tabInvites')}</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4 space-y-6">
          <OrganizationDetailsForm organization={org} />
          <OrganizationDangerZone organization={org} />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <OrganizationMembersTable organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="invites" className="mt-4">
          <OrganizationInvitesTable organizationId={organizationId} />
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
              {t('deactivateDescription', { name: org.name })}
            </DialogDescription>
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
