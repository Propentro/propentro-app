import type { Metadata } from 'next';

import { PERMISSIONS } from '@/config/permissions';
import { RolesContent } from '@/features/settings/roles/components/roles-content';
import { hasPermission, requirePermission } from '@/lib/auth';

export const metadata: Metadata = { title: 'Roles & Permissions | Propentro' };

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function RolesSettingsPage({ params }: Props) {
  const { locale } = await params;

  await requirePermission(PERMISSIONS.roles.read, locale);

  const canManage = await hasPermission(PERMISSIONS.roles.manage);

  return <RolesContent canManage={canManage} />;
}
