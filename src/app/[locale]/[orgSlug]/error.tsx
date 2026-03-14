'use client';

import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function OrgError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errorPages.unexpected');

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="max-w-md text-center">
        <CardContent className="space-y-4 pt-6">
          <div className="flex justify-center">
            <AlertCircle className="text-muted-foreground size-10" />
          </div>
          <h2 className="text-xl font-semibold">{t('title')}</h2>
          <p className="text-muted-foreground text-sm">{t('description')}</p>
          <Button onClick={reset}>{t('tryAgain')}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
