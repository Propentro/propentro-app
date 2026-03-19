'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { DangerZone, DangerZoneItem } from '@/components/shared/danger-zone';
import { HardDeleteConfirmation } from '@/components/shared/hard-delete-confirmation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { paths } from '@/config/routes';
import { useRouter } from '@/i18n/routing';
import { getErrorMessage } from '@/lib/parse-api-error';

import type { AdminUser } from '../../types';
import { useDeleteUser } from '../hooks/use-admin-users';

interface UserDetailsTabProps {
  user: AdminUser;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[200px_1fr]">
      <dt className="text-muted-foreground text-sm font-medium">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export function UserDetailsTab({ user }: UserDetailsTabProps) {
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('common');
  const format = useFormatter();
  const router = useRouter();
  const deleteUser = useDeleteUser();

  return (
    <div className="max-w-4xl space-y-6">
      {/* Section: User Info (read-only) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{t('sectionUserInfo')}</h3>
          <p className="text-muted-foreground text-sm">
            {t('sectionUserInfoDescription')}
          </p>
        </div>
        <Card>
          <CardContent className="space-y-3 pt-6">
            <InfoRow label={t('labelEmail')} value={user.email} />
            <InfoRow
              label={t('labelFirstName')}
              value={user.firstName ?? '-'}
            />
            <InfoRow
              label={t('labelLastName')}
              value={user.lastName ?? '-'}
            />
            <InfoRow
              label={t('labelCreatedAt')}
              value={format.dateTime(new Date(user.createdAt), {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Danger Zone */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
        <div />
        <DangerZone>
          <DangerZoneItem
            title={t('dangerZoneTitle')}
            description={t('dangerZoneDescription')}
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
    </div>
  );
}
