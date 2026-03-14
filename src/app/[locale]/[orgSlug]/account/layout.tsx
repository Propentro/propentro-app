import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/page-header';
import { AccountNav } from '@/features/account/components/account-nav';

interface Props {
  params: Promise<{ orgSlug: string }>;
  children: React.ReactNode;
}

export default async function AccountLayout({ params, children }: Props) {
  const { orgSlug } = await params;
  const t = await getTranslations('pages');

  return (
    <>
      <PageHeader title={t('account')} />
      <AccountNav orgSlug={orgSlug} />
      <div className="mt-6">{children}</div>
    </>
  );
}
