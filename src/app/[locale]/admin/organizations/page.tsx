import type { Metadata } from 'next';

import { OrganizationsList } from '@/features/admin/organizations/components/organizations-list';

export const metadata: Metadata = {
  title: 'Organisations | Platform Admin | Propentro',
};

export default function AdminOrganizationsPage() {
  return <OrganizationsList />;
}
