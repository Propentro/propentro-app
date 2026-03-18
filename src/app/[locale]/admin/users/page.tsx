import type { Metadata } from 'next';

import { UsersList } from '@/features/admin/users/components/users-list';

export const metadata: Metadata = {
  title: 'Users | Platform Admin | Propentro',
};

export default function AdminUsersPage() {
  return <UsersList />;
}
