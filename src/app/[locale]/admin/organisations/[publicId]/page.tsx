import type { Metadata } from 'next';

import { OrganisationDetail } from '@/features/admin/components/organisation-detail';

export const metadata: Metadata = {
  title: 'Organisation Detail | Platform Admin | Propentro',
};

interface Props {
  params: Promise<{ publicId: string }>;
}

export default async function AdminOrganisationDetailPage({ params }: Props) {
  const { publicId } = await params;
  return <OrganisationDetail publicId={publicId} />;
}
