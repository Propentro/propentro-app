'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import type { AdminUser } from '../../types';
import { UserDangerZone } from './user-danger-zone';

interface UserDetailsTabProps {
  user: AdminUser;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[200px_1fr]">
      <dt className="text-muted-foreground text-sm font-medium">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export function UserDetailsTab({ user }: UserDetailsTabProps) {
  const t = useTranslations('admin.users');
  const format = useFormatter();

  return (
    <div className="max-w-4xl space-y-6">
      {/* Section: User Info (read-only) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{t('sectionUserInfo')}</h3>
          <p className="text-muted-foreground text-sm">
            {t('sectionUserInfoDescription')}
          </p>
        </div>
        <Card>
          <CardContent className="space-y-3 pt-6">
            <InfoRow label={t('labelEmail')} value={user.email} />
            <InfoRow
              label={t('labelFirstName')}
              value={user.firstName ?? '-'}
            />
            <InfoRow
              label={t('labelLastName')}
              value={user.lastName ?? '-'}
            />
            <InfoRow
              label={t('labelCreatedAt')}
              value={format.dateTime(new Date(user.createdAt), {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
          </CardContent>
        </Card>
      </div>

      <Separator />

      <UserDangerZone user={user} />
    </div>
  );
}
