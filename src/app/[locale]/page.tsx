import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LocaleRootPage({ params }: Props) {
  const { locale } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect(routes.signIn(locale));
  }

  redirect(routes.selectWorkspace(locale));
}
