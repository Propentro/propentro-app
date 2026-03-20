'use client';

import { useTranslations } from 'next-intl';
import { parseAsString, useQueryState } from 'nuqs';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { paths } from '@/config/routes';

import { EntityHeader } from '../../components/entity-header';
import { useAdminUser } from '../hooks/use-admin-users';
import { UserDetailSkeleton } from './user-detail-skeleton';
import { UserDetailsTab } from './user-details-tab';
import { UserOrganizationsTable } from './user-organizations-table';

interface UserDetailProps {
  id: string;
}

export function UserDetail({ id }: UserDetailProps) {
  const t = useTranslations('admin.users');
  const { data: user, isPending } = useAdminUser(id);
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsString.withDefault('details')
  );

  if (isPending) {
    return <UserDetailSkeleton />;
  }

  if (!user) return null;

  const displayName =
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;

  return (
    <div className="space-y-6">
      <EntityHeader
        name={displayName}
        isActive={user.isActive}
        activeLabel={t('statusActive')}
        inactiveLabel={t('statusInactive')}
        identifiers={[user.email]}
        backHref={paths.admin.users}
        backLabel={t('backToUsers')}
      />

      <Tabs value={tab} onValueChange={(val) => void setTab(val)}>
        <TabsList>
          <TabsTrigger value="details">{t('tabDetails')}</TabsTrigger>
          <TabsTrigger value="organizations">
            {t('tabOrganizations')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <UserDetailsTab user={user} />
        </TabsContent>

        <TabsContent value="organizations" className="mt-4">
          <UserOrganizationsTable organizations={user.organizations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
