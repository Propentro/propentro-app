import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';

export const metadata: Metadata = { title: 'Platform Admin | Propentro' };

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AdminOverviewPage({ params }: Props) {
  const { locale } = await params;
  redirect(routes.admin.organizations(locale));
}
