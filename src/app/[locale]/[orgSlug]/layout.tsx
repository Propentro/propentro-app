import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { AppLayout } from '@/components/layout/app-layout';
import { UserProvider } from '@/components/providers/user-provider';
import { routes } from '@/config/routes';
import { getMeOrRedirect } from '@/lib/auth';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function OrgLayout({ children, params }: Props) {
  const { locale, orgSlug } = await params;
  const { orgSlug: activeOrgSlug } = await auth();

  if (!activeOrgSlug || activeOrgSlug !== orgSlug) {
    redirect(routes.selectWorkspace(locale));
  }

  const [user, clerkUser] = await Promise.all([
    getMeOrRedirect(locale),
    currentUser(),
  ]);

  return (
    <UserProvider user={{ ...user, imageUrl: clerkUser?.imageUrl }}>
      <AppLayout>{children}</AppLayout>
    </UserProvider>
  );
}
