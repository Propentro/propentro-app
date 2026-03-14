import type { Metadata } from 'next';

import { redirect } from '@/i18n/routing';

export const metadata: Metadata = { title: 'Account | Propentro' };

interface Props {
  params: Promise<{ locale: string; orgSlug: string }>;
}

export default async function AccountPage({ params }: Props) {
  const { locale, orgSlug } = await params;
  redirect({ href: `/${orgSlug}/account/profile`, locale });
}
