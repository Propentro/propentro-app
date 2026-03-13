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
  const { userId } = await auth();

  if (!userId) {
    redirect(routes.signIn(locale));
  }

  const t = await getTranslations('workspace');

  const client = await clerkClient();
  const memberships = await client.users.getOrganizationMembershipList({
    userId,
  });

  const orgs = memberships.data.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug!,
    imageUrl: m.organization.imageUrl,
  }));

  // 0 orgs — show message
  if (orgs.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold">{t('noWorkspaces')}</h1>
        <p className="text-muted-foreground">{t('noWorkspacesDescription')}</p>
      </div>
    );
  }

  // 1 org — auto redirect
  if (orgs.length === 1) {
    redirect(routes.home(locale, orgs[0].slug));
  }

  // 2+ orgs — show list
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{t('selectWorkspace')}</h1>
        <p className="text-muted-foreground mt-2">{t('selectDescription')}</p>
      </div>
      <WorkspaceList orgs={orgs} locale={locale} />
    </div>
  );
}
