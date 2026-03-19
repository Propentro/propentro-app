'use client';

import { LoaderIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  inviteMemberDefaults,
  type InviteMemberInput,
  inviteMemberSchema,
} from '@/features/settings/members/validators/create-user.schema';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import type { InviteResult } from '../../types';
import { useInviteUser } from '../hooks/use-admin-org-invites';
import { useAdminOrgRoles } from '../hooks/use-admin-org-roles';

interface CreateInviteDialogProps {
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInviteDialog({
  organizationId,
  open,
  onOpenChange,
}: CreateInviteDialogProps) {
  const t = useTranslations('admin.organizations');
  const tCommon = useTranslations('common');
  const { data: rolesData } = useAdminOrgRoles(organizationId);
  const roles = rolesData?.items;
  const inviteMutation = useInviteUser(organizationId);

  function handleSubmit(values: InviteMemberInput) {
    inviteMutation.mutate(values, {
      onSuccess: (result: InviteResult) => {
        if (result.isDirectAdd) {
          toast.success(t('addMemberSuccess'));
        } else {
          toast.success(t('inviteSuccess'));
        }
        onOpenChange(false);
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('inviteError')));
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('inviteTitle')}</DialogTitle>
          <DialogDescription>{t('inviteDescription')}</DialogDescription>
        </DialogHeader>

        <Form<InviteMemberInput>
          key={String(open)}
          validationSchema={inviteMemberSchema}
          resetValues={inviteMemberDefaults}
          onSubmit={handleSubmit}
        >
          {({ register, formState: { errors }, setValue, watch }) => (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t('labelEmail')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('placeholderEmail')}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-destructive mt-1 text-xs">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="roleId">{t('labelRole')}</Label>
                  <Select
                    value={watch('roleId') ?? ''}
                    onValueChange={(value) =>
                      setValue('roleId', value ?? '', { shouldValidate: true })
                    }
                  >
                    <SelectTrigger id="roleId" className="w-full">
                      <SelectValue placeholder={t('inviteRolePlaceholder')}>
                        {roles?.find((r) => r.roleId === watch('roleId'))
                          ?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {roles?.map((role) => (
                        <SelectItem key={role.roleId} value={role.roleId}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.roleId && (
                    <p className="text-destructive mt-1 text-xs">
                      {errors.roleId.message}
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {tCommon('cancel')}
                </Button>
                <Button type="submit" disabled={inviteMutation.isPending}>
                  {inviteMutation.isPending && (
                    <LoaderIcon className="animate-spin" />
                  )}
                  {t('inviteButton')}
                </Button>
              </DialogFooter>
            </>
          )}
        </Form>
      </DialogContent>
    </Dialog>
  );
}
