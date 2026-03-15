import type { Metadata } from 'next';

import { PERMISSIONS } from '@/config/permissions';
import { MembersContent } from '@/features/settings/members/components/members-content';
import { hasPermission, requirePermission } from '@/lib/auth';

export const metadata: Metadata = { title: 'Members | Propentro' };

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function MembersSettingsPage({ params }: Props) {
  const { locale } = await params;

  await requirePermission(PERMISSIONS.members.read, locale);

  const canManage = await hasPermission(PERMISSIONS.members.manage);

  return <MembersContent canManage={canManage} />;
}
