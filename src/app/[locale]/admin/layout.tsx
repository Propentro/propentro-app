import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';
import { AdminLayout } from '@/features/admin/components/admin-layout';
import { getMeOrRedirect } from '@/lib/auth';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminRootLayout({ children, params }: Props) {
  const { locale } = await params;

  const user = await getMeOrRedirect(locale);

  if (!user.isSystemAdmin) {
    redirect(routes.selectWorkspace(locale));
  }

  return <AdminLayout>{children}</AdminLayout>;
}
