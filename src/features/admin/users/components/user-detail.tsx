'use client';

import { LoaderIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { paths } from '@/config/routes';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import { EntityHeader } from '../../components/entity-header';
import {
  useAdminUser,
  useDeactivateUser,
  useReactivateUser,
} from '../hooks/use-admin-users';
import { UserDetailSkeleton } from './user-detail-skeleton';
import { UserDetailsTab } from './user-details-tab';
import { UserOrganizationsTable } from './user-organizations-table';

interface UserDetailProps {
  id: string;
}

export function UserDetail({ id }: UserDetailProps) {
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('common');
  const { data: user, isPending } = useAdminUser(id);
  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsString.withDefault('details')
  );
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  if (isPending) {
    return <UserDetailSkeleton />;
  }

  if (!user) return null;

  const displayName =
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;

  function handleDeactivate() {
    deactivateUser.mutate(id, {
      onSuccess: () => {
        toast.success(t('deactivateSuccess'));
        setDeactivateOpen(false);
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('deactivateError')));
      },
    });
  }

  function handleReactivate() {
    reactivateUser.mutate(id, {
      onSuccess: () => {
        toast.success(t('reactivateSuccess'));
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('reactivateError')));
      },
    });
  }

  return (
    <div className="space-y-6">
      <EntityHeader
        name={displayName}
        isActive={user.isActive}
        activeLabel={t('statusActive')}
        inactiveLabel={t('statusInactive')}
        identifiers={[user.userId, user.email]}
        backHref={paths.admin.users}
        backLabel={t('backToUsers')}
        quickAction={
          user.isActive
            ? {
                label: t('deactivate'),
                onClick: () => setDeactivateOpen(true),
                isPending: false,
                variant: 'destructive',
              }
            : {
                label: t('reactivate'),
                onClick: handleReactivate,
                isPending: reactivateUser.isPending,
                variant: 'default',
              }
        }
      />

      <Tabs value={tab} onValueChange={(val) => void setTab(val)}>
        <TabsList>
          <TabsTrigger value="details">{t('tabDetails')}</TabsTrigger>
          <TabsTrigger value="organizations">
            {t('tabOrganizations')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <UserDetailsTab user={user} />
        </TabsContent>

        <TabsContent value="organizations" className="mt-4">
          <UserOrganizationsTable organizations={user.organizations} />
        </TabsContent>
      </Tabs>

      {/* Deactivate confirmation dialog */}
      <Dialog
        open={deactivateOpen}
        onOpenChange={(open) => {
          if (deactivateUser.isPending) return;
          if (!open) setDeactivateOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deactivateTitle')}</DialogTitle>
            <DialogDescription>
              {t('deactivateDescription', { name: displayName })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={deactivateUser.isPending}
            >
              {deactivateUser.isPending && (
                <LoaderIcon className="animate-spin" />
              )}
              {t('deactivate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
