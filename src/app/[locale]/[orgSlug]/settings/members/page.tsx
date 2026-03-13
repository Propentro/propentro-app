import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/page-header';
import { paths } from '@/config/routes';
import { hasPermission, requirePermission } from '@/lib/auth';

interface Props {
  params: Promise<{ locale: string; orgSlug: string }>;
}

export default async function MembersSettingsPage({ params }: Props) {
  const { locale } = await params;

  await requirePermission('org:members:read', locale);

  const [t, canManage] = await Promise.all([
    getTranslations(),
    hasPermission('org:members:manage'),
  ]);

  return (
    <>
      <PageHeader
        title={t('pages.settingsMembers')}
        breadcrumb={[
          { name: t('pages.settings'), href: paths.settings.organization },
          { name: t('pages.settingsMembers') },
        ]}
      />
      <p className="text-muted-foreground">
        Members page — feature UI will be built in Phase 10.
        {canManage ? ' (You have manage access)' : ' (Read-only)'}
      </p>
    </>
  );
}
