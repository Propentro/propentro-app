import type { Metadata } from 'next';

import { OrganisationsList } from '@/features/admin/components/organisations-list';

export const metadata: Metadata = {
  title: 'Organisations | Platform Admin | Propentro',
};

export default function AdminOrganisationsPage() {
  return <OrganisationsList />;
}
