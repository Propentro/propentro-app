import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/page-header';

export default async function DashboardPage() {
  const t = await getTranslations('pages');

  return (
    <PageHeader title={t('dashboard')} />
  );
}
