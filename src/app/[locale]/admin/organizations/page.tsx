import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/page-header';
import { OrganizationsList } from '@/features/admin/organizations/components/organizations-list';

export const metadata: Metadata = {
  title: 'Organizations | Platform Admin | Propentro',
};

export default async function AdminOrganizationsPage() {
  const t = await getTranslations('admin.organizations');

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <OrganizationsList />
    </>
  );
}
