'use client';

import { useTranslations } from 'next-intl';
import { parseAsString, useQueryState } from 'nuqs';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useAdminOrganization } from '../hooks/use-admin-organizations';
import { OrganizationDangerZone } from './organization-danger-zone';
import { OrganizationDetailSkeleton } from './organization-detail-skeleton';
import { OrganizationInfoForm } from './organization-info-form';
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
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('info'));

  if (isPending) {
    return <OrganizationDetailSkeleton />;
  }

  if (!org) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <p className="text-muted-foreground font-mono text-sm">{org.slug}</p>
        <Badge variant={org.isActive ? 'default' : 'destructive'}>
          {org.isActive ? t('statusActive') : t('statusInactive')}
        </Badge>
      </div>

      <Tabs value={tab} onValueChange={(val) => void setTab(val)}>
        <TabsList>
          <TabsTrigger value="info">{t('tabInfo')}</TabsTrigger>
          <TabsTrigger value="members">{t('tabMembers')}</TabsTrigger>
          <TabsTrigger value="invites">{t('tabInvites')}</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4 space-y-6">
          <OrganizationInfoForm organization={org} />
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
