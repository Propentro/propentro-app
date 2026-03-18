import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/page-header';
import { InvitesList } from '@/features/admin/invites/components/invites-list';

export const metadata: Metadata = {
  title: 'Invitations | Platform Admin | Propentro',
};

export default async function AdminInvitesPage() {
  const t = await getTranslations('admin.invites');

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <InvitesList />
    </>
  );
}
