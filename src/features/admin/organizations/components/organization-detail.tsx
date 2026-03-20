'use client';

import { useTranslations } from 'next-intl';
import { parseAsString, useQueryState } from 'nuqs';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { paths } from '@/config/routes';

import { EntityHeader } from '../../components/entity-header';
import { useAdminOrganization } from '../hooks/use-admin-organizations';
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
  const { data: org, isPending } = useAdminOrganization(organizationId);
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsString.withDefault('details')
  );

  if (isPending) {
    return <OrganizationDetailSkeleton />;
  }

  if (!org) return null;

  return (
    <div className="space-y-6">
      <EntityHeader
        name={org.name}
        isActive={org.isActive}
        activeLabel={t('statusActive')}
        inactiveLabel={t('statusInactive')}
        identifiers={[org.slug, org.currencyCode, org.timezone]}
        backHref={paths.admin.organizations}
        backLabel={t('backToOrganizations')}
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
    </div>
  );
}
