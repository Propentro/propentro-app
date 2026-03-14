import type { Metadata } from 'next';

import { PERMISSIONS } from '@/config/permissions';
import { hasPermission, requirePermission } from '@/lib/auth';

export const metadata: Metadata = { title: 'Members' };

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function MembersSettingsPage({ params }: Props) {
  const { locale } = await params;

  await requirePermission(PERMISSIONS.members.read, locale);

  const _canManage = await hasPermission(PERMISSIONS.members.manage);

  return <div>{/* Members feature UI will be built here */}</div>;
}
