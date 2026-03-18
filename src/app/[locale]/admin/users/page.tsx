import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/page-header';
import { UsersList } from '@/features/admin/users/components/users-list';

export const metadata: Metadata = {
  title: 'Users | Platform Admin | Propentro',
};

export default async function AdminUsersPage() {
  const t = await getTranslations('admin.users');

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <UsersList />
    </>
  );
}
