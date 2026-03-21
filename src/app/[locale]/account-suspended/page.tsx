'use client';

import { useClerk } from '@clerk/nextjs';
import { LogOut, ShieldOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AccountSuspendedPage() {
  const t = useTranslations('errorPages.accountSuspended');
  const { signOut } = useClerk();

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="max-w-md text-center">
        <CardContent className="space-y-4 pt-6">
          <div className="bg-muted mx-auto flex size-12 items-center justify-center rounded-full">
            <ShieldOff className="text-muted-foreground size-6" />
          </div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
          <Button
            variant="outline"
            onClick={() => signOut({ redirectUrl: '/sign-in' })}
          >
            <LogOut className="mr-2 size-4" />
            {t('signOut')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
