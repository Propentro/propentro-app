import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/page-header';
import { SettingsNav } from '@/features/settings/components/settings-nav';

interface Props {
  params: Promise<{ orgSlug: string }>;
  children: React.ReactNode;
}

export default async function SettingsLayout({ params, children }: Props) {
  const { orgSlug } = await params;
  const t = await getTranslations('pages');

  return (
    <>
      <PageHeader title={t('settings')} />
      <SettingsNav orgSlug={orgSlug} />
      <div className="mt-6">{children}</div>
    </>
  );
}
