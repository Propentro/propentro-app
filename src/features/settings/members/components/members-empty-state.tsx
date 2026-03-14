'use client';

import { UsersIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

interface MembersEmptyStateProps {
  canManage: boolean;
  onInvite: () => void;
}

export function MembersEmptyState({
  canManage,
  onInvite,
}: MembersEmptyStateProps) {
  const t = useTranslations('members');

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-full">
        <UsersIcon className="text-muted-foreground size-6" />
      </div>
      <h3 className="text-lg font-medium">{t('emptyTitle')}</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
        {t('emptyDescription')}
      </p>
      {canManage && (
        <Button className="mt-4" onClick={onInvite}>
          {t('addMember')}
        </Button>
      )}
    </div>
  );
}
