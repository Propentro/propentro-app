import type { Metadata } from 'next';

import { OrganizationDetail } from '@/features/admin/components/organization-detail';

export const metadata: Metadata = {
  title: 'Organisation Detail | Platform Admin | Propentro',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminOrganizationDetailPage({ params }: Props) {
  const { id } = await params;
  return <OrganizationDetail publicId={id} />;
}
