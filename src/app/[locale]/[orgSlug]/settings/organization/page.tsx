import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { hasPermission, requirePermission } from '@/lib/auth';

export const metadata: Metadata = { title: 'Organisation Settings' };

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function OrganizationSettingsPage({ params }: Props) {
  const { locale } = await params;

  await requirePermission('org:settings:read', locale);

  const [t, canEdit] = await Promise.all([
    getTranslations('settings.organization'),
    hasPermission('org:settings:update'),
  ]);

  return (
    <div>
      <p className="text-muted-foreground text-sm">
        {canEdit
          ? t('readOnlyNotice').replace('do not', 'do')
          : t('readOnlyNotice')}
      </p>
    </div>
  );
}
