import type { Metadata } from 'next';

import { hasPermission, requirePermission } from '@/lib/auth';

export const metadata: Metadata = { title: 'Roles & Permissions' };

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function RolesSettingsPage({ params }: Props) {
  const { locale } = await params;

  await requirePermission('org:roles:read', locale);

  const _canManage = await hasPermission('org:roles:manage');

  return <div>{/* Roles & permissions feature UI will be built here */}</div>;
}
