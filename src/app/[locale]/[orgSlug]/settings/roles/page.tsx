import type { Metadata } from 'next';

import { PERMISSIONS } from '@/config/permissions';
import { hasPermission, requirePermission } from '@/lib/auth';

export const metadata: Metadata = { title: 'Roles & Permissions | Propentro' };

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function RolesSettingsPage({ params }: Props) {
  const { locale } = await params;

  await requirePermission(PERMISSIONS.roles.read, locale);

  const _canManage = await hasPermission(PERMISSIONS.roles.manage);

  return <div>{/* Roles & permissions feature UI will be built here */}</div>;
}
