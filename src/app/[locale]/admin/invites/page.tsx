import type { Metadata } from 'next';

import { InvitesList } from '@/features/admin/components/invites-list';

export const metadata: Metadata = {
  title: 'Invitations | Platform Admin | Propentro',
};

export default function AdminInvitesPage() {
  return <InvitesList />;
}
