'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type DangerZoneItemProps = {
  title: string;
  description: string;
  action: ReactNode;
};

function DangerZoneItem({ title, description, action }: DangerZoneItemProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-2">
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}

type DangerZoneProps = {
  children: ReactNode;
};

function DangerZone({ children }: DangerZoneProps) {
  const t = useTranslations('common.dangerZone');

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">{t('title')}</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="divide-y pt-2">{children}</CardContent>
    </Card>
  );
}

export { DangerZone, DangerZoneItem };
