import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ProfileCard } from '@/features/account/profile/components/profile-card';

export const metadata: Metadata = { title: 'Profile | Propentro' };

export default async function ProfilePage() {
  const t = await getTranslations('account.profile');

  return (
    <div>
      <h2 className="text-lg font-semibold">{t('title')}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{t('description')}</p>
      <div className="mt-6">
        <ProfileCard />
      </div>
    </div>
  );
}
