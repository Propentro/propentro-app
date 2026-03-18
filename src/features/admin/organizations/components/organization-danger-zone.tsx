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
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import type { AdminOrganization } from '../../types';
import {
  useDeactivateOrganization,
  useDeleteOrganization,
  useReactivateOrganization,
} from '../hooks/use-admin-organizations';

interface OrganizationDangerZoneProps {
  organization: AdminOrganization;
}

export function OrganizationDangerZone({
  organization,
}: OrganizationDangerZoneProps) {
  const t = useTranslations('admin.organizations');
  const tCommon = useTranslations('common');
  const deactivateOrg = useDeactivateOrganization();
  const reactivateOrg = useReactivateOrganization();
  const deleteOrg = useDeleteOrganization();
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  function handleDeactivate() {
    deactivateOrg.mutate(organization.organizationId, {
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
    reactivateOrg.mutate(organization.organizationId, {
      onSuccess: () => {
        toast.success(t('reactivateSuccess'));
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('reactivateError')));
      },
    });
  }

  return (
    <>
      <DangerZone>
        {organization.isActive ? (
          <DangerZoneItem
            title={t('deactivateTitle')}
            description={t('deactivateDescription')}
            action={
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeactivateOpen(true)}
              >
                {t('deactivate')}
              </Button>
            }
          />
        ) : (
          <DangerZoneItem
            title={t('reactivateTitle')}
            description={t('reactivateDescription')}
            action={
              <Button
                size="sm"
                onClick={handleReactivate}
                disabled={reactivateOrg.isPending}
              >
                {reactivateOrg.isPending && (
                  <LoaderIcon className="animate-spin" />
                )}
                {t('reactivate')}
              </Button>
            }
          />
        )}
        <DangerZoneItem
          title={t('dangerZoneTitle')}
          description={t('dangerZoneDescription')}
          action={
            <HardDeleteConfirmation
              entityName={organization.name}
              warningTitle={t('deleteWarningTitle')}
              warningDescription={t('deleteWarningDescription')}
              confirmTitle={t('deleteConfirmTitle')}
              confirmDescription={t('deleteConfirmDescription', {
                name: organization.name,
              })}
              confirmButtonLabel={t('deleteButton')}
              onConfirm={() => {
                deleteOrg.mutate(
                  { publicId: organization.organizationId },
                  {
                    onSuccess: () => {
                      toast.success(t('deleteSuccess'));
                    },
                    onError: (error) =>
                      toast.error(getErrorMessage(error, t('deleteError'))),
                  }
                );
              }}
              isPending={deleteOrg.isPending}
              loadingLabel={tCommon('hardDelete.deleting')}
              trigger={
                <Button variant="destructive" size="sm">
                  {t('deleteOrganization')}
                </Button>
              }
            />
          }
        />
      </DangerZone>

      {/* Deactivate confirmation dialog */}
      <Dialog
        open={deactivateOpen}
        onOpenChange={(open) => {
          if (deactivateOrg.isPending) return;
          if (!open) setDeactivateOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deactivateTitle')}</DialogTitle>
            <DialogDescription>{t('deactivateDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={deactivateOrg.isPending}
            >
              {deactivateOrg.isPending && (
                <LoaderIcon className="animate-spin" />
              )}
              {t('deactivate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
