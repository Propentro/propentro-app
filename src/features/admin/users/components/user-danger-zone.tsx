'use client';

import { LoaderIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { DangerZone, DangerZoneItem } from '@/components/shared/danger-zone';
import { HardDeleteConfirmation } from '@/components/shared/hard-delete-confirmation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { paths } from '@/config/routes';
import { useRouter } from '@/i18n/routing';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import type { AdminUser } from '../../types';
import {
  useDeactivateUser,
  useDeleteUser,
  useReactivateUser,
} from '../hooks/use-admin-users';

interface UserDangerZoneProps {
  user: AdminUser;
}

export function UserDangerZone({ user }: UserDangerZoneProps) {
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const deleteUser = useDeleteUser();
  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const displayName =
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;

  function handleDeactivate() {
    deactivateUser.mutate(user.userId, {
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
    reactivateUser.mutate(user.userId, {
      onSuccess: () => {
        toast.success(t('reactivateSuccess'));
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('reactivateError')));
      },
    });
  }

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
        <div />
        <DangerZone>
          <DangerZoneItem
            title={
              user.isActive
                ? t('dangerZoneDeactivateTitle')
                : t('dangerZoneReactivateTitle')
            }
            description={
              user.isActive
                ? t('dangerZoneDeactivateDescription')
                : t('dangerZoneReactivateDescription')
            }
            action={
              user.isActive ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeactivateOpen(true)}
                >
                  {t('deactivate')}
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleReactivate}
                  disabled={reactivateUser.isPending}
                >
                  {reactivateUser.isPending && (
                    <LoaderIcon className="animate-spin" />
                  )}
                  {t('reactivate')}
                </Button>
              )
            }
          />
          <DangerZoneItem
            title={t('dangerZoneTitle')}
            description={
              user.isActive
                ? t('dangerZoneDeleteDescriptionActive')
                : t('dangerZoneDeleteDescriptionInactive')
            }
            action={
              user.isActive ? (
                <Button variant="destructive" size="sm" disabled>
                  {t('deleteUser')}
                </Button>
              ) : (
                <HardDeleteConfirmation
                  entityName={user.email}
                  warningTitle={t('deleteWarningTitle')}
                  warningDescription={t('deleteWarningDescription')}
                  confirmTitle={t('deleteConfirmTitle')}
                  confirmDescription={t('deleteConfirmDescription', {
                    name: user.email,
                  })}
                  confirmButtonLabel={t('deleteButton')}
                  onConfirm={() => {
                    deleteUser.mutate(
                      { publicId: user.userId },
                      {
                        onSuccess: () => {
                          toast.success(t('deleteSuccess'));
                          router.push(paths.admin.users);
                        },
                        onError: (error) =>
                          toast.error(
                            getErrorMessage(error, t('deleteError'))
                          ),
                      }
                    );
                  }}
                  isPending={deleteUser.isPending}
                  loadingLabel={tCommon('hardDelete.deleting')}
                  trigger={
                    <Button variant="destructive" size="sm">
                      {t('deleteUser')}
                    </Button>
                  }
                />
              )
            }
          />
        </DangerZone>
      </div>

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
            <Button
              variant="outline"
              onClick={() => setDeactivateOpen(false)}
              disabled={deactivateUser.isPending}
            >
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
