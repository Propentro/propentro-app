import { Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Card, CardContent } from '@/components/ui/card';
import { paths } from '@/config/routes';
import { Link } from '@/i18n/routing';

export default async function AdminUserNotFound() {
  const t = await getTranslations('errorPages.adminUserNotFound');

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="max-w-md text-center">
        <CardContent className="space-y-4 pt-6">
          <div className="flex justify-center">
            <Users className="text-muted-foreground size-10" />
          </div>
          <h2 className="text-xl font-semibold">{t('title')}</h2>
          <p className="text-muted-foreground text-sm">{t('description')}</p>
          <Link
            href={paths.admin.users}
            className="text-primary text-sm hover:underline"
          >
            {t('backToList')}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
