import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/page-header';
import { UserDetail } from '@/features/admin/users/components/user-detail';

interface Props {
  params: Promise<{ publicId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { publicId } = await params;
  const t = await getTranslations('admin.users');
  return { title: `${t('detailTitle')} ${publicId} | Platform Admin | Propentro` };
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { publicId } = await params;
  const t = await getTranslations('admin.users');

  return (
    <>
      <PageHeader title={t('detailTitle')} />
      <UserDetail id={publicId} />
    </>
  );
}
