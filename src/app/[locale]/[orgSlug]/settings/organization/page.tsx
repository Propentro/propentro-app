import type { Metadata } from 'next';

import { PERMISSIONS } from '@/config/permissions';
import { hasPermission, requirePermission } from '@/lib/auth';

export const metadata: Metadata = { title: 'Organisation Settings | Propentro' };

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function OrganizationSettingsPage({ params }: Props) {
  const { locale } = await params;

  await requirePermission(PERMISSIONS.settings.read, locale);

  const _canEdit = await hasPermission(PERMISSIONS.settings.update);

  return <div>{/* Organisation settings form will be built here */}</div>;
}
