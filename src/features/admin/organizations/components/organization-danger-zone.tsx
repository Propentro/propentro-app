'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { DangerZone, DangerZoneItem } from '@/components/shared/danger-zone';
import { HardDeleteConfirmation } from '@/components/shared/hard-delete-confirmation';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/routes';
import { useRouter } from '@/i18n/routing';
import { getErrorMessage } from '@/lib/parse-api-error';

import type { AdminOrganization } from '../../types';
import { useDeleteOrganization } from '../hooks/use-admin-organizations';

interface OrganizationDangerZoneProps {
  organization: AdminOrganization;
}

export function OrganizationDangerZone({
  organization,
}: OrganizationDangerZoneProps) {
  const t = useTranslations('admin.organizations');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const deleteOrg = useDeleteOrganization();

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
        <div />
        <DangerZone>
          <DangerZoneItem
            title={t('dangerZoneTitle')}
            description={t('dangerZoneDescription')}
            action={
              organization.isActive ? (
                <Button variant="destructive" size="sm" disabled>
                  {t('deleteOrganization')}
                </Button>
              ) : (
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
                          router.push(paths.admin.organizations);
                        },
                        onError: (error) =>
                          toast.error(
                            getErrorMessage(error, t('deleteError'))
                          ),
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
              )
            }
          />
        </DangerZone>
      </div>
    </div>
  );
}
