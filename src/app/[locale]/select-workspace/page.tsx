import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { routes } from '@/config/routes';
import { WorkspaceList } from '@/features/select-workspace/components/workspace-list';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SelectWorkspacePage({ params }: Props) {
  const { locale } = await params;
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect(routes.signIn(locale));
  }

  const isSuperAdmin =
    (sessionClaims?.metadata as { systemRole?: string } | undefined)
      ?.systemRole === 'super_admin';

  const [t, client] = await Promise.all([
    getTranslations('workspace'),
    clerkClient(),
  ]);

  const memberships = await client.users.getOrganizationMembershipList({
    userId,
  });

  const orgs = memberships.data.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug!,
    imageUrl: m.organization.imageUrl,
  }));

  // 0 orgs and not super admin — show message
  if (orgs.length === 0 && !isSuperAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold">{t('noWorkspaces')}</h1>
        <p className="text-muted-foreground">{t('noWorkspacesDescription')}</p>
      </div>
    );
  }

  // 1 org and not super admin — auto redirect
  if (orgs.length === 1 && !isSuperAdmin) {
    redirect(routes.home(locale, orgs[0].slug));
  }

  // Super admin with 0 orgs — show only admin option
  // Super admin with 1+ orgs — show admin option + org list
  // Non-admin with 2+ orgs — show org list
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{t('selectWorkspace')}</h1>
        <p className="text-muted-foreground mt-2">{t('selectDescription')}</p>
      </div>
      <WorkspaceList orgs={orgs} locale={locale} isSuperAdmin={isSuperAdmin} />
    </div>
  );
}
