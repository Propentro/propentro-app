import { Home } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { routes } from '@/config/routes';

export default function AccessDeniedPage() {
  const t = useTranslations('errorPages.accessDenied');
  const locale = useLocale();

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="max-w-md text-center">
        <CardContent className="space-y-4 pt-6">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
          <Button render={<Link href={routes.selectWorkspace(locale)} />}>
            <Home className="mr-2 size-4" />
            {t('backHome')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
