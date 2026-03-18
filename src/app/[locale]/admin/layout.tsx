import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';
import { AdminLayout } from '@/features/admin/components/admin-layout';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminRootLayout({ children, params }: Props) {
  const { locale } = await params;
  const { sessionClaims } = await auth();

  const isSuperAdmin =
    (sessionClaims?.metadata as { systemRole?: string } | undefined)
      ?.systemRole === 'super_admin';

  if (!isSuperAdmin) {
    redirect(routes.selectWorkspace(locale));
  }

  return <AdminLayout>{children}</AdminLayout>;
}
