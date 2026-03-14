'use client';

import { ShieldCheckIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

interface RolesEmptyStateProps {
  canManage: boolean;
  onCreate: () => void;
}

export function RolesEmptyState({ canManage, onCreate }: RolesEmptyStateProps) {
  const t = useTranslations('roles');

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-full">
        <ShieldCheckIcon className="text-muted-foreground size-6" />
      </div>
      <h3 className="text-lg font-medium">{t('emptyTitle')}</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
        {t('emptyDescription')}
      </p>
      {canManage && (
        <Button className="mt-4" onClick={onCreate}>
          {t('addRole')}
        </Button>
      )}
    </div>
  );
}
