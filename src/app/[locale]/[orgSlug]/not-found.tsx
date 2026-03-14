import { FileQuestion } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { paths } from '@/config/routes';
import { Link } from '@/i18n/routing';

export default function OrgNotFound() {
  const t = useTranslations('errorPages.notFound');

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="max-w-md text-center">
        <CardContent className="space-y-4 pt-6">
          <div className="flex justify-center">
            <FileQuestion className="text-muted-foreground size-10" />
          </div>
          <h2 className="text-xl font-semibold">{t('title')}</h2>
          <p className="text-muted-foreground text-sm">{t('description')}</p>
          <Button render={<Link href={paths.home} />}>{t('backHome')}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
