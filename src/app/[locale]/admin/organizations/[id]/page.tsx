import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/page-header';
import { OrganizationDetail } from '@/features/admin/organizations/components/organization-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations('admin.organizations');
  return { title: `${t('detailTitle')} ${id} | Platform Admin | Propentro` };
}

export default async function AdminOrganizationDetailPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations('admin.organizations');

  return (
    <>
      <PageHeader title={t('detailTitle')} />
      <OrganizationDetail organizationId={id} />
    </>
  );
}
