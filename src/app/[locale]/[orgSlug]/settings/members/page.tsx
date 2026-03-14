import type { Metadata } from 'next';

import { hasPermission, requirePermission } from '@/lib/auth';

export const metadata: Metadata = { title: 'Members' };

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function MembersSettingsPage({ params }: Props) {
  const { locale } = await params;

  await requirePermission('org:members:read', locale);

  const _canManage = await hasPermission('org:members:manage');

  return <div>{/* Members feature UI will be built here */}</div>;
}
