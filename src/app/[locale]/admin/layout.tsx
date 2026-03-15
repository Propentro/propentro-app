import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';
import { env } from '@/env.mjs';
import { AdminLayout } from '@/features/admin/components/admin-layout';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminRootLayout({ children, params }: Props) {
  const { locale } = await params;
  const { getToken, userId } = await auth();

  if (!userId) {
    redirect(routes.signIn(locale));
  }

  const token = await getToken();
  if (!token) {
    redirect(routes.signIn(locale));
  }

  // Verify super admin status via the backend
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_BASE_API_URL}/v1/admin/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      redirect(routes.selectWorkspace(locale));
    }
  } catch {
    redirect(routes.selectWorkspace(locale));
  }

  return <AdminLayout>{children}</AdminLayout>;
}
