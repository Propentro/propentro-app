import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/page-header';
import { paths } from '@/config/routes';
import { hasPermission, requirePermission } from '@/lib/auth';

interface Props {
  params: Promise<{ locale: string; orgSlug: string }>;
}

export default async function OrganizationSettingsPage({ params }: Props) {
  const { locale } = await params;

  await requirePermission('org:settings:read', locale);

  const [t, canEdit] = await Promise.all([
    getTranslations(),
    hasPermission('org:settings:update'),
  ]);

  return (
    <>
      <PageHeader
        title={t('pages.settingsOrganization')}
        breadcrumb={[
          { name: t('pages.settings'), href: paths.settings.organization },
          { name: t('pages.settingsOrganization') },
        ]}
      />
      <p className="text-muted-foreground">
        Organisation settings page — feature UI will be built in Phase 10.
        {canEdit ? ' (You have edit access)' : ' (Read-only)'}
      </p>
    </>
  );
}
