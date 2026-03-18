import type { Metadata } from 'next';

import { UserDetail } from '@/features/admin/users/components/user-detail';

export const metadata: Metadata = {
  title: 'User Detail | Platform Admin | Propentro',
};

interface Props {
  params: Promise<{ publicId: string }>;
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { publicId } = await params;
  return <UserDetail id={publicId} />;
}
