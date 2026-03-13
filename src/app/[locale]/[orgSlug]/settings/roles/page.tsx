import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/page-header';
import { paths } from '@/config/routes';
import { hasPermission, requirePermission } from '@/lib/auth';

interface Props {
  params: Promise<{ locale: string; orgSlug: string }>;
}

export default async function RolesSettingsPage({ params }: Props) {
  const { locale } = await params;

  await requirePermission('org:roles:read', locale);

  const [t, canManage] = await Promise.all([
    getTranslations(),
    hasPermission('org:roles:manage'),
  ]);

  return (
    <>
      <PageHeader
        title={t('pages.settingsRoles')}
        breadcrumb={[
          { name: t('pages.settings'), href: paths.settings.organization },
          { name: t('pages.settingsRoles') },
        ]}
      />
      <p className="text-muted-foreground">
        Roles & permissions page — feature UI will be built in Phase 10.
        {canManage ? ' (You have manage access)' : ' (Read-only)'}
      </p>
    </>
  );
}
