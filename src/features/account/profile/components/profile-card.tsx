'use client';

import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useMe } from '@/hooks/use-me';

export function ProfileCard() {
  const me = useMe();
  const t = useTranslations('account.profile');

  const fullName = `${me.firstName} ${me.lastName}`;
  const initials = `${me.firstName[0]}${me.lastName[0]}`.toUpperCase();

  return (
    <Card className="max-w-xl">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-[72px]">
            <AvatarImage src={me.imageUrl} alt={fullName} />
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{fullName}</h3>
            <p className="text-muted-foreground text-sm">{me.email}</p>
          </div>
        </div>

        <Separator className="my-5" />

        <dl className="space-y-4">
          {me.role && me.role.length > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground text-sm">{t('role')}</dt>
              <dd className="flex gap-1.5">
                {me.role.map((r) => (
                  <Badge key={r} variant="secondary">
                    {r}
                  </Badge>
                ))}
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground text-sm">
              {t('organization')}
            </dt>
            <dd className="text-sm">{me.organization.name}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
